import type { CSSProperties } from "react";

const PALETTE: Record<string, { bg: string; color: string }> = {
  auto_sent: { bg: "#ecfdf5", color: "#047857" },
  pending_review: { bg: "#fffbeb", color: "#92400e" },
  approved_sent: { bg: "#ecfeff", color: "#0e7490" },
  rejected: { bg: "#fef2f2", color: "#b91c1c" },
  bot: { bg: "#f1f5f9", color: "#475569" },
  staff: { bg: "#ecfeff", color: "#0e7490" },
  closed: { bg: "#f1f5f9", color: "#94a3b8" },
  conf_high: { bg: "#ecfdf5", color: "#047857" },
  conf_medium: { bg: "#fffbeb", color: "#92400e" },
  conf_low: { bg: "#fef2f2", color: "#b91c1c" },
};

const DEFAULT = { bg: "#f1f5f9", color: "#475569" };

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const palette = PALETTE[status] ?? DEFAULT;
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 600,
    background: palette.bg,
    color: palette.color,
    whiteSpace: "nowrap",
  };
  return <span style={style}>{label ?? status.replace(/_/g, " ")}</span>;
}
