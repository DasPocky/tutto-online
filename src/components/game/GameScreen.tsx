import { CARD_BY_ID, type Action, type GameState } from "@shared/game";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/Confirm";
import { GameCard } from "./GameCard";
import { MenuSheet } from "./MenuSheet";
import { PlayerManager } from "./PlayerManager";
import { PointsPad } from "./PointsPad";
import { Scoreboard } from "./Scoreboard";
import { ShareCode } from "./ShareCode";
import { fmt } from "@/lib/utils";

interface Props {
  state: GameState;
  /** null im lokalen Modus */
  me: string | null;
  online: Set<string> | null;
  code?: string;
  reconnecting?: boolean;
  onAction: (a: Action) => void;
  onAddLocal?: (name: string) => void;
  onLeave: () => void;
}

/** Gemeinsamer Bildschirm für lokales und Online-Spiel: Lobby → Spiel → Sieg. */
export function GameScreen(props: Props) {
  const { state, me, online, onAction, reconnecting } = props;
  const isHost = me === null || me === state.hostId;
  const cur = state.players[state.cur];
  const canAct = isHost || me === cur?.id;
  const winner = state.winnerId ? state.players.find((p) => p.id === state.winnerId) : null;

  return (
    <div className="mx-auto max-w-xl px-4 pb-32">
      <header className="sticky top-[env(safe-area-inset-top)] z-10 -mx-4 flex items-center justify-between bg-gradient-to-b from-felt-deep from-70% to-transparent px-4 py-2.5">
        <div className="text-2xl font-extrabold tracking-tight">Tutto</div>
        <div className="flex items-center gap-3">
          {reconnecting && <span className="text-sm text-gold">Verbinde neu …</span>}
          <span className="text-sm text-muted-foreground"><b className="text-foreground tabular-nums">{state.pile.length}</b> Karten</span>
          <MenuSheet {...props} isHost={isHost} />
        </div>
      </header>

      {!state.started ? (
        <Lobby {...props} isHost={isHost} />
      ) : winner ? (
        <section className="pt-[10vh] text-center">
          <div className="text-muted-foreground">Gewonnen hat</div>
          <div className="my-1.5 text-5xl font-extrabold leading-none tracking-tight text-gold">{winner.name}</div>
          <div className="text-muted-foreground">{state.cloverWin ? "mit dem Kleeblatt" : `mit ${fmt(winner.score)} Punkten`}</div>
          <ol className="mt-8 grid gap-1.5 text-left">
            {[...state.players].sort((a, b) => b.score - a.score).map((p, i) => (
              <li key={p.id} className="flex justify-between rounded-xl bg-card px-4 py-3 font-semibold">
                <span>{i + 1}. {p.name}</span><span className="tabular-nums">{fmt(p.score)}</span>
              </li>
            ))}
          </ol>
          {isHost ? (
            <div className="mt-6 grid gap-2.5">
              <Button size="lg" onClick={() => onAction({ type: "newGame" })}>Neue Runde, gleiche Spieler</Button>
              <Button variant="secondary" onClick={() => onAction({ type: "undo" })}>Letzten Eintrag zurücknehmen</Button>
            </div>
          ) : <p className="mt-6 text-muted-foreground">Der Host kann eine neue Runde starten.</p>}
        </section>
      ) : (
        <>
          <Scoreboard state={state} me={me} online={online} />
          <div className="mt-2 text-center">
            <div className="text-sm text-muted-foreground">Am Zug</div>
            <div className="text-3xl font-extrabold leading-tight tracking-tight">{cur?.id === me ? "Du" : cur?.name}</div>
          </div>
          <div className="mt-3.5">
            <GameCard cards={state.turnCards} onDraw={() => onAction({ type: "draw" })} disabled={!canAct} />
          </div>
          <TurnHint state={state} canAct={canAct} />
          <PointsPad state={state} onAction={onAction} disabled={!canAct} />
        </>
      )}

      {state.started && !winner && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-b from-transparent to-felt-deep to-30% px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-xl">
            {canAct ? (
              <div className="grid grid-cols-[1fr_1.6fr] gap-2.5">
                {state.turnPts > 0 ? (
                  <Confirm title="Wirklich Niete?" description={`Die ${fmt(state.turnPts)} Punkte dieser Runde verfallen.`} confirmLabel="Niete" onConfirm={() => onAction({ type: "book", zero: true })}>
                    <Button variant="secondary" size="lg" className="bg-black/35">Niete</Button>
                  </Confirm>
                ) : (
                  <Button variant="secondary" size="lg" className="bg-black/35" onClick={() => onAction({ type: "book", zero: true })}>Niete</Button>
                )}
                <Button size="lg" onClick={() => onAction({ type: "book" })}>
                  {state.turnPts > 0 ? `${fmt(state.turnPts)} eintragen` : "Weiter"}
                </Button>
              </div>
            ) : (
              <div className="rounded-xl bg-black/35 py-4 text-center text-muted-foreground">
                Warte auf <b className="text-foreground">{cur?.name}</b>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TurnHint({ state, canAct }: { state: GameState; canAct: boolean }) {
  const latest = state.turnCards[state.turnCards.length - 1];
  const card = latest ? CARD_BY_ID[latest] : null;
  return (
    <div className="mx-auto mt-2.5 min-h-12 max-w-[34ch] text-center text-[0.95rem] leading-snug text-muted-foreground">
      {card ? card.rule : canAct ? "Karte ziehen, dann würfeln." : "Gleich wird eine Karte gezogen."}
      {card && canAct && card.id !== "stop" && <span className="block text-sm">Tutto geschafft? Karte nochmal antippen.</span>}
      {state.turnCards.length > 1 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {state.turnCards.map((id, i) => (
            <span key={i} className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: CARD_BY_ID[id].color }}>
              {CARD_BY_ID[id].name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Lobby({ state, me, online, code, onAction, onAddLocal, isHost }: Props & { isHost: boolean }) {
  return (
    <section className="pt-4">
      {code && <ShareCode code={code} />}
      <h2 className="mt-6 mb-1 text-xl font-extrabold tracking-tight">Wer spielt mit?</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {code
          ? "Schick den Link und sag die PIN dazu. Die Reihenfolge ist die Zugreihenfolge."
          : "Die Reihenfolge ist die Zugreihenfolge."}
      </p>
      <PlayerManager state={state} me={me} online={online} editable={isHost} onAction={onAction} onAddLocal={onAddLocal} />
      {isHost ? (
        <Button size="lg" className="mt-6 w-full" disabled={!state.players.length} onClick={() => onAction({ type: "start" })}>
          Spiel starten
        </Button>
      ) : (
        <p className="mt-6 rounded-xl bg-card py-4 text-center text-muted-foreground">Warte, bis der Host das Spiel startet …</p>
      )}
    </section>
  );
}
