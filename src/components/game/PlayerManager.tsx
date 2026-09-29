import { useState } from "react";
import { ArrowUp, Minus, Plus, X } from "lucide-react";
import type { Action, GameState } from "@shared/game";
import { MAX_PLAYERS } from "@shared/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Confirm } from "@/components/Confirm";
import { cn, fmt } from "@/lib/utils";

/** Spielerliste mit Reihenfolge, Entfernen und Spielziel. Nur der Host (oder lokal) kann bearbeiten. */
export function PlayerManager({ state, me, online, editable, onAction, onAddLocal }: {
  state: GameState;
  me: string | null;
  online: Set<string> | null;
  editable: boolean;
  onAction: (a: Action) => void;
  onAddLocal?: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const add = () => { if (!name.trim() || !onAddLocal) return; onAddLocal(name); setName(""); };

  return (
    <div>
      <ol className="grid gap-1.5">
        {state.players.map((p, i) => (
          <li key={p.id} className="flex h-13 items-center gap-2.5 glass rounded-xl pr-1.5 pl-4">
            <span className="w-5 shrink-0 text-muted-foreground tabular-nums">{i + 1}</span>
            {online && <span className={cn("size-2 shrink-0 rounded-full", online.has(p.id) ? "bg-emerald-400" : "bg-foreground/25")} />}
            <span className="flex-1 truncate font-semibold">
              {p.name}
              {p.id === me && <span className="font-normal text-muted-foreground"> (du)</span>}
              {online && p.id === state.hostId && <span className="font-normal text-muted-foreground"> · Host</span>}
            </span>
            {editable && (
              <>
                {i > 0 && (
                  <Button variant="ghost" size="icon" aria-label={`${p.name} nach oben`} onClick={() => onAction({ type: "movePlayer", id: p.id, dir: -1 })}>
                    <ArrowUp />
                  </Button>
                )}
                <Confirm
                  title={`${p.name} entfernen?`}
                  description={online ? "Die Person fliegt aus dem Raum und müsste mit PIN neu beitreten." : undefined}
                  confirmLabel="Entfernen"
                  onConfirm={() => onAction({ type: "removePlayer", id: p.id })}
                >
                  <Button variant="ghost" size="icon" aria-label={`${p.name} entfernen`} className="text-muted-foreground"><X /></Button>
                </Confirm>
              </>
            )}
          </li>
        ))}
      </ol>

      {onAddLocal && state.players.length < MAX_PLAYERS && (
        <form className="mt-2.5 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" maxLength={20} autoComplete="off" enterKeyHint="done" />
          <Button type="submit" disabled={!name.trim()}>Hinzufügen</Button>
        </form>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-muted-foreground">Spielziel</span>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="icon" disabled={!editable} aria-label="Weniger" onClick={() => onAction({ type: "setTarget", target: state.target - 1000 })}><Minus /></Button>
          <b className="min-w-[5.5ch] text-center text-lg tabular-nums">{fmt(state.target)}</b>
          <Button variant="secondary" size="icon" disabled={!editable} aria-label="Mehr" onClick={() => onAction({ type: "setTarget", target: state.target + 1000 })}><Plus /></Button>
        </div>
      </div>
    </div>
  );
}
