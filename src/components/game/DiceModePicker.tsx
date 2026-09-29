import type { Action, GameState } from "@shared/game";
import { cn } from "@/lib/utils";

/** Auswahl: echte Würfel am Tisch oder App-Würfel. Nur Host bzw. lokal änderbar. */
export function DiceModePicker({ state, editable, onAction, className }: {
  state: GameState; editable: boolean; onAction: (a: Action) => void; className?: string;
}) {
  const mode = state.diceMode ?? "real";
  const opts = [
    ["real", "Echte Würfel", "Punkte selbst eintippen"],
    ["app", "App-Würfel", "App würfelt und zählt"],
  ] as const;
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-semibold">Würfel</span>
        {!editable && <span className="text-xs text-muted-foreground">legt der Host fest</span>}
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-navy-950/50 p-1 ring-1 ring-inset ring-border" role="radiogroup" aria-label="Würfel">
        {opts.map(([m, label, hint]) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} disabled={!editable}
            onClick={() => mode !== m && onAction({ type: "setDiceMode", mode: m })}
            className={cn("rounded-lg px-2 py-2.5 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
              mode === m ? "bg-navy-600 shadow-md" : "text-muted-foreground")}>
            <div className="font-semibold">{m === "app" ? "🎲 " : ""}{label}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
