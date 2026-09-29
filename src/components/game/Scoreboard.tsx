import { useEffect, useRef } from "react";
import type { GameState } from "@shared/game";
import { cn, fmt } from "@/lib/utils";

/** Wischbare Punkteleiste – der Spieler am Zug ist hell hervorgehoben. */
export function Scoreboard({ state, me, online }: { state: GameState; me: string | null; online: Set<string> | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const max = Math.max(...state.players.map((p) => p.score));

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[data-cur=true]")?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [state.cur]);

  return (
    <div ref={ref} className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pt-3 pb-2">
      {state.players.map((p, i) => {
        const cur = i === state.cur && !state.winnerId;
        return (
          <div
            key={p.id}
            data-cur={cur}
            className={cn(
              "relative min-w-28 shrink-0 snap-start rounded-xl px-3 pt-2.5 pb-3 transition",
              cur ? "-translate-y-0.5 bg-primary text-primary-foreground" : "bg-card",
            )}
          >
            {p.score === max && max > 0 && <span className="absolute -top-2 right-2 text-base" aria-label="Führt">👑</span>}
            <div className="flex max-w-32 items-center gap-1.5 text-sm font-semibold">
              {online && (
                <span
                  className={cn("size-2 shrink-0 rounded-full", online.has(p.id) ? "bg-emerald-400" : "bg-current opacity-30")}
                  aria-label={online.has(p.id) ? "online" : "offline"}
                />
              )}
              <span className="truncate">{p.name}{p.id === me ? " (du)" : ""}</span>
            </div>
            <div className="text-2xl font-extrabold tracking-tight tabular-nums">{fmt(p.score)}</div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-current/20">
              <i className={cn("block h-full", cur ? "bg-felt" : "bg-gold")} style={{ width: `${Math.min(100, Math.max(0, p.score) / state.target * 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
