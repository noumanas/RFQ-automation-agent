import { env } from "../env.js";
import type { ParsedSpec } from "../types.js";
import { parseRfqWithAnthropic } from "./providers/anthropicParse.js";
import { parseRfqWithGemini } from "./providers/geminiParse.js";

export async function parseRfq(rawText: string): Promise<ParsedSpec> {
  return env.LLM_PROVIDER === "gemini" ? parseRfqWithGemini(rawText) : parseRfqWithAnthropic(rawText);
}
