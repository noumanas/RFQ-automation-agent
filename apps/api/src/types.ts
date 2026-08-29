import { z } from "zod";

export const ConfidenceLevel = z.enum(["high", "medium", "low"]);

export const ParsedSpecSchema = z.object({
  item_raw: z.string(),
  quantity: z.number().nullable(),
  unit: z.string().nullable(),
  spec: z.string().nullable(),
  deadline: z.string().nullable(),
  confidence_per_field: z.object({
    item: ConfidenceLevel,
    quantity: ConfidenceLevel,
    unit: ConfidenceLevel,
    spec: ConfidenceLevel,
    deadline: ConfidenceLevel,
  }),
});
export type ParsedSpec = z.infer<typeof ParsedSpecSchema>;

export interface NormalizedMessage {
  source: "whatsapp" | "email";
  rawText: string;
  attachments: string[];
  senderId: string;
  receivedAt: Date;
}

export interface CatalogMatch {
  sku: string;
  name: string;
  unitPrice: number;
  stockQty: number;
  score: number;
}

export interface PriceBreakdown {
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  handlingFee: number;
  total: number;
}

export interface ConfidenceResult {
  autoSend: boolean;
  overall: "high" | "medium" | "low";
  reasons: string[];
}

export interface DraftContext {
  itemName: string | null;
  quantity: number | null;
  unit: string | null;
  inStock: boolean | null;
  priceBreakdown: PriceBreakdown | null;
  missingField: string | null;
  mustEscalate: boolean;
}
