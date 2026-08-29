import type { WebSocket } from "ws";

const conversationSockets = new Map<string, Set<WebSocket>>();
const staffSockets = new Set<WebSocket>();

function send(socket: WebSocket, event: unknown) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(event));
}

export function subscribeConversation(conversationId: string, socket: WebSocket) {
  let sockets = conversationSockets.get(conversationId);
  if (!sockets) {
    sockets = new Set();
    conversationSockets.set(conversationId, sockets);
  }
  sockets.add(socket);

  socket.on("close", () => {
    sockets!.delete(socket);
    if (sockets!.size === 0) conversationSockets.delete(conversationId);
  });
}

export function subscribeStaff(socket: WebSocket) {
  staffSockets.add(socket);
  socket.on("close", () => staffSockets.delete(socket));
}

export function broadcastToConversation(conversationId: string, event: unknown) {
  for (const socket of conversationSockets.get(conversationId) ?? []) send(socket, event);
}

export function broadcastToStaff(event: unknown) {
  for (const socket of staffSockets) send(socket, event);
}
