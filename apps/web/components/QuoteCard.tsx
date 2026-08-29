import type { CSSProperties } from "react";
import type { QuoteMeta } from "../lib/types";

const LABEL: CSSProperties = { fontSize: 10, letterSpacing: ".05em", color: "#94a3b8", textTransform: "uppercase" };
const VALUE: CSSProperties = { fontSize: 13, fontWeight: 700, color: "#0f172a", marginTop: 2 };

function fmtMoney(n?: number | null) {
  if (typeof n !== "number") return "-";
  return "PKR " + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function Cell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", padding: "10px 14px" }}>
      <div style={LABEL}>{label}</div>
      <div style={VALUE}>{value}</div>
    </div>
  );
}

export function QuoteCard({ meta }: { meta: QuoteMeta }) {
  const pb = meta.priceBreakdown;
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", width: "100%", marginTop: 2 }}>
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid #e2e8f0",
          fontWeight: 700,
          fontSize: 13,
          color: "#0f172a",
          background: "#f1f5f9",
        }}
      >
        Quote
      </div>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={LABEL}>Item</div>
        <div style={{ ...VALUE, fontSize: 14 }}>{meta.item}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#f1f5f9" }}>
        <Cell label="Quantity" value={meta.quantity ?? "-"} />
        <Cell label="Unit price" value={fmtMoney(pb?.unitPrice)} />
        <Cell label="Spec" value={meta.spec || meta.unit || "-"} />
        <Cell label="In stock" value={meta.inStock ? "Yes" : "Check with team"} />
      </div>
      <div
        style={{
          padding: "12px 14px",
          background: "#ecfeff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 11, color: "#0e7490", fontWeight: 600 }}>Total</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0e7490" }}>{fmtMoney(pb?.total)}</div>
      </div>
    </div>
  );
}
