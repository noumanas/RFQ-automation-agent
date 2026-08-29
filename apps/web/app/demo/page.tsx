"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChatWidget } from "../../components/ChatWidget";
import { Logo } from "../../components/Logo";
import { AttachIcon, SendIcon, SparkleIcon } from "../../components/icons";
import { useConversation } from "../../lib/useConversation";
import type { Message } from "../../lib/types";

const THINKING_TIMEOUT_MS = 30000;

const EXAMPLES = [
  { label: "10 Inverex Jollywood 620W Panels", text: "Need 10 Inverex Jollywood 620W steel frame solar panels, best price and stock status please" },
  { label: "2000 pcs 3mm Acrylic Sheet 12x18", text: "2000 pcs 3mm acrylic sheet, size 12x18, what's your best rate?" },
  { label: "5 Dahua CCTV Cameras", text: "Need 5 Dahua IPC outdoor CCTV cameras, please quote" },
  { label: "100m Copper Wire Cable", text: "100 meter reel of copper wire cable, 2.5mm - price?" },
  { label: "50 LED Bulbs 9W", text: "50 pcs LED bulb 9W - rate per piece?" },
  { label: "20 MCB Breakers 32A", text: "20 MCB circuit breakers 32A single pole - available? price?" },
];

type StatusKind = "thinking" | "ok" | "info";
type Status = { kind: StatusKind; content: ReactNode };

function TimeTag({ children, kind }: { children: ReactNode; kind: StatusKind }) {
  const dotColor = kind === "ok" ? "#10b981" : kind === "info" ? "#f59e0b" : "#0891b2";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "rgba(255,255,255,.6)",
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor }} />
      {children}
    </span>
  );
}

export default function DemoPage() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [textarea, setTextarea] = useState(EXAMPLES[0].text);
  const [activeChip, setActiveChip] = useState(0);
  const [attachLabel, setAttachLabel] = useState("Attach");
  const [status, setStatus] = useState<Status | null>(null);

  const pendingSinceRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearPending() {
    if (tickRef.current) clearInterval(tickRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    tickRef.current = null;
    timeoutRef.current = null;
    pendingSinceRef.current = null;
  }

  function handleBotMessage(msg: Message) {
    if (!pendingSinceRef.current) return;
    const elapsed = ((Date.now() - pendingSinceRef.current) / 1000).toFixed(1);

    if (msg.meta?.type === "quote") {
      const total = msg.meta.priceBreakdown?.total;
      const amount = typeof total === "number" ? `PKR ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "ready";
      setStatus({
        kind: "ok",
        content: (
          <>
            Estimate ready <b>{amount}</b> <TimeTag kind="ok">in {elapsed}s</TimeTag>
          </>
        ),
      });
    } else {
      setStatus({
        kind: "info",
        content: (
          <>
            Needs one more detail <TimeTag kind="info">in {elapsed}s</TimeTag> - reply in the chat
          </>
        ),
      });
    }
    clearPending();
  }

  const { messages, send, isThinking } = useConversation(handleBotMessage);

  async function sendAndOpen(text: string) {
    setPanelOpen(true);
    await send(text);
  }

  function submitHero() {
    const text = textarea.trim();
    if (!text) return;

    pendingSinceRef.current = Date.now();
    setStatus({ kind: "thinking", content: "Thinking..." });
    tickRef.current = setInterval(() => {
      const since = pendingSinceRef.current;
      if (!since) return;
      const elapsed = ((Date.now() - since) / 1000).toFixed(1);
      setStatus({
        kind: "thinking",
        content: <>Thinking... <TimeTag kind="thinking">{elapsed}s</TimeTag></>,
      });
    }, 200);
    timeoutRef.current = setTimeout(() => {
      setStatus({ kind: "info", content: "Taking longer than usual - check the chat for the full reply." });
      clearPending();
    }, THINKING_TIMEOUT_MS);

    void sendAndOpen(text);
  }

  function selectChip(i: number) {
    setActiveChip(i);
    setTextarea(EXAMPLES[i].text);
  }

  function clickAttach() {
    setAttachLabel("Coming soon");
    setTimeout(() => setAttachLabel("Attach"), 1500);
  }

  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>
        <header style={brandStyle}>
          <Logo size={28} />
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}>Rfqly</div>
        </header>

        <h1 style={h1Style}>
          <strong style={{ color: "#0f172a", fontWeight: 700 }}>Rfqly</strong> is the AI quoting agent for
          distributors &amp; wholesalers.
          <br />
          It reads the request, checks stock and price, and replies in minutes.
        </h1>

        <div style={heroCardStyle}>
          <div style={heroLabelStyle}>
            <div style={heroLabelIconStyle}>
              <SparkleIcon size={14} />
            </div>
            Describe what you need, we&apos;ll quote it
          </div>
          <textarea
            value={textarea}
            onChange={(e) => setTextarea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitHero();
              }
            }}
            placeholder="e.g. need 10 Inverex Jollywood 620W panels, steel frame"
            style={textareaStyle}
          />
          <div style={heroActionsStyle}>
            <button type="button" onClick={clickAttach} style={attachButtonStyle} title="Attach a spec sheet or photo (coming soon)">
              <AttachIcon size={14} /> {attachLabel}
            </button>
            <button type="button" onClick={submitHero} style={heroSendStyle} aria-label="Send">
              <SendIcon size={17} />
            </button>
          </div>
        </div>

        <div style={chipsStyle}>
          {EXAMPLES.map((ex, i) => (
            <button key={ex.label} type="button" onClick={() => selectChip(i)} style={chipStyle(i === activeChip)}>
              {ex.label}
            </button>
          ))}
        </div>

        <div style={statusWrapStyle}>
          {status && (
            <div style={statusPillStyle(status.kind)}>
              <SparkleIcon size={14} />
              <span>{status.content}</span>
            </div>
          )}
        </div>

        <p style={footNoteStyle}>
          This is a live demo against the real pipeline — the floating chat bubble in the corner holds the full
          conversation, including any follow-up questions.
        </p>
      </div>

      <ChatWidget
        title="Rfqly"
        open={panelOpen}
        onToggle={() => setPanelOpen((v) => !v)}
        messages={messages}
        onSend={sendAndOpen}
        isThinking={isThinking}
        variant="modal"
      />
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  color: "#0f172a",
  background:
    "radial-gradient(circle at 20% 0%, #ecfeff 0%, transparent 55%), radial-gradient(circle at 85% 15%, #f0f9ff 0%, transparent 50%), #f8fafc",
};

const wrapStyle: CSSProperties = { maxWidth: 780, margin: "0 auto", padding: "72px 24px 48px" };

const brandStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 28 };

const h1Style: CSSProperties = {
  textAlign: "center",
  fontSize: 30,
  fontWeight: 600,
  color: "#475569",
  lineHeight: 1.4,
  margin: "0 0 40px",
  letterSpacing: "-0.01em",
};

const heroCardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  boxShadow: "0 12px 40px rgba(15, 23, 42, .08)",
  padding: "22px 24px",
};

const heroLabelStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 10, color: "#94a3b8", fontSize: 13, marginBottom: 14 };

const heroLabelIconStyle: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 9,
  background: "linear-gradient(135deg, #0891b2, #0f172a)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  flexShrink: 0,
};

const textareaStyle: CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  resize: "none",
  fontFamily: "inherit",
  fontSize: 19,
  lineHeight: 1.5,
  color: "#0f172a",
  minHeight: 110,
  padding: 0,
};

const heroActionsStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 };

const attachButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#475569",
  borderRadius: 20,
  padding: "8px 16px",
  fontSize: 13,
  cursor: "pointer",
};

const heroSendStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  border: "none",
  cursor: "pointer",
  background: "linear-gradient(135deg, #0891b2, #0f172a)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const chipsStyle: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 24 };

function chipStyle(active: boolean): CSSProperties {
  return {
    border: active ? "1px solid transparent" : "1px solid #e2e8f0",
    background: active ? "linear-gradient(135deg, #0891b2, #0e7490)" : "#fff",
    color: active ? "#fff" : "#475569",
    borderRadius: 999,
    padding: "11px 20px",
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontWeight: active ? 600 : 400,
  };
}

const statusWrapStyle: CSSProperties = { display: "flex", justifyContent: "center", marginTop: 28, minHeight: 40 };

function statusPillStyle(kind: StatusKind): CSSProperties {
  const palette =
    kind === "ok"
      ? { background: "#ecfdf5", color: "#047857" }
      : kind === "info"
        ? { background: "#fffbeb", color: "#92400e" }
        : { background: "#fff", color: "#475569", border: "1px solid #e2e8f0" };
  return { display: "flex", alignItems: "center", gap: 10, borderRadius: 999, padding: "10px 20px", fontSize: 14, ...palette };
}

const footNoteStyle: CSSProperties = { textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 40 };
