import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Action, GameState } from "@shared/game";
import type { ClientMessage, ServerMessage } from "@shared/protocol";
import { credsKey, readJSON, remove, writeJSON, type RoomCreds } from "@/lib/storage";

export type RoomStatus = "checking" | "missing" | "needsJoin" | "connecting" | "ready" | "failed";

export interface JoinData { name: string; pin: string }

/**
 * Verbindet sich per WebSocket mit einem Spielraum, tritt bei und hält den Spielstand aktuell.
 * Bei Verbindungsabbrüchen wird automatisch neu verbunden (mit Token, ohne PIN).
 */
export function useRoom(code: string, join: JoinData | null, attempt: number) {
  const [status, setStatus] = useState<RoomStatus>("checking");
  const [state, setState] = useState<GameState | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let stopped = false;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (stopped) return;
      setStatus((s) => (s === "ready" ? "connecting" : s === "checking" ? "connecting" : s));
      const proto = location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${proto}://${location.host}/api/rooms/${code}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        retry = 0;
        const creds = readJSON<RoomCreds>(credsKey(code));
        const msg: ClientMessage = { type: "join", ...(creds ?? {}), ...(join ?? {}) };
        ws.send(JSON.stringify(msg));
      };

      ws.onmessage = (ev) => {
        let msg: ServerMessage;
        try { msg = JSON.parse(ev.data as string) as ServerMessage; } catch { return; }
        if (msg.type === "joined") {
          writeJSON(credsKey(code), { playerId: msg.playerId, token: msg.token } satisfies RoomCreds);
          setMe(msg.playerId);
        } else if (msg.type === "state") {
          setState(msg.state);
          setMe(msg.you);
          setOnline(new Set(msg.online));
          setStatus("ready");
          setError(null);
        } else if (msg.type === "error") {
          if (msg.fatal) {
            stopped = true;
            if (msg.code === "bad_pin" || msg.code === "kicked" || msg.code === "not_joined") remove(credsKey(code));
            setError(msg.message);
            setStatus(msg.code === "bad_pin" || msg.code === "rejected" || msg.code === "not_joined" ? "needsJoin" : "failed");
            ws.close();
          } else {
            toast(msg.message);
          }
        }
      };

      ws.onclose = () => {
        if (stopped) return;
        setStatus((s) => (s === "ready" ? "connecting" : s));
        timer = setTimeout(connect, Math.min(8000, 500 * 2 ** retry++));
      };
    };

    (async () => {
      try {
        const res = await fetch(`/api/rooms/${code}`);
        const data = (await res.json()) as { exists?: boolean };
        if (stopped) return;
        if (!data.exists) { remove(credsKey(code)); setStatus("missing"); return; }
      } catch {
        // offline? dann trotzdem versuchen
      }
      if (stopped) return;
      if (!join && !readJSON<RoomCreds>(credsKey(code))) { setStatus("needsJoin"); return; }
      setStatus("connecting");
      connect();
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [code, join, attempt]);

  const send = useCallback((action: Action) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "action", action } satisfies ClientMessage));
    else toast("Keine Verbindung – einen Moment.");
  }, []);

  return { status, state, me, online, error, send };
}
