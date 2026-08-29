export type Sender = "buyer" | "bot" | "staff";

export interface PriceBreakdown {
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  handlingFee: number;
  total: number;
}

export interface QuoteMeta {
  type: "quote";
  item: string;
  sku: string | null;
  quantity: number | null;
  unit: string | null;
  spec: string | null;
  inStock: boolean | null;
  priceBreakdown: PriceBreakdown | null;
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  meta?: QuoteMeta | null;
  createdAt: string;
}
