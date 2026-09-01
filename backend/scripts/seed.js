/**
 * Day 3 — USDA seed script, part 1: nutrients
 *
 * Reads food.csv into memory, streams food_nutrient.csv, flattens the nutrients
 * we care about into columns, and writes to the foods table.
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
import { prisma } from "../src/db/prisma.js";

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

for (const f of ["food.csv", "food_nutrient.csv"]) {
  const p = path.join(DATA_DIR, f);
  if (!fs.existsSync(p)) {
    console.error(`Not found: ${p}`);
    process.exit(1);
  }
}

// --- phase 1: food.csv into memory ---------------------------------------
async function loadFoods() {
  const foods = new Map(); // fdc_id -> { fdcId, description, source, nutrients }
  const skippedDataTypes = new Map();

  const stream = fs
    .createReadStream(path.join(DATA_DIR, "food.csv"))
    .pipe(parse({ columns: true, skip_empty_lines: true, bom: true }));

  for await (const row of stream) {
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

  const stream = fs
    .createReadStream(path.join(DATA_DIR, "food_nutrient.csv"))
    .pipe(parse({ columns: true, skip_empty_lines: true, bom: true }));

  for await (const row of stream) {
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

// --- phase 4: write ------------------------------------------------------
async function write(rows) {
  // createMany for the first pass. Day 4 replaces this with an upsert on
  // fdcId so re-running updates rather than skips.
  const CHUNK = 1000;
  let written = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const result = await prisma.food.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    written += result.count;
    process.stdout.write(
      `  ...${written.toLocaleString()} / ${rows.length.toLocaleString()} written\r`
    );
  }

  process.stdout.write(" ".repeat(50) + "\r");
  return written;
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
    console.log("\nDry run — nothing written.\n");
    return;
  }

  console.log("\nPhase 4: write");
  const written = await write(rows);
  console.log(`  ${written.toLocaleString()} rows inserted`);

  const total = await prisma.food.count();
  console.log(`  foods table now holds ${total.toLocaleString()} rows`);

  console.log(`\nDone in ${((Date.now() - started) / 1000).toFixed(1)}s\n`);
}

main()
  .catch((e) => {
    console.error("\nFailed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());