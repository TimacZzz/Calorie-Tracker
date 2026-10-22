import { z } from "zod";
import { httpError } from "./httpError.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You extract foods from a meal description.
Respond with json only, in exactly this shape:
{"items":[{"foodName":"scrambled egg","quantity":2,"unit":null}]}
Rules:
- foodName: a short, generic name for the food.
- quantity: a positive number. If none is stated, use 1.
- unit: the unit the user said ("slice", "cup", "g"), or null if none.
- Never include calories, macros, or any nutrition values.
- If the text contains no food, return {"items":[]}.`;

const itemSchema = z
  .object({
    foodName: z.string().trim().min(1),
    quantity: z.number().positive(),
    unit: z.string().trim().min(1).nullable(),
  })
  .strict();

const responseSchema = z.object({ items: z.array(itemSchema) }).strict();

// One call to Groq. Returns the raw message content string.
async function callModel(text, apiKey) {
  let res;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL,
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 4000, // gpt-oss reasons first; reasoning tokens count against this
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text }, // user text never goes in the system prompt
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    if (err.name === "TimeoutError") throw httpError(504, "AI request timed out");
    throw err;
  }

  // fetch does not reject on 4xx/5xx. Not retried: a bad key or model fails the same way twice.
  if (!res.ok) throw httpError(502, `Groq ${res.status}: ${await res.text()}`);

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Returns the items, or null if the content is not valid JSON of the right shape.
function parseContent(content) {
  let json;
  try {
    json = JSON.parse(content);
  } catch {
    return null;
  }
  const parsed = responseSchema.safeParse(json);
  return parsed.success ? parsed.data.items : null;
}

export async function parseFoodText(text) {
  const apiKey = process.env.GROQ_API_KEY; // read at call time, not import time
  if (!apiKey) throw httpError(503, "AI parsing is not configured");

  // Two attempts. Only bad output is retried; HTTP errors and timeouts throw immediately.
  for (let attempt = 1; attempt <= 2; attempt++) {
    const items = parseContent(await callModel(text, apiKey));
    if (items) return items;
  }
  throw httpError(502, "AI response could not be parsed");
}
