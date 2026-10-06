import { z } from "zod";
import { httpError } from "./httpError.js"; // match httpError.js's export style

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

export async function parseFoodText(text) {
  const apiKey = process.env.GROQ_API_KEY; // read at call time, not import time
  if (!apiKey) throw httpError(503, "AI parsing is not configured");

  const res = await fetch(GROQ_URL, {
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

  // fetch does not reject on 4xx/5xx — without this, a bad key looks like a schema failure
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const parsed = responseSchema.safeParse(
    JSON.parse(data.choices[0].message.content)
  );
  if (!parsed.success) throw new Error("AI response did not match schema");
  return parsed.data.items;
}