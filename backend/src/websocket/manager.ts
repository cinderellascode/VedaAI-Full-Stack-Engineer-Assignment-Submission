import { WebSocket, WebSocketServer } from 'ws';
import type { JobStatus } from '../types/assessment';
import type { GeneratedPaper } from '../types/assessment';

export interface WsMessage {
  type: 'job:update' | 'job:complete' | 'job:error' | 'connected';
  assignmentId: string;
  status?: JobStatus;
  progress?: number;
  message?: string;
  paper?: GeneratedPaper;
  error?: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, Set<WebSocket>>();

  init(server: import('http').Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url || '', 'http://localhost');
      const assignmentId = url.searchParams.get('assignmentId');

      if (!assignmentId) {
        ws.close(4000, 'assignmentId required');
        return;
      }

      if (!this.clients.has(assignmentId)) {
        this.clients.set(assignmentId, new Set());
      }
      this.clients.get(assignmentId)!.add(ws);

      ws.send(
        JSON.stringify({
          type: 'connected',
          assignmentId,
          message: 'WebSocket connected',
        } satisfies WsMessage)
      );

      ws.on('close', () => {
        this.clients.get(assignmentId)?.delete(ws);
        if (this.clients.get(assignmentId)?.size === 0) {
          this.clients.delete(assignmentId);
        }
      });
    });
  }

  broadcast(assignmentId: string, message: WsMessage) {
    const subs = this.clients.get(assignmentId);
    if (!subs) return;

    const payload = JSON.stringify(message);
    for (const ws of subs) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  notifyProgress(assignmentId: string, status: JobStatus, progress: number, message?: string) {
    this.broadcast(assignmentId, {
      type: 'job:update',
      assignmentId,
      status,
      progress,
      message,
    });
  }

  notifyComplete(assignmentId: string, paper: GeneratedPaper) {
    this.broadcast(assignmentId, {
      type: 'job:complete',
      assignmentId,
      status: 'completed',
      progress: 100,
      paper,
    });
  }

  notifyError(assignmentId: string, error: string) {
    this.broadcast(assignmentId, {
      type: 'job:error',
      assignmentId,
      status: 'failed',
      error,
    });
  }
}

export const wsManager = new WebSocketManager();
