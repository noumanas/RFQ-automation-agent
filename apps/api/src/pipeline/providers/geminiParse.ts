import { FunctionCallingMode, SchemaType, type FunctionDeclarationsTool } from "@google/generative-ai";
import { gemini } from "../../lib/gemini.js";
import { env } from "../../env.js";
import { ParsedSpecSchema, type ParsedSpec } from "../../types.js";
import { PARSE_SYSTEM_PROMPT } from "./prompts.js";

const CONFIDENCE_ENUM = ["high", "medium", "low"];

const PARSE_TOOL: FunctionDeclarationsTool = {
  functionDeclarations: [
    {
      name: "record_parsed_spec",
      description: "Record the structured spec extracted from an RFQ message.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          item_raw: { type: SchemaType.STRING },
          quantity: { type: SchemaType.NUMBER, nullable: true },
          unit: { type: SchemaType.STRING, nullable: true },
          spec: { type: SchemaType.STRING, nullable: true },
          deadline: { type: SchemaType.STRING, nullable: true, description: "ISO 8601 date, or null" },
          confidence_per_field: {
            type: SchemaType.OBJECT,
            properties: {
              item: { type: SchemaType.STRING, format: "enum", enum: CONFIDENCE_ENUM },
              quantity: { type: SchemaType.STRING, format: "enum", enum: CONFIDENCE_ENUM },
              unit: { type: SchemaType.STRING, format: "enum", enum: CONFIDENCE_ENUM },
              spec: { type: SchemaType.STRING, format: "enum", enum: CONFIDENCE_ENUM },
              deadline: { type: SchemaType.STRING, format: "enum", enum: CONFIDENCE_ENUM },
            },
            required: ["item", "quantity", "unit", "spec", "deadline"],
          },
        },
        required: ["item_raw", "quantity", "unit", "spec", "deadline", "confidence_per_field"],
      },
    },
  ],
};

export async function parseRfqWithGemini(rawText: string): Promise<ParsedSpec> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set - Gemini parsing agent cannot run.");
  }

  const model = gemini.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: PARSE_SYSTEM_PROMPT,
    tools: [PARSE_TOOL],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingMode.ANY,
        allowedFunctionNames: ["record_parsed_spec"],
      },
    },
  });

  const result = await model.generateContent(rawText);
  const call = result.response.functionCalls()?.[0];
  if (!call) throw new Error("Gemini parsing agent did not return a function call.");

  return ParsedSpecSchema.parse(call.args);
}
