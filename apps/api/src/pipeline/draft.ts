import { env } from "../env.js";
import type { DraftContext } from "../types.js";
import { draftReplyWithAnthropic } from "./providers/anthropicDraft.js";
import { draftReplyWithGemini } from "./providers/geminiDraft.js";

export async function draftReply(context: DraftContext): Promise<string> {
  return env.LLM_PROVIDER === "gemini" ? draftReplyWithGemini(context) : draftReplyWithAnthropic(context);
}
