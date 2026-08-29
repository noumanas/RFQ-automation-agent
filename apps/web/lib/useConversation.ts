"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Message } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4100";
const WS_URL = API_URL.replace(/^http/, "ws");
const VISITOR_KEY = "rfq_widget_visitor_id";

/**
 * Owns one buyer conversation (create/resume + WebSocket) so the marketing
 * page's floating widget and the interactive demo's hero box can share a
 * single implementation instead of each reimplementing it.
 */
export function useConversation(onBotMessage?: (msg: Message) => void) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const readyPromiseRef = useRef<Promise<void> | null>(null);
  const onBotMessageRef = useRef(onBotMessage);
  onBotMessageRef.current = onBotMessage;

  useEffect(() => {
    return () => {
      socketRef.current?.close();
    };
  }, []);

  const ensureReady = useCallback((): Promise<void> => {
    if (readyPromiseRef.current) return readyPromiseRef.current;

    readyPromiseRef.current = (async () => {
      let visitorId = localStorage.getItem(VISITOR_KEY);
      if (!visitorId) {
        visitorId = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(VISITOR_KEY, visitorId);
      }

      const res = await fetch(`${API_URL}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });
      const conversation = await res.json();

      const historyRes = await fetch(`${API_URL}/conversations/${conversation.id}`);
      const full = await historyRes.json();
      setMessages(full.messages);

      await new Promise<void>((resolve) => {
        const socket = new WebSocket(`${WS_URL}/ws/conversations/${conversation.id}`);
        socketRef.current = socket;
        socket.addEventListener("open", () => resolve());
        socket.addEventListener("message", (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "message") {
            setMessages((prev) => [...prev, data.message]);
            if (data.message.sender !== "buyer") setIsThinking(false);
            if (data.message.sender === "bot") onBotMessageRef.current?.(data.message);
          }
        });
      });
    })();

    return readyPromiseRef.current;
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setIsThinking(true);
      await ensureReady();
      socketRef.current?.send(JSON.stringify({ type: "message", text: trimmed }));
    },
    [ensureReady]
  );

  return { messages, send, isThinking };
}
