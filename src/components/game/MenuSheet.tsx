import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { CARDS, type Action, type GameState } from "@shared/game";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/Confirm";
import { PlayerManager } from "./PlayerManager";
import { ShareCode } from "./ShareCode";
import { setViewMode, useViewMode } from "@/hooks/useViewMode";
import { cn, fmt } from "@/lib/utils";

export function MenuSheet({ state, me, online, isHost, code, onAction, onAddLocal, onLeave, onCloseRoom }: {
  state: GameState;
  me: string | null;
  online: Set<string> | null;
  isHost: boolean;
  code?: string;
  onAction: (a: Action) => void;
  onAddLocal?: (name: string) => void;
  onLeave: () => void;
  onCloseRoom?: () => void;
}) {
  const mode = useViewMode();
  const counts = new Map<string, number>();
  for (const id of state.pile) counts.set(id, (counts.get(id) ?? 0) + 1);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" size="icon" aria-label="Menü"><Menu /></Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Menü</SheetTitle>
          <SheetDescription>{isHost ? "Du leitest das Spiel." : "Nur der Host kann Spieler und Spielstand ändern."}</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-navy-950/50 p-1 ring-1 ring-inset ring-border" role="radiogroup" aria-label="Ansicht">
            {([["simple", "Einfach", "Große Tasten"], ["full", "Voll", "Alle Infos"]] as const).map(([m, label, hint]) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setViewMode(m)}
                className={cn("rounded-lg py-2 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
                  mode === m ? "bg-navy-600 shadow-md" : "text-muted-foreground")}>
                <div className="font-semibold">{label}</div>
                <div className="text-xs text-muted-foreground">{hint}</div>
              </button>
            ))}
          </div>

          {code && <ShareCode code={code} />}

          {isHost && (
            <div className="mt-4 grid gap-2">
              <Button variant="secondary" className="justify-start" disabled={!state.log.length} onClick={() => onAction({ type: "undo" })}>
                Letzten Eintrag zurücknehmen
              </Button>
              <Confirm title="Kartenstapel neu mischen?" confirmLabel="Mischen" onConfirm={() => onAction({ type: "shuffle" })}>
                <Button variant="secondary" className="justify-start">Kartenstapel neu mischen</Button>
              </Confirm>
              <Confirm title="Neues Spiel?" description="Alle Punkte werden auf 0 gesetzt. Die Spieler bleiben." confirmLabel="Neues Spiel" onConfirm={() => onAction({ type: "newGame" })}>
                <Button variant="destructive" className="justify-start">Neues Spiel</Button>
              </Confirm>
            </div>
          )}

          <Section title="Spieler">
            <PlayerManager state={state} me={me} online={online} editable={isHost} onAction={onAction} onAddLocal={onAddLocal} />
          </Section>

          <Section title="Verlauf">
            {state.log.length ? (
              <ul className="text-[0.95rem]">
                {state.log.slice().reverse().slice(0, 30).map((e, i) => (
                  <li key={i} className="flex justify-between gap-3 border-b border-border py-2.5">
                    <span>
                      {e.name}
                      {(e.cards.length > 0 || e.penalized.length > 0) && (
                        <span className="block text-sm text-muted-foreground">
                          {e.cards.map((c) => CARDS.find((x) => x.id === c)?.name).join(", ")}
                          {e.penalized.length > 0 && ` · −1.000 für ${e.penalized.map((id) => state.players.find((p) => p.id === id)?.name ?? "?").join(", ")}`}
                        </span>
                      )}
                    </span>
                    <b className="tabular-nums">{e.clover ? "☘" : `+${fmt(e.pts)}`}</b>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Noch keine Einträge.</p>}
          </Section>

          <Section title={`Im Stapel: ${state.pile.length} Karten`}>
            <ul className="grid gap-2">
              {CARDS.map((c) => {
                const k = counts.get(c.id) ?? 0;
                return (
                  <li key={c.id} className="grid grid-cols-[12px_1fr_auto] items-center gap-x-2.5 text-[0.95rem]">
                    <span className="size-3 rounded-[3px]" style={{ background: c.color }} />
                    <span>{c.name}</span>
                    <span className="text-muted-foreground tabular-nums">{k}/{c.count}</span>
                    <span className="col-start-2 col-end-4 h-[3px] overflow-hidden rounded bg-foreground/10">
                      <i className="block h-full" style={{ width: `${(k / c.count) * 100}%`, background: c.color }} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </Section>

          <Button variant="ghost" className="mt-6 w-full text-muted-foreground" onClick={onLeave}>
            {code ? "Raum verlassen" : "Zur Startseite"}
          </Button>
          {code && isHost && onCloseRoom && (
            <Confirm
              title="Raum endgültig löschen?"
              description="Spielstand, Namen und Verlauf werden sofort vom Server gelöscht. Alle Mitspieler fliegen raus."
              confirmLabel="Löschen"
              onConfirm={onCloseRoom}
            >
              <Button variant="destructive" className="mt-2 w-full">Raum löschen</Button>
            </Confirm>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2.5 font-semibold">{title}</h3>
      {children}
    </section>
  );
}
