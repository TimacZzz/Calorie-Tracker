import { prisma } from "../db/prisma.js";

/**
 * Daily calorie and macro totals for one user over an inclusive date range.
 *
 * Knows nothing about HTTP. The caller supplies the bounds — the server has no
 * local "today" (see the date conventions), so this function never defaults one.
 *
 * @param {number} userId
 * @param {string} startDate inclusive, "YYYY-MM-DD"
 * @param {string} endDate   inclusive, "YYYY-MM-DD"
 * @returns {Promise<Array<{
 *   date: string, calories: number, proteinG: number, carbsG: number, fatG: number
 * }>>} one row per day that has at least one entry, ascending by date.
 *   Days with no entries are absent — densifying is the caller's decision.
 */
export async function getDailySeries(userId, startDate, endDate) {
  // COALESCE(s.gram_weight, 1) is resolveGrams() in SQL: a null serving means
  // quantity is already grams, so multiplying by 1 passes it through. The join
  // to food_servings MUST stay LEFT — an inner join silently drops every
  // grams-logged entry and returns a smaller number for the day with nothing
  // to flag it.
  //
  // Only the four non-nullable nutrients are summed. SUM() skips nulls rather
  // than propagating them, so adding fiber_g or sugar_g here would produce a
  // silent lower bound rather than an honest total.
  return prisma.$queryRaw`
    SELECT
      to_char(e.logged_on, 'YYYY-MM-DD') AS "date",
      SUM(e.quantity * COALESCE(s.gram_weight, 1) / 100.0 * f.calories)::float8  AS "calories",
      SUM(e.quantity * COALESCE(s.gram_weight, 1) / 100.0 * f.protein_g)::float8 AS "proteinG",
      SUM(e.quantity * COALESCE(s.gram_weight, 1) / 100.0 * f.carbs_g)::float8   AS "carbsG",
      SUM(e.quantity * COALESCE(s.gram_weight, 1) / 100.0 * f.fat_g)::float8     AS "fatG"
    FROM log_entries e
    JOIN foods f ON f.id = e.food_id
    LEFT JOIN food_servings s ON s.id = e.serving_id
    WHERE e.user_id = ${userId}
      AND e.logged_on BETWEEN ${startDate}::date AND ${endDate}::date
    GROUP BY e.logged_on
    ORDER BY e.logged_on ASC
  `;
}