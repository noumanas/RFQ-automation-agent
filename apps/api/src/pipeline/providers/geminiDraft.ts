import { gemini } from "../../lib/gemini.js";
import { env } from "../../env.js";
import type { DraftContext } from "../../types.js";
import { DRAFT_SYSTEM_PROMPT } from "./prompts.js";

export async function draftReplyWithGemini(context: DraftContext): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set - Gemini drafting layer cannot run.");
  }

  const model = gemini.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: DRAFT_SYSTEM_PROMPT,
  });

  const result = await model.generateContent(JSON.stringify(context));
  return result.response.text();
}
