import type { CSSProperties, ReactNode } from "react";
import { ChatIcon, CpuIcon, SparkleIcon, TagIcon, TargetIcon } from "./icons";

const VB_W = 900;
const VB_H = 520;

const SUPERVISOR = { cx: 450, iconCy: 34, boxY: 74, boxW: 200, boxH: 50 };
const AGENT_BOX_Y = 222;
const AGENT_BOX_W = 170;
const AGENT_BOX_H = 50;
const AGENT_ICON_Y = 190;
const TOOL_BOX_Y = 340;
const TOOL_BOX_H = 46;
const ICON_D = 44;

const AGENTS: { key: string; label: string; tool: string; icon: ReactNode; cx: number }[] = [
  { key: "parse", label: "Parsing Agent", tool: "LLM Structured Extraction", icon: <SparkleIcon size={18} />, cx: 135 },
  { key: "match", label: "Catalog Matching Agent", tool: "Fuzzy Match + SKU Lookup", icon: <TargetIcon size={18} />, cx: 345 },
  { key: "price", label: "Pricing Agent", tool: "Deterministic Pricing Engine", icon: <TagIcon size={18} />, cx: 555 },
  { key: "draft", label: "Drafting Agent", tool: "Reply Generation (LLM)", icon: <ChatIcon size={18} />, cx: 765 },
];

function pctX(px: number) {
  return `${(px / VB_W) * 100}%`;
}
function pctY(px: number) {
  return `${(px / VB_H) * 100}%`;
}
function iconWpct() {
  return `${(ICON_D / VB_W) * 100}%`;
}
function iconHpct() {
  return `${(ICON_D / VB_H) * 100}%`;
}

function IconBadge({ cx, cy, children }: { cx: number; cy: number; children: ReactNode }) {
  const style: CSSProperties = {
    position: "absolute",
    left: pctX(cx),
    top: pctY(cy),
    width: iconWpct(),
    height: iconHpct(),
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #0891b2, #0f172a)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 16px rgba(15, 23, 42, .25)",
  };
  return (
    <div className="arch-node" style={style}>
      {children}
    </div>
  );
}

function Box({
  cx,
  y,
  w,
  h,
  title,
  subtitle,
  tone = "agent",
}: {
  cx: number;
  y: number;
  w: number;
  h: number;
  title: string;
  subtitle?: string;
  tone?: "supervisor" | "agent" | "tool";
}) {
  const palette =
    tone === "supervisor"
      ? { border: "#0f172a", bg: "#fff", color: "#0f172a", weight: 700 }
      : tone === "agent"
        ? { border: "#0891b2", bg: "#fff", color: "#0f172a", weight: 700 }
        : { border: "#f59e0b", bg: "#fffbeb", color: "#92400e", weight: 600 };

  const style: CSSProperties = {
    position: "absolute",
    left: pctX(cx - w / 2),
    top: pctY(y),
    width: pctX(w),
    height: pctY(h),
    border: `1.5px solid ${palette.border}`,
    background: palette.bg,
    color: palette.color,
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "4px 8px",
    fontSize: 12.5,
    fontWeight: palette.weight,
    lineHeight: 1.25,
  };

  return (
    <div className="arch-node" style={style}>
      <div>{title}</div>
      {subtitle && <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.8, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

export function ArchitectureDiagram() {
  const agentBoxTop = AGENT_BOX_Y;
  const agentBoxBottom = AGENT_BOX_Y + AGENT_BOX_H;

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: `${VB_W} / ${VB_H}` }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <marker id="arch-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#94a3b8" />
          </marker>
        </defs>

        {/* supervisor -> each agent */}
        {AGENTS.map((a) => (
          <line
            key={`sup-${a.key}`}
            className="arch-line"
            x1={SUPERVISOR.cx}
            y1={SUPERVISOR.boxY + SUPERVISOR.boxH}
            x2={a.cx}
            y2={agentBoxTop}
            stroke="#94a3b8"
            strokeWidth={1.5}
            markerEnd="url(#arch-arrow)"
            strokeDasharray={1000}
          />
        ))}

        {/* agent <-> agent */}
        {AGENTS.slice(0, -1).map((a, i) => {
          const b = AGENTS[i + 1];
          const y = agentBoxTop + AGENT_BOX_H / 2;
          return (
            <line
              key={`peer-${a.key}`}
              className="arch-line"
              x1={a.cx + AGENT_BOX_W / 2}
              y1={y}
              x2={b.cx - AGENT_BOX_W / 2}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth={1.5}
              markerEnd="url(#arch-arrow)"
              markerStart="url(#arch-arrow)"
              strokeDasharray={1000}
            />
          );
        })}

        {/* agent -> tool */}
        {AGENTS.map((a) => (
          <line
            key={`tool-${a.key}`}
            className="arch-line"
            x1={a.cx}
            y1={agentBoxBottom}
            x2={a.cx}
            y2={TOOL_BOX_Y}
            stroke="#fbbf24"
            strokeWidth={1.5}
            markerEnd="url(#arch-arrow)"
            strokeDasharray={1000}
          />
        ))}
      </svg>

      <IconBadge cx={SUPERVISOR.cx} cy={SUPERVISOR.iconCy}>
        <CpuIcon size={20} />
      </IconBadge>
      <Box cx={SUPERVISOR.cx} y={SUPERVISOR.boxY} w={SUPERVISOR.boxW} h={SUPERVISOR.boxH} title="Confidence Orchestrator" tone="supervisor" />

      {AGENTS.map((a) => (
        <IconBadge key={`icon-${a.key}`} cx={a.cx} cy={AGENT_ICON_Y}>
          {a.icon}
        </IconBadge>
      ))}
      {AGENTS.map((a) => (
        <Box key={`box-${a.key}`} cx={a.cx} y={AGENT_BOX_Y} w={AGENT_BOX_W} h={AGENT_BOX_H} title={a.label} tone="agent" />
      ))}
      {AGENTS.map((a) => (
        <Box key={`tool-${a.key}`} cx={a.cx} y={TOOL_BOX_Y} w={AGENT_BOX_W} h={TOOL_BOX_H} title={a.tool} tone="tool" />
      ))}
    </div>
  );
}
