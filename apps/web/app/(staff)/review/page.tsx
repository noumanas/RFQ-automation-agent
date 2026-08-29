"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { StatusBadge } from "../../../components/StatusBadge";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4100";

type Quote = {
  id: string;
  status: string;
  confidence: string;
  warnings: string[];
  message: string;
  priceBreakdown: {
    unitPrice?: number;
    quantity?: number;
    total?: number;
    discountPct?: number;
  };
  createdAt: string;
  rfq: {
    rawText: string;
    source: string;
    sender: string;
    receivedAt: string;
    parsedSpec: {
      itemRaw: string;
      matchedSku: string | null;
      quantity: number | null;
      unit: string | null;
      spec: string | null;
    } | null;
  };
};

function fmtMoney(n?: number) {
  if (typeof n !== "number") return "-";
  return "PKR " + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function ReviewQueuePage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`${API_URL}/review-queue`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      setQuotes(await res.json());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: "approve" | "reject") {
    await fetch(`${API_URL}/review-queue/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewedBy: "staff" }),
    });
    setSelectedId(null);
    load();
  }

  const selected = quotes.find((q) => q.id === selectedId) ?? null;
  const hasPrice = selected && typeof selected.priceBreakdown?.total === "number";

  return (
    <div style={rootStyle}>
      <div style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Review queue</h2>
          <span style={countPillStyle}>{quotes.length}</span>
        </div>
        {error && <p style={{ color: "#b91c1c", padding: "0 16px", fontSize: 13 }}>{error}</p>}
        {quotes.length === 0 && !error && <p style={emptyHintStyle}>Nothing here yet.</p>}
        {quotes.map((q) => (
          <button key={q.id} onClick={() => setSelectedId(q.id)} style={listItemStyle(selectedId === q.id)}>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0f172a" }}>
              {q.rfq.parsedSpec?.itemRaw ?? q.rfq.rawText.slice(0, 40)}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <StatusBadge status={q.status} />
              <StatusBadge status={`conf_${q.confidence}`} label={`${q.confidence} confidence`} />
            </div>
          </button>
        ))}
      </div>

      <div style={detailWrapStyle}>
        {!selected ? (
          <p style={{ padding: 24, color: "#94a3b8" }}>Select a quote to review.</p>
        ) : (
          <div style={detailCardStyle}>
            <div style={detailHeaderStyle}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>{selected.rfq.parsedSpec?.itemRaw ?? "Unmatched item"}</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                  From {selected.rfq.sender} via {selected.rfq.source} &middot; {fmtTime(selected.rfq.receivedAt)}
                </p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <Section title="Original message">
              <blockquote style={quoteBlockStyle}>{selected.rfq.rawText}</blockquote>
            </Section>

            <Section title="Parsed spec">
              <div style={specGridStyle}>
                <SpecCell label="Quantity" value={selected.rfq.parsedSpec?.quantity ?? "-"} />
                <SpecCell label="Unit" value={selected.rfq.parsedSpec?.unit ?? "-"} />
                <SpecCell label="SKU" value={selected.rfq.parsedSpec?.matchedSku ?? "Unmatched"} />
                <SpecCell label="Spec" value={selected.rfq.parsedSpec?.spec ?? "-"} />
              </div>
            </Section>

            {selected.warnings.length > 0 && (
              <Section title="Flagged for review">
                <ul style={warningListStyle}>
                  {selected.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </Section>
            )}

            {hasPrice && (
              <Section title="Price">
                <div style={priceRowStyle}>
                  <span>
                    {selected.priceBreakdown.quantity} &times; {fmtMoney(selected.priceBreakdown.unitPrice)}
                  </span>
                  <span style={{ fontWeight: 800, color: "#0e7490" }}>{fmtMoney(selected.priceBreakdown.total)}</span>
                </div>
              </Section>
            )}

            <Section title="Draft reply">
              <div style={draftBubbleStyle}>{selected.message}</div>
            </Section>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => act(selected.id, "approve")} style={approveBtnStyle}>
                Approve &amp; send
              </button>
              <button onClick={() => act(selected.id, "reject")} style={rejectBtnStyle}>
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={sectionTitleStyle}>{title}</div>
      {children}
    </div>
  );
}

function SpecCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={specCellStyle}>
      <div style={specLabelStyle}>{label}</div>
      <div style={specValueStyle}>{value}</div>
    </div>
  );
}

const rootStyle: CSSProperties = { display: "flex", height: "100%" };

const sidebarStyle: CSSProperties = { width: 340, borderRight: "1px solid #e2e8f0", overflowY: "auto", background: "#fff" };

const sidebarHeaderStyle: CSSProperties = {
  padding: "14px 16px",
  display: "flex",
  alignItems: "center",
  gap: 8,
  borderBottom: "1px solid #f1f5f9",
};

const countPillStyle: CSSProperties = {
  background: "#f1f5f9",
  color: "#475569",
  borderRadius: 999,
  padding: "1px 8px",
  fontSize: 12,
  fontWeight: 700,
};

const emptyHintStyle: CSSProperties = { padding: "0 16px", fontSize: 13, color: "#94a3b8" };

function listItemStyle(active: boolean): CSSProperties {
  return {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "12px 16px",
    border: "none",
    borderBottom: "1px solid #f1f5f9",
    background: active ? "#ecfeff" : "#fff",
    cursor: "pointer",
    borderLeft: active ? "3px solid #0891b2" : "3px solid transparent",
  };
}

const detailWrapStyle: CSSProperties = { flex: 1, overflowY: "auto", background: "#f8fafc" };

const detailCardStyle: CSSProperties = { maxWidth: 640, margin: "0 auto", padding: 28 };

const detailHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 20,
  gap: 12,
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: ".05em",
  textTransform: "uppercase",
  color: "#94a3b8",
  fontWeight: 700,
  marginBottom: 8,
};

const quoteBlockStyle: CSSProperties = {
  margin: 0,
  padding: "10px 14px",
  borderLeft: "3px solid #e2e8f0",
  background: "#fff",
  borderRadius: "0 8px 8px 0",
  fontSize: 14,
  color: "#334155",
  lineHeight: 1.5,
};

const specGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#e2e8f0", borderRadius: 10, overflow: "hidden" };

const specCellStyle: CSSProperties = { background: "#fff", padding: "10px 14px" };
const specLabelStyle: CSSProperties = { fontSize: 10, letterSpacing: ".05em", color: "#94a3b8", textTransform: "uppercase" };
const specValueStyle: CSSProperties = { fontSize: 13, fontWeight: 700, color: "#0f172a", marginTop: 2 };

const warningListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  background: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: 8,
  padding: "10px 14px 10px 30px",
  color: "#92400e",
  fontSize: 13,
  lineHeight: 1.6,
};

const priceRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#ecfeff",
  borderRadius: 10,
  padding: "12px 16px",
  fontSize: 14,
  color: "#0e7490",
};

const draftBubbleStyle: CSSProperties = {
  background: "#eef2f6",
  color: "#0f172a",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 14,
  lineHeight: 1.5,
};

const approveBtnStyle: CSSProperties = {
  border: "none",
  background: "linear-gradient(135deg, #0891b2, #0f172a)",
  color: "#fff",
  borderRadius: 10,
  padding: "10px 18px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const rejectBtnStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#475569",
  borderRadius: 10,
  padding: "10px 18px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
