import { prisma } from "../lib/prisma.js";
import type { CatalogMatch } from "../types.js";

const CONFIDENT_MATCH_THRESHOLD = 0.6;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function overlapScore(a: string, b: string): number {
  const aTokens = new Set(normalize(a).split(" ").filter(Boolean));
  const bTokens = new Set(normalize(b).split(" ").filter(Boolean));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  let shared = 0;
  for (const t of aTokens) if (bTokens.has(t)) shared++;
  return shared / Math.max(aTokens.size, bTokens.size);
}

/**
 * Token-overlap scoring stands in for embedding similarity until a vector
 * store (pgvector) is wired up - swap this for real embeddings before relying
 * on it for anything beyond exact SKU/alias matches.
 */
export async function matchCatalog(itemRaw: string, spec?: string | null): Promise<CatalogMatch | null> {
  const catalog = await prisma.catalog.findMany();

  // The parsing agent splits qualifiers like "3mm, 12x18" into `spec` separately
  // from `item_raw` - fold them back together so catalog names/aliases that
  // bundle the spec in (e.g. "3mm acrylic sheet 12x18") can still match.
  const queryText = spec ? `${itemRaw} ${spec}` : itemRaw;

  const exact = catalog.find(
    (c) =>
      c.sku.toLowerCase() === itemRaw.toLowerCase() ||
      (c.aliases as string[]).some(
        (a) => a.toLowerCase() === itemRaw.toLowerCase() || a.toLowerCase() === queryText.toLowerCase()
      )
  );
  if (exact) {
    return { sku: exact.sku, name: exact.name, unitPrice: exact.unitPrice, stockQty: exact.stockQty, score: 1 };
  }

  let best: CatalogMatch | null = null;
  for (const c of catalog) {
    const candidates = [c.name, ...(c.aliases as string[])];
    const score = Math.max(...candidates.map((cand) => overlapScore(queryText, cand)));
    if (!best || score > best.score) {
      best = { sku: c.sku, name: c.name, unitPrice: c.unitPrice, stockQty: c.stockQty, score };
    }
  }

  return best && best.score >= CONFIDENT_MATCH_THRESHOLD ? best : null;
}
