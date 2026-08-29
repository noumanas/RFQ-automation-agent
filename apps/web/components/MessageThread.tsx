"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Message } from "../lib/types";
import { QuoteCard } from "./QuoteCard";
import { CopyIcon } from "./icons";

export function MessageThread({
  messages,
  isThinking,
  style,
}: {
  messages: Message[];
  isThinking?: boolean;
  style?: CSSProperties;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, isThinking]);

  useEffect(() => {
    if (!isThinking) {
      setThinkingSeconds(0);
      return;
    }
    const startedAt = Date.now();
    const interval = setInterval(() => setThinkingSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [isThinking]);

  function copy(msg: Message) {
    navigator.clipboard?.writeText(msg.text);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId((id) => (id === msg.id ? null : id)), 1200);
  }

  return (
    <div ref={listRef} style={{ ...messagesStyle, ...style }}>
      {messages.map((m) => (
        <div
          key={m.id}
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "88%",
            alignSelf: m.sender === "buyer" ? "flex-end" : "flex-start",
            alignItems: m.sender === "buyer" ? "flex-end" : "flex-start",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            {m.sender !== "buyer" && <div style={avatarStyle}>{m.sender === "staff" ? "S" : "A"}</div>}
            <div style={m.sender === "buyer" ? buyerBubbleStyle : otherBubbleStyle(m.sender)}>{m.text}</div>
          </div>
          {m.sender === "buyer" && (
            <button onClick={() => copy(m)} style={copyBtnStyle}>
              <CopyIcon size={12} /> {copiedId === m.id ? "Copied" : "Copy"}
            </button>
          )}
          {m.meta?.type === "quote" && <QuoteCard meta={m.meta} />}
        </div>
      ))}
      {isThinking && (
        <div style={{ display: "flex", flexDirection: "column", alignSelf: "flex-start", maxWidth: "88%" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={avatarStyle}>A</div>
            <div style={typingBubbleStyle}>
              <style>{`@keyframes rfq-typing-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: .4; } 30% { transform: translateY(-4px); opacity: 1; } }`}</style>
              <span style={dotStyle(0)} />
              <span style={dotStyle(0.15)} />
              <span style={dotStyle(0.3)} />
            </div>
          </div>
          {thinkingSeconds >= 3 && (
            <div style={thinkingHintStyle}>
              {thinkingSeconds >= 8 ? "Still checking stock and price…" : "Thinking…"} {thinkingSeconds}s
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const messagesStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  background: "#f8fafc",
};

const avatarStyle: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  background: "#0891b2",
  color: "#fff",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  fontWeight: 700,
};

const bubbleBase: CSSProperties = {
  padding: "9px 13px",
  borderRadius: 12,
  fontSize: 13,
  lineHeight: 1.45,
  whiteSpace: "pre-wrap",
};

const buyerBubbleStyle: CSSProperties = {
  ...bubbleBase,
  background: "linear-gradient(135deg, #0891b2, #0e7490)",
  color: "#fff",
  borderBottomRightRadius: 4,
};

function otherBubbleStyle(sender: "bot" | "staff"): CSSProperties {
  return {
    ...bubbleBase,
    background: sender === "staff" ? "#e0f2fe" : "#eef2f6",
    color: sender === "staff" ? "#0c4a6e" : "#0f172a",
    borderBottomLeftRadius: 4,
  };
}

const typingBubbleStyle: CSSProperties = {
  ...bubbleBase,
  background: "#eef2f6",
  borderBottomLeftRadius: 4,
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "12px 14px",
};

const thinkingHintStyle: CSSProperties = {
  fontSize: 11,
  color: "#94a3b8",
  marginTop: 4,
  marginLeft: 32,
};

function dotStyle(delay: number): CSSProperties {
  return {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#94a3b8",
    animation: "rfq-typing-bounce 1.2s infinite ease-in-out",
    animationDelay: `${delay}s`,
  };
}

const copyBtnStyle: CSSProperties = {
  marginTop: 4,
  background: "none",
  border: "none",
  color: "#94a3b8",
  cursor: "pointer",
  fontSize: 11,
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "2px 4px",
};
