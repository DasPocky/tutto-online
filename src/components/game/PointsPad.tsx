import { CARD_BY_ID, type Action, type GameState } from "@shared/game";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/Confirm";
import { cn, fmt, vibrate } from "@/lib/utils";

const BASE = [50, 100, 200, 500];

/** Punkte-Eingabe per großer Tasten – passend zur gezogenen Karte gibt es Extra-Tasten. */
export function PointsPad({ state, onAction, disabled }: { state: GameState; onAction: (a: Action) => void; disabled: boolean }) {
  const latest = state.turnCards[state.turnCards.length - 1];
  const extra = latest ? CARD_BY_ID[latest].quick : undefined;
  const showExtra = extra !== undefined && !BASE.includes(extra) && extra !== 1000;
  const canDouble = state.turnCards.includes("x2") && state.turnPts > 0;

  const key = (delta: number, label: string, hl = false) => (
    <button
      key={label}
      type="button"
      disabled={disabled}
      onClick={() => { vibrate(8); onAction({ type: "addPts", delta }); }}
      className={cn(
        "h-13 rounded-xl text-[1.05rem] font-semibold outline-none transition active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-40",
        hl ? "bg-gold text-[#2b2100]" : "bg-accent active:bg-foreground/25",
      )}
    >
      {label}
    </button>
  );

  return (
    <section className="mt-4 rounded-2xl bg-card p-3.5">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <span className="text-sm text-muted-foreground">Punkte dieser Runde</span>
        <b className="text-4xl font-extrabold tracking-tight tabular-nums">{fmt(state.turnPts)}</b>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {BASE.map((v) => key(v, `+${v}`))}
        {showExtra && key(extra!, `+${fmt(extra!)}`, true)}
        {key(1000, "+1.000", latest === "pm")}
        {canDouble && (
          <button
            type="button" disabled={disabled}
            onClick={() => { vibrate(15); onAction({ type: "double" }); }}
            className="h-13 rounded-xl bg-gold font-semibold text-[#2b2100] outline-none active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring"
          >×2</button>
        )}
        <button type="button" disabled={disabled} onClick={() => onAction({ type: "addPts", delta: -50 })}
          className="h-13 rounded-xl font-semibold text-muted-foreground ring-[1.5px] ring-inset ring-border outline-none active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring">−50</button>
        <button type="button" disabled={disabled} onClick={() => onAction({ type: "clearPts" })}
          className="h-13 rounded-xl font-semibold text-muted-foreground ring-[1.5px] ring-inset ring-border outline-none active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring">Löschen</button>
      </div>

      {state.turnCards.includes("pm") && (
        <label className="mt-3.5 flex items-center gap-3 px-1 text-[0.95rem]">
          <Checkbox checked={state.pmOn} disabled={disabled} onCheckedChange={(c) => onAction({ type: "setPm", on: c === true })} />
          Tutto geschafft: Führendem 1.000 abziehen
        </label>
      )}
      {latest === "clover" && (
        <Confirm
          title="Kleeblatt geschafft?"
          description="Zweimal hintereinander Tutto – damit ist das Spiel sofort gewonnen."
          confirmLabel="Sieg eintragen"
          onConfirm={() => { vibrate([30, 60, 30]); onAction({ type: "clover" }); }}
        >
          <Button variant="secondary" className="mt-3 w-full" disabled={disabled}>☘ Zweimal Tutto – Sieg eintragen</Button>
        </Confirm>
      )}
    </section>
  );
}
