import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env.js";

export const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export const PARSING_MODEL = "claude-sonnet-5";
export const DRAFTING_MODEL = "claude-sonnet-5";
