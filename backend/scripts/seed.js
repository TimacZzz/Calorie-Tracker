/**
 * USDA seed script — foods and servings
 *
 * Phase 1  food.csv into memory
 * Phase 2  stream food_nutrient.csv, attach the nutrients we want
 * Phase 3  flatten to rows, resolve energy, drop and count
 * Phase 4  upsert foods on fdc_id
 * Phase 5  stream food_portion.csv, upsert food_servings on usda_portion_id
 *
 * Idempotent: both writes are INSERT ... ON CONFLICT DO UPDATE, so re-running
 * updates in place rather than duplicating or skipping.
 *
 * Usage (from backend/):
 *   node scripts/seed.js --dir=data/sr_legacy --dry-run
 *   node scripts/seed.js --dir=data/sr_legacy
 *   node scripts/seed.js --dir=data/fndds
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse";
import { prisma, Prisma } from "../src/db/prisma.js";

// ESM has no __dirname — see DECISIONS.md 2026-08-31
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "..");

// --- nutrient identifiers ------------------------------------------------
// The two datasets identify nutrients differently:
//   SR Legacy  food_nutrient.nutrient_id  ->  nutrient.id        (1003, 1008...)
//   FNDDS      food_nutrient.nutrient_id  ->  nutrient.nutrient_nbr (203, 208...)
// Both are accepted and collapsed onto a canonical key.
const NUTRIENT = {
  PROTEIN: ["1003", "203"],
  FAT: ["1004", "204"],
  CARBS: ["1005", "205"],
  ENERGY_KCAL: ["1008", "208"],
  ENERGY_KJ: ["1062", "268"],
  FIBER: ["1079", "291"],
  SODIUM_MG: ["1093", "307"],
  SUGAR: ["2000", "269"],
  ENERGY_ATWATER_GENERAL: ["2047", "957"],
  ENERGY_ATWATER_SPECIFIC: ["2048", "958"],
};

const ID_TO_KEY = new Map(
  Object.entries(NUTRIENT).flatMap(([key, ids]) => ids.map((id) => [id, key]))
);

const DATA_TYPE_TO_SOURCE = {
  sr_legacy_food: "SR_LEGACY",
  survey_fndds_food: "FNDDS",
};

// --- args ----------------------------------------------------------------
const args = process.argv.slice(2);
const dirArg = args.find((a) => a.startsWith("--dir="));
const DRY_RUN = args.includes("--dry-run");

if (!dirArg) {
  console.error("Missing --dir=<path>  e.g. --dir=data/sr_legacy");
  process.exit(1);
}

const DATA_DIR = path.resolve(BACKEND_ROOT, dirArg.slice("--dir=".length));

for (const f of ["food.csv", "food_nutrient.csv", "food_portion.csv"]) {
  const p = path.join(DATA_DIR, f);
  if (!fs.existsSync(p)) {
    console.error(`Not found: ${p}`);
    process.exit(1);
  }
}

const csvStream = (file) =>
  fs
    .createReadStream(path.join(DATA_DIR, file))
    .pipe(parse({ columns: true, skip_empty_lines: true, bom: true }));

// --- phase 1: food.csv into memory ---------------------------------------
async function loadFoods() {
  const foods = new Map(); // fdc_id -> { fdcId, description, source, nutrients }
  const skippedDataTypes = new Map();

  for await (const row of csvStream("food.csv")) {
    const source = DATA_TYPE_TO_SOURCE[row.data_type];
    if (!source) {
      skippedDataTypes.set(
        row.data_type,
        (skippedDataTypes.get(row.data_type) ?? 0) + 1
      );
      continue;
    }
    foods.set(row.fdc_id, {
      fdcId: Number(row.fdc_id),
      description: row.description.trim(),
      source,
      nutrients: {},
    });
  }

  return { foods, skippedDataTypes };
}

// --- phase 2: stream food_nutrient.csv -----------------------------------
async function attachNutrients(foods) {
  let rowsRead = 0;
  let rowsKept = 0;
  let unmatchedFdcIds = 0;

  for await (const row of csvStream("food_nutrient.csv")) {
    rowsRead++;

    const key = ID_TO_KEY.get(row.nutrient_id);
    if (!key) continue;

    const food = foods.get(row.fdc_id);
    if (!food) {
      unmatchedFdcIds++;
      continue;
    }

    const amount = Number(row.amount);
    if (!Number.isFinite(amount)) continue;

    food.nutrients[key] = amount;
    rowsKept++;

    if (rowsRead % 500_000 === 0) {
      process.stdout.write(`  ...${rowsRead.toLocaleString()} rows read\r`);
    }
  }

  process.stdout.write(" ".repeat(40) + "\r");
  return { rowsRead, rowsKept, unmatchedFdcIds };
}

// --- energy resolution ---------------------------------------------------
// Priority: measured kcal, then Atwater kcal, then kJ converted as a last
// resort. Returns [value, tier] so the dry run can report the spread.
function resolveCalories(n) {
  if (n.ENERGY_KCAL !== undefined) return [n.ENERGY_KCAL, "kcal (measured)"];
  if (n.ENERGY_ATWATER_SPECIFIC !== undefined)
    return [n.ENERGY_ATWATER_SPECIFIC, "atwater specific"];
  if (n.ENERGY_ATWATER_GENERAL !== undefined)
    return [n.ENERGY_ATWATER_GENERAL, "atwater general"];
  if (n.ENERGY_KJ !== undefined) return [n.ENERGY_KJ / 4.184, "kJ converted"];
  return [null, "none"];
}

// --- phase 3: shape rows and report --------------------------------------
const round2 = (v) => Math.round(v * 100) / 100;
const opt = (v) => (v === undefined ? null : round2(v));

function buildRows(foods) {
  const rows = [];
  const energyTiers = new Map();
  const dropped = { noEnergy: [], missingMacros: [] };

  for (const food of foods.values()) {
    const n = food.nutrients;
    const [calories, tier] = resolveCalories(n);
    energyTiers.set(tier, (energyTiers.get(tier) ?? 0) + 1);

    if (calories === null) {
      dropped.noEnergy.push(food.description);
      continue;
    }

    if (n.PROTEIN === undefined || n.FAT === undefined || n.CARBS === undefined) {
      dropped.missingMacros.push({
        description: food.description,
        missing: [
          n.PROTEIN === undefined && "protein",
          n.FAT === undefined && "fat",
          n.CARBS === undefined && "carbs",
        ].filter(Boolean),
      });
      continue;
    }

    rows.push({
      fdcId: food.fdcId,
      description: food.description,
      source: food.source,
      calories: round2(calories),
      proteinG: round2(n.PROTEIN),
      fatG: round2(n.FAT),
      carbsG: round2(n.CARBS),
      fiberG: opt(n.FIBER),
      sugarG: opt(n.SUGAR),
      sodiumMg: opt(n.SODIUM_MG),
    });
  }

  return { rows, energyTiers, dropped };
}

// --- phase 4: write foods ------------------------------------------------
// Prisma has no upsertMany, and per-row upsert is one round trip each, so this
// is a chunked INSERT ... ON CONFLICT. user_id is deliberately absent from both
// the column list and the UPDATE set: a re-run must never touch a custom food.
async function writeFoods(rows) {
  const CHUNK = 1000;
  let affected = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);

    const values = chunk.map(
      (r) => Prisma.sql`(
        ${r.fdcId}, ${r.description}, ${r.source}::"FoodSource",
        ${r.calories}, ${r.proteinG}, ${r.fatG}, ${r.carbsG},
        ${r.fiberG}, ${r.sugarG}, ${r.sodiumMg}
      )`
    );

    affected += await prisma.$executeRaw`
      INSERT INTO foods (
        fdc_id, description, source,
        calories, protein_g, fat_g, carbs_g,
        fiber_g, sugar_g, sodium_mg
      )
      VALUES ${Prisma.join(values)}
      ON CONFLICT (fdc_id) DO UPDATE SET
        description = EXCLUDED.description,
        source      = EXCLUDED.source,
        calories    = EXCLUDED.calories,
        protein_g   = EXCLUDED.protein_g,
        fat_g       = EXCLUDED.fat_g,
        carbs_g     = EXCLUDED.carbs_g,
        fiber_g     = EXCLUDED.fiber_g,
        sugar_g     = EXCLUDED.sugar_g,
        sodium_mg   = EXCLUDED.sodium_mg
    `;

    process.stdout.write(
      `  ...${affected.toLocaleString()} / ${rows.length.toLocaleString()}\r`
    );
  }

  process.stdout.write(" ".repeat(50) + "\r");
  return affected;
}

// --- phase 5: portions ---------------------------------------------------
// The two datasets carry the label in different columns, with no overlap:
//   SR Legacy  amount + modifier;  portion_description empty on all 14,449 rows
//   FNDDS      portion_description on all 22,046 rows;  amount always empty,
//              modifier holds an internal numeric code (10205, 90000...)
// So the row itself is the signal — no dataset flag needed.
//
// gram_weight is the weight of the WHOLE portion ("4 oz" -> 113g), not of one
// unit, so it is stored as given and never divided by amount.
const QNS = "Quantity not specified";
const GUIDELINE = "Guideline amount";

function buildServingDescription(row) {
  const pd = (row.portion_description ?? "").trim();
  if (pd) return pd; // FNDDS — already includes the quantity

  const mod = (row.modifier ?? "").trim();
  if (!mod) return null; // no label text at all

  // SR Legacy carries the quantity separately. A blank amount is not assumed
  // to be 1: the gram weight describes the portion as stated, and if the
  // quantity is missing there is no way to know what that weight is a weight of.
  const rawAmount = (row.amount ?? "").trim();
  if (!rawAmount) return null;

  const amt = Number(rawAmount);
  if (!Number.isFinite(amt) || amt <= 0) return null;

  // Always prefixed, including when amount is 1, so SR Legacy and FNDDS
  // servings read the same way in the dropdown.
  return `${amt.toString()} ${mod}`;
}

async function loadFoodIdMap() {
  const foods = await prisma.food.findMany({
    where: { fdcId: { not: null } },
    select: { id: true, fdcId: true },
  });
  return new Map(foods.map((f) => [f.fdcId, f.id]));
}

async function buildServingRows(foodIdMap) {
  const rows = [];
  const dropped = { qns: 0, badWeight: 0, orphan: 0, noLabel: 0, guideline: 0 };
  let rowsRead = 0;

  for await (const row of csvStream("food_portion.csv")) {
    rowsRead++;

    // QNS is checked first: one of those rows also carries a zero weight and
    // would otherwise land in the wrong bucket.
    if ((row.portion_description ?? "").trim().startsWith(QNS)) {
      dropped.qns++;
      continue;
    }

    // FNDDS survey coefficients — rates rather than portions ("Guideline
    // amount per fl oz of beverage", 2.5g). 313 rows; the 18 foods left
    // grams-only are recipe components like "Lettuce, for use on a sandwich".
    if ((row.portion_description ?? "").trim().startsWith(GUIDELINE)) {
      dropped.guideline++;
      continue;
    }

    const grams = Number(row.gram_weight);
    if (!Number.isFinite(grams) || grams <= 0) {
      dropped.badWeight++;
      continue;
    }

    const foodId = foodIdMap.get(Number(row.fdc_id));
    if (foodId === undefined) {
      dropped.orphan++;
      continue;
    }

    const description = buildServingDescription(row);
    if (!description) {
      dropped.noLabel++;
      continue;
    }

    rows.push({
      foodId,
      usdaPortionId: Number(row.id),
      description,
      gramWeight: round2(grams),
    });
  }

  return { rows, dropped, rowsRead };
}

async function writeServings(rows) {
  const CHUNK = 1000;
  let affected = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);

    const values = chunk.map(
      (r) =>
        Prisma.sql`(${r.foodId}, ${r.usdaPortionId}, ${r.description}, ${r.gramWeight})`
    );

    affected += await prisma.$executeRaw`
      INSERT INTO food_servings (food_id, usda_portion_id, description, gram_weight)
      VALUES ${Prisma.join(values)}
      ON CONFLICT (usda_portion_id) DO UPDATE SET
        food_id     = EXCLUDED.food_id,
        description = EXCLUDED.description,
        gram_weight = EXCLUDED.gram_weight
    `;

    process.stdout.write(
      `  ...${affected.toLocaleString()} / ${rows.length.toLocaleString()}\r`
    );
  }

  process.stdout.write(" ".repeat(50) + "\r");
  return affected;
}

// --- main ----------------------------------------------------------------
async function main() {
  const started = Date.now();
  console.log(`\nReading ${DATA_DIR}\n`);

  console.log("Phase 1: food.csv");
  const { foods, skippedDataTypes } = await loadFoods();
  console.log(`  ${foods.size.toLocaleString()} foods loaded`);
  for (const [type, count] of skippedDataTypes) {
    console.log(`  skipped ${count.toLocaleString()} rows of data_type "${type}"`);
  }

  console.log("\nPhase 2: food_nutrient.csv");
  const { rowsRead, rowsKept, unmatchedFdcIds } = await attachNutrients(foods);
  console.log(
    `  ${rowsRead.toLocaleString()} rows read, ${rowsKept.toLocaleString()} kept`
  );
  if (unmatchedFdcIds) {
    console.log(
      `  ${unmatchedFdcIds.toLocaleString()} wanted rows had no matching food`
    );
  }

  console.log("\nPhase 3: flatten");
  const { rows, energyTiers, dropped } = buildRows(foods);

  console.log("\n  Energy source:");
  for (const [tier, count] of [...energyTiers].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(count).padStart(6)}  ${tier}`);
  }

  console.log(`\n  ${rows.length.toLocaleString()} rows ready`);
  console.log(`  ${dropped.noEnergy.length} dropped — no energy value`);
  console.log(`  ${dropped.missingMacros.length} dropped — missing macros`);

  if (dropped.noEnergy.length) {
    console.log("\n  Sample, no energy:");
    dropped.noEnergy.slice(0, 5).forEach((d) => console.log(`    ${d}`));
  }
  if (dropped.missingMacros.length) {
    console.log("\n  Sample, missing macros:");
    dropped.missingMacros
      .slice(0, 5)
      .forEach((d) => console.log(`    ${d.description} — ${d.missing.join(", ")}`));
  }

  console.log("\n  Sample of what would be written:");
  console.table(rows.slice(0, 5));

  if (DRY_RUN) {
    console.log("\nDry run — nothing written. Portions need the written foods");
    console.log("to resolve against, so phase 5 is skipped entirely.\n");
    return;
  }

  console.log("\nPhase 4: write foods");
  const foodsAffected = await writeFoods(rows);
  console.log(`  ${foodsAffected.toLocaleString()} rows inserted or updated`);

  console.log("\nPhase 5: food_portion.csv");
  const foodIdMap = await loadFoodIdMap();
  console.log(
    `  ${foodIdMap.size.toLocaleString()} seeded foods available to match against`
  );

  const {
    rows: servingRows,
    dropped: sDropped,
    rowsRead: portionRowsRead,
  } = await buildServingRows(foodIdMap);

  console.log(`  ${portionRowsRead.toLocaleString()} portion rows read`);
  console.log(`  ${servingRows.length.toLocaleString()} ready`);
  console.log(`  ${sDropped.qns.toLocaleString()} dropped — "${QNS}"`);
  console.log(`  ${sDropped.guideline.toLocaleString()} dropped — "${GUIDELINE}..." coefficients`);
  console.log(
    `  ${sDropped.badWeight.toLocaleString()} dropped — zero or bad gram weight`
  );
  console.log(`  ${sDropped.orphan.toLocaleString()} dropped — no matching food`);
  console.log(`  ${sDropped.noLabel.toLocaleString()} dropped — no usable amount or label`);

  console.log("\n  Sample servings:");
  console.table(servingRows.slice(0, 5));

  const servingsAffected = await writeServings(servingRows);
  console.log(`  ${servingsAffected.toLocaleString()} servings inserted or updated`);

  console.log("\nSummary");
  console.log(`  foods:         ${(await prisma.food.count()).toLocaleString()}`);
  console.log(
    `  food_servings: ${(await prisma.foodServing.count()).toLocaleString()}`
  );

  console.log(`\nDone in ${((Date.now() - started) / 1000).toFixed(1)}s\n`);
}

main()
  .catch((e) => {
    console.error("\nFailed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());