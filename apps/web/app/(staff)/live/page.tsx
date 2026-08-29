"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MessageThread } from "../../../components/MessageThread";
import { StatusBadge } from "../../../components/StatusBadge";
import { SendIcon } from "../../../components/icons";
import type { Message } from "../../../lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4100";
const WS_URL = API_URL.replace(/^http/, "ws");

type ConversationSummary = {
  id: string;
  visitorId: string;
  status: "bot" | "staff" | "closed";
  needsAttention: boolean;
  staffName: string | null;
  createdAt: string;
  messages: Message[];
};

type ConversationDetail = ConversationSummary & { messages: Message[] };

function getStaffName(): string {
  if (typeof window === "undefined") return "staff";
  let name = localStorage.getItem("rfq_staff_name");
  if (!name) {
    name = window.prompt("Your name (shown to buyers when you take over a chat):") || "Staff";
    localStorage.setItem("rfq_staff_name", name);
  }
  return name;
}

export default function LiveConversationsPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [draft, setDraft] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const staffNameRef = useRef<string>("");

  useEffect(() => {
    staffNameRef.current = getStaffName();
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/conversations`)
      .then((res) => res.json())
      .then(setConversations)
      .catch(() => {});

    const socket = new WebSocket(`${WS_URL}/ws/staff`);
    socketRef.current = socket;

    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "conversation_created") {
        setConversations((prev) => [data.conversation, ...prev]);
      }

      if (data.type === "message") {
        setConversations((prev) => {
          const next = prev.map((c) => (c.id === data.conversationId ? { ...c, messages: [data.message] } : c));
          return next.sort(
            (a, b) =>
              new Date(b.messages[0]?.createdAt ?? b.createdAt).getTime() -
              new Date(a.messages[0]?.createdAt ?? a.createdAt).getTime()
          );
        });
        setDetail((prev) =>
          prev && prev.id === data.conversationId ? { ...prev, messages: [...prev.messages, data.message] } : prev
        );
      }

      if (data.type === "status_changed") {
        setConversations((prev) =>
          prev.map((c) => (c.id === data.conversationId ? { ...c, status: data.status, staffName: data.staffName ?? null } : c))
        );
        setDetail((prev) =>
          prev && prev.id === data.conversationId ? { ...prev, status: data.status, staffName: data.staffName ?? null } : prev
        );
      }

      if (data.type === "needs_attention") {
        setConversations((prev) =>
          prev.map((c) => (c.id === data.conversationId ? { ...c, needsAttention: data.needsAttention } : c))
        );
      }
    });

    return () => socket.close();
  }, []);

  function select(id: string) {
    setSelectedId(id);
    fetch(`${API_URL}/conversations/${id}`)
      .then((res) => res.json())
      .then(setDetail);
  }

  function takeover() {
    if (!detail) return;
    socketRef.current?.send(JSON.stringify({ type: "takeover", conversationId: detail.id, staffName: staffNameRef.current }));
  }

  function release() {
    if (!detail) return;
    socketRef.current?.send(JSON.stringify({ type: "release", conversationId: detail.id }));
  }

  function sendMessage() {
    if (!detail || !draft.trim()) return;
    socketRef.current?.send(
      JSON.stringify({ type: "message", conversationId: detail.id, text: draft.trim(), staffName: staffNameRef.current })
    );
    setDraft("");
  }

  return (
    <div style={rootStyle}>
      <div style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Live conversations</h2>
          <span style={countPillStyle}>{conversations.length}</span>
        </div>
        {conversations.length === 0 && <p style={emptyHintStyle}>No conversations yet.</p>}
        {conversations.map((c) => (
          <button key={c.id} onClick={() => select(c.id)} style={listItemStyle(selectedId === c.id, c.needsAttention)}>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0f172a" }}>{c.visitorId}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
              <StatusBadge status={c.status} label={c.status === "staff" ? `staff (${c.staffName ?? "?"})` : c.status} />
              {c.needsAttention && <StatusBadge status="pending_review" label="needs attention" />}
            </div>
            <div style={previewTextStyle}>{c.messages[0]?.text ?? ""}</div>
          </button>
        ))}
      </div>

      <div style={detailWrapStyle}>
        {!detail ? (
          <p style={{ padding: 24, color: "#94a3b8" }}>Select a conversation.</p>
        ) : (
          <>
            <div style={detailHeaderStyle}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{detail.visitorId}</div>
                <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>
                  {detail.status === "staff" ? `You're live (${detail.staffName})` : "Bot is replying"}
                </div>
              </div>
              {detail.status === "staff" ? (
                <button onClick={release} style={releaseBtnStyle}>
                  Release to bot
                </button>
              ) : (
                <button onClick={takeover} style={takeoverBtnStyle}>
                  Take over
                </button>
              )}
            </div>

            <MessageThread messages={detail.messages} />

            <div style={formStyle}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={detail.status !== "staff"}
                placeholder={detail.status === "staff" ? "Type a reply..." : "Take over to reply directly"}
                style={inputStyle}
              />
              <button
                onClick={sendMessage}
                disabled={detail.status !== "staff"}
                style={sendBtnStyle(detail.status === "staff")}
                aria-label="Send"
              >
                <SendIcon size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const rootStyle: CSSProperties = { display: "flex", height: "100%" };

const sidebarStyle: CSSProperties = { width: 320, borderRight: "1px solid #e2e8f0", overflowY: "auto", background: "#fff" };

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

function listItemStyle(active: boolean, needsAttention: boolean): CSSProperties {
  return {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px 16px",
    border: "none",
    borderBottom: "1px solid #f1f5f9",
    background: active ? "#ecfeff" : needsAttention ? "#fffbeb" : "#fff",
    cursor: "pointer",
    borderLeft: active ? "3px solid #0891b2" : needsAttention ? "3px solid #f59e0b" : "3px solid transparent",
  };
}

const previewTextStyle: CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  marginTop: 4,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const detailWrapStyle: CSSProperties = { flex: 1, display: "flex", flexDirection: "column", background: "#f8fafc" };

const detailHeaderStyle: CSSProperties = {
  padding: "12px 20px",
  borderBottom: "1px solid #e2e8f0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#fff",
};

const takeoverBtnStyle: CSSProperties = {
  border: "none",
  background: "linear-gradient(135deg, #0891b2, #0f172a)",
  color: "#fff",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const releaseBtnStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#475569",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const formStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  borderTop: "1px solid #e2e8f0",
  padding: 12,
  background: "#fff",
};

const inputStyle: CSSProperties = {
  flex: 1,
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  padding: "9px 14px",
  fontSize: 13,
  outline: "none",
};

function sendBtnStyle(enabled: boolean): CSSProperties {
  return {
    border: "none",
    background: enabled ? "linear-gradient(135deg, #0891b2, #0f172a)" : "#e2e8f0",
    color: "#fff",
    width: 34,
    height: 34,
    borderRadius: "50%",
    cursor: enabled ? "pointer" : "not-allowed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };
}
