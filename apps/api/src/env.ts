import "dotenv/config";
import { z } from "zod";

const optionalString = () => z.preprocess((v) => (v === "" ? undefined : v), z.string().min(1).optional());

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ANTHROPIC_API_KEY: optionalString(),
  GEMINI_API_KEY: optionalString(),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.6-flash"),
  LLM_PROVIDER: z.enum(["anthropic", "gemini"]).default("anthropic"),
  PORT: z.coerce.number().default(4000),
});

export const env = EnvSchema.parse(process.env);
