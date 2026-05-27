import type { WsMessage } from '@/types/assessment';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

export type WsCallback = (message: WsMessage) => void;

export class AssignmentWebSocket {
  private ws: WebSocket | null = null;
  private callbacks: Set<WsCallback> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private assignmentId: string | null = null;

  connect(assignmentId: string) {
    this.disconnect();
    this.assignmentId = assignmentId;

    const url = `${WS_BASE}/ws?assignmentId=${assignmentId}`;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsMessage;
        this.callbacks.forEach((cb) => cb(msg));
      } catch {
        console.error('Invalid WS message');
      }
    };

    this.ws.onclose = () => {
      if (this.assignmentId) {
        this.reconnectTimer = setTimeout(() => {
          if (this.assignmentId) this.connect(this.assignmentId);
        }, 3000);
      }
    };

    this.ws.onerror = () => {
      console.error('WebSocket error');
    };
  }

  subscribe(callback: WsCallback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.assignmentId = null;
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }
}

export const assignmentWs = new AssignmentWebSocket();
