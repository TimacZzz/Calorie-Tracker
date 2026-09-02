import { prisma, Prisma } from "../db/prisma.js";

function parseTerms(raw) {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Ranked full-text search over `foods`.
 *
 * Ranking, in order of weight:
 *   0.8  description begins with the query and ends there or at a comma.
 *        USDA's naming grammar puts the head noun first and qualifies it
 *        after a comma, so "Rice, cooked" is rice and "Rice cake" is not.
 *   0.5  the food is the caller's own custom food.
 *   0.3  description merely begins with the query.
 *  -0.5  length penalty, capped, favouring generic entries over qualified ones.
 *   ts_rank contributes little — USDA descriptions are short and uniform, so
 *   nearly every match ties. It breaks the occasional tie and costs nothing.
 *
 * @param {object}      params
 * @param {string}      params.q       raw search text
 * @param {number|null} params.userId  include this user's custom foods; null for none
 * @param {number}      params.limit   page size
 * @param {number}      params.offset  rows to skip
 * @returns {Promise<{ results: object[], hasMore: boolean }>}
 */
export async function searchFoods({ q, userId = null, limit = 20, offset = 0 }) {
  const terms = parseTerms(q);
  if (terms.length === 0) return { results: [], hasMore: false };

  const tsquery = terms.map((t) => `${t}:*`).join(" & ");
  const prefix = terms.join(" ");

  // One extra row tells us whether a further page exists, without a COUNT.
  const rows = await prisma.$queryRaw`
    SELECT
      id,
      description,
      source,
      calories::float8   AS calories,
      protein_g::float8  AS "proteinG",
      fat_g::float8      AS "fatG",
      carbs_g::float8    AS "carbsG",
      fiber_g::float8    AS "fiberG",
      sugar_g::float8    AS "sugarG",
      sodium_mg::float8  AS "sodiumMg",
      user_id            AS "userId"
    FROM foods, to_tsquery('english', ${tsquery}) query
    WHERE (user_id IS NULL OR user_id = ${userId})
      AND search_vector @@ query
    ORDER BY
      ts_rank(search_vector, query, 32)
        - LEAST(char_length(description) / 250.0, 0.5)
        + CASE WHEN description ~* ('^' || ${prefix} || '($|,)') THEN 0.8 ELSE 0 END
        + CASE WHEN description ILIKE ${prefix} || '%' THEN 0.3 ELSE 0 END
        + CASE WHEN user_id IS NOT NULL THEN 0.5 ELSE 0 END
      DESC,
      id
    LIMIT ${limit + 1}
    OFFSET ${offset}
  `;

  return {
    results: rows.slice(0, limit),
    hasMore: rows.length > limit,
  };
}