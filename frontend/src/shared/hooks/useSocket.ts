import { useEffect, useRef } from 'react';

const WS_BASE = ((import.meta as any).env?.VITE_WS_URL ?? 'ws://localhost:8080/ws')
  .replace(/^http/, 'ws');

export function useSocket(
  onEvent: (event: string, data: any) => void,
  options?: {
    topics?: string[];
    enabled?: boolean;
  },
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const enabled   = options?.enabled !== false;
  const topics    = (options?.topics ?? []).filter(Boolean);
  const topicsKey = topics.join('|');

  useEffect(() => {
    if (!enabled || topics.length === 0) return;

    const room = topicToRoom(topics[0]);
    if (!room) return;

    let ws: WebSocket | null = null;
    let destroyed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (destroyed) return;
      ws = new WebSocket(`${WS_BASE}?room=${room}`);

      ws.onopen = () => {
        console.log(`[WS] Connected room=${room}`);
      };

      ws.onmessage = (e) => {
        try {
          const { type, payload } = JSON.parse(e.data);
          onEventRef.current(type, payload);
        } catch {
          // ignore malformed message
        }
      };

      ws.onclose = () => {
        if (destroyed) return;
        console.log(`[WS] Closed, reconnect in 3s...`);
        retryTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {};
    };

    connect();

    return () => {
      destroyed = true;
      if (retryTimer) clearTimeout(retryTimer);
      ws?.close();
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, topicsKey]);
}

function topicToRoom(topic: string): string | null {
  if (topic === '/topic/appointments' || topic === '/topic/events') return 'receptionist';
  const doctorMatch = topic.match(/^\/topic\/doctor\/(\d+)$/);
  if (doctorMatch) return `doctor:${doctorMatch[1]}`;
  const patientMatch = topic.match(/^\/topic\/patient\/(\d+)$/);
  if (patientMatch) return `patient:${patientMatch[1]}`;
  return null;
}
