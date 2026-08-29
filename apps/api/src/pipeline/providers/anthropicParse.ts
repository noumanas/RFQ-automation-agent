import type { Message, Tool, ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import { anthropic, PARSING_MODEL } from "../../lib/anthropic.js";
import { ParsedSpecSchema, type ParsedSpec } from "../../types.js";
import { PARSE_SYSTEM_PROMPT } from "./prompts.js";

const PARSE_TOOL: Tool = {
  name: "record_parsed_spec",
  description: "Record the structured spec extracted from an RFQ message.",
  input_schema: {
    type: "object",
    properties: {
      item_raw: { type: "string" },
      quantity: { type: ["number", "null"] },
      unit: { type: ["string", "null"] },
      spec: { type: ["string", "null"] },
      deadline: { type: ["string", "null"], description: "ISO 8601 date, or null" },
      confidence_per_field: {
        type: "object",
        properties: {
          item: { type: "string", enum: ["high", "medium", "low"] },
          quantity: { type: "string", enum: ["high", "medium", "low"] },
          unit: { type: "string", enum: ["high", "medium", "low"] },
          spec: { type: "string", enum: ["high", "medium", "low"] },
          deadline: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["item", "quantity", "unit", "spec", "deadline"],
      },
    },
    required: ["item_raw", "quantity", "unit", "spec", "deadline", "confidence_per_field"],
  },
};

export async function parseRfqWithAnthropic(rawText: string): Promise<ParsedSpec> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set - parsing agent cannot run.");
  }

  const response: Message = await anthropic.messages.create({
    model: PARSING_MODEL,
    max_tokens: 1024,
    system: PARSE_SYSTEM_PROMPT,
    tools: [PARSE_TOOL],
    tool_choice: { type: "tool", name: "record_parsed_spec" },
    messages: [{ role: "user", content: rawText }],
  });

  const toolUse = response.content.find(
    (block): block is ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) throw new Error("Parsing agent did not return structured output.");

  return ParsedSpecSchema.parse(toolUse.input);
}
