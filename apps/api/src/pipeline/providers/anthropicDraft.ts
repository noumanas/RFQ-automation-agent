import { anthropic, DRAFTING_MODEL } from "../../lib/anthropic.js";
import type { DraftContext } from "../../types.js";
import { DRAFT_SYSTEM_PROMPT } from "./prompts.js";

export async function draftReplyWithAnthropic(context: DraftContext): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set - drafting layer cannot run.");
  }

  const response = await anthropic.messages.create({
    model: DRAFTING_MODEL,
    max_tokens: 300,
    system: DRAFT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify(context) }],
  });

  const text = response.content.find((block) => block.type === "text");
  return text && text.type === "text" ? text.text : "";
}
