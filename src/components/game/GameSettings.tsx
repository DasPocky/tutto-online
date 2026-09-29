import type { Action, GameState } from "@shared/game";
import { cn } from "@/lib/utils";

function Segmented<T extends string>({ label, value, options, editable, onChange }: {
  label: string;
  value: T;
  options: readonly (readonly [T, string, string])[];
  editable: boolean;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold">{label}</div>
      <div className="grid gap-1 rounded-xl bg-navy-950/50 p-1 ring-1 ring-inset ring-border" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} role="radiogroup" aria-label={label}>
        {options.map(([v, title, hint]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} disabled={!editable}
            onClick={() => value !== v && onChange(v)}
            className={cn("rounded-lg px-1.5 py-2.5 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
              value === v ? "bg-navy-600 shadow-md" : "text-muted-foreground")}>
            <div className="text-sm font-semibold">{title}</div>
            <div className="mt-0.5 text-xs leading-tight text-muted-foreground">{hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Spiel-Einstellungen. Ändern darf nur der Host (lokal: jeder), alle anderen sehen sie. */
export function GameSettings({ state, editable, online, onAction, className }: {
  state: GameState; editable: boolean; online: boolean; onAction: (a: Action) => void; className?: string;
}) {
  return (
    <section className={cn("grid gap-4", className)}>
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">Einstellungen</h3>
        {!editable && <span className="text-xs text-muted-foreground">legt der Host fest</span>}
      </div>
      <Segmented
        label="Würfel"
        value={state.diceMode ?? "real"}
        editable={editable}
        onChange={(mode) => onAction({ type: "setDiceMode", mode })}
        options={[["real", "Echte Würfel", "Punkte selbst eintippen"], ["app", "🎲 App-Würfel", "App würfelt und zählt"]] as const}
      />
      {online && (
        <Segmented
          label="Wer darf ziehen, würfeln und eintragen?"
          value={state.entry ?? "turn"}
          editable={editable}
          onChange={(mode) => onAction({ type: "setEntry", mode })}
          options={[["turn", "Wer dran ist", "am eigenen Handy"], ["all", "Alle", "jeder für jeden"], ["host", "Nur Host", "einer für alle"]] as const}
        />
      )}
    </section>
  );
}
