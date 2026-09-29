import { canPlayTurn, CARD_BY_ID, type Action, type GameState } from "@shared/game";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/Confirm";
import { CardGuide } from "./CardGuide";
import { DiceActions, DicePanel } from "./Dice";
import { GameSettings } from "./GameSettings";
import { GameCard } from "./GameCard";
import { MenuSheet } from "./MenuSheet";
import { PlayerManager } from "./PlayerManager";
import { PointsPad } from "./PointsPad";
import { Scoreboard } from "./Scoreboard";
import { ShareCode } from "./ShareCode";
import { useViewMode } from "@/hooks/useViewMode";
import { cn, fmt } from "@/lib/utils";

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
  onCloseRoom?: () => void;
}

/** Gemeinsamer Bildschirm für lokales und Online-Spiel: Lobby → Spiel → Sieg. */
export function GameScreen(props: Props) {
  const { state, me, online, onAction, reconnecting } = props;
  const mode = useViewMode();
  const isHost = me === null || me === state.hostId;
  const cur = state.players[state.cur];
  const canAct = canPlayTurn(state, me);
  const winner = state.winnerId ? state.players.find((p) => p.id === state.winnerId) : null;
  const playing = state.started && !winner;
  const appDice = state.diceMode === "app";
  const latest = state.turnCards[state.turnCards.length - 1];
  const d = state.dice;
  // Mit App-Würfel nur ziehen, wenn es gerade erlaubt ist – sonst würde ein versehentliches Antippen stören
  const canDraw = !appDice || !latest || (!!d && d.tutto && !d.bust && latest !== "fire" && latest !== "clover" && latest !== "stop");

  return (
    <div className={cn("mx-auto flex max-w-xl flex-col px-4", playing ? "h-dvh-safe overflow-hidden" : "min-h-dvh-safe pb-8")}>
      <header className="flex h-14 shrink-0 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logo />
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-tight">Tutto</div>
            {props.code && <div className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">{props.code}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {reconnecting && <span className="animate-pulse text-sm font-semibold text-gold">Verbinde …</span>}
          {state.started && (
            <span className="rounded-full bg-secondary px-3 py-1 text-sm text-muted-foreground ring-1 ring-inset ring-border">
              <b className="text-foreground tabular-nums">{state.pile.length}</b> Karten
            </span>
          )}
          <MenuSheet {...props} isHost={isHost} />
        </div>
      </header>

      {!state.started ? (
        <Lobby {...props} isHost={isHost} />
      ) : winner ? (
        <section className="pt-[8vh] text-center">
          <div className="text-6xl">🏆</div>
          <div className="mt-3 text-muted-foreground">Gewonnen hat</div>
          <div className="my-1.5 bg-gradient-to-b from-gold to-amber-500 bg-clip-text text-5xl font-extrabold leading-tight tracking-tight text-transparent">{winner.name}</div>
          <div className="text-muted-foreground">{state.cloverWin ? "mit dem Kleeblatt ☘" : `mit ${fmt(winner.score)} Punkten`}</div>
          <ol className="mt-8 grid gap-1.5 text-left">
            {[...state.players].sort((a, b) => b.score - a.score).map((p, i) => (
              <li key={p.id} className={cn("flex justify-between rounded-xl px-4 py-3 font-semibold", i === 0 ? "bg-navy-600" : "glass")}>
                <span><span className="mr-2 text-muted-foreground">{i + 1}.</span>{p.name}</span><span className="tabular-nums">{fmt(p.score)}</span>
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

          {/* Mitte: Karte füllt den freien Platz, damit alles auf einen Bildschirm passt */}
          <div className="flex min-h-0 flex-1 flex-col items-center pt-3">
            <div className="flex items-baseline gap-2.5">
              <span className="text-sm text-muted-foreground">Am Zug</span>
              <span className="text-2xl font-extrabold tracking-tight">{cur?.id === me ? "Du" : cur?.name}</span>
            </div>
            <div className="flex min-h-0 w-full flex-1 items-center justify-center py-3">
              <GameCard cards={state.turnCards} onDraw={() => onAction({ type: "draw" })} disabled={!canAct || !canDraw} />
            </div>
            <TurnHint state={state} canAct={canAct} full={mode === "full"} appDice={appDice} />
          </div>

          <div className="shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {appDice
              ? <DicePanel state={state} onAction={onAction} disabled={!canAct} />
              : <PointsPad state={state} onAction={onAction} disabled={!canAct} mode={mode} />}
            <div className="mt-2.5">
              {canAct && appDice ? (
                <DiceActions state={state} onAction={onAction} />
              ) : canAct ? (
                <div className="grid grid-cols-[1fr_1.7fr] gap-2.5">
                  {state.turnPts > 0 ? (
                    <Confirm title="Wirklich Niete?" description={`Die ${fmt(state.turnPts)} Punkte dieser Runde verfallen.`} confirmLabel="Niete" onConfirm={() => onAction({ type: "book", zero: true })}>
                      <Button variant="secondary" size="lg">Niete</Button>
                    </Confirm>
                  ) : (
                    <Button variant="secondary" size="lg" onClick={() => onAction({ type: "book", zero: true })}>Niete</Button>
                  )}
                  <Button size="lg" onClick={() => onAction({ type: "book" })}>
                    {state.turnPts > 0 ? `${fmt(state.turnPts)} eintragen` : "Weiter"}
                  </Button>
                </div>
              ) : (
                <div className="glass rounded-xl py-4 text-center text-muted-foreground">
                  {state.entry === "host" ? <>Der Host spielt für <b className="text-foreground">{cur?.name}</b></> : <>Warte auf <b className="text-foreground">{cur?.name}</b></>}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("grid size-9 place-items-center rounded-xl bg-gradient-to-br from-navy-400 to-navy-700 text-lg font-extrabold text-white shadow-lg ring-1 ring-white/15", className)}>
      T
    </div>
  );
}

function TurnHint({ state, canAct, full, appDice }: { state: GameState; canAct: boolean; full: boolean; appDice: boolean }) {
  const latest = state.turnCards[state.turnCards.length - 1];
  const card = latest ? CARD_BY_ID[latest] : null;
  const idle = canAct ? (appDice ? "Karte antippen, dann würfeln." : "Karte antippen, dann würfeln.") : "Gleich wird eine Karte gezogen.";
  return (
    <div className="mx-auto mb-3 flex w-full max-w-[40ch] shrink-0 items-start gap-2 px-2 text-sm leading-snug text-muted-foreground">
      <div className="min-w-0 flex-1 text-center">
        <p className={cn("min-h-[2lh]", full ? "line-clamp-3" : "line-clamp-2")}>
          {card ? card.rule : idle}
          {card && canAct && card.id !== "stop" && full && !appDice && " Tutto geschafft? Karte nochmal antippen."}
        </p>
        {full && state.turnCards.length > 1 && (
          <div className="no-scrollbar mt-1.5 flex justify-center gap-1.5 overflow-x-auto">
            {state.turnCards.map((id, i) => (
              <span key={i} className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset" style={{ color: CARD_BY_ID[id].color, boxShadow: "none", background: "rgb(253 253 251 / 0.92)" }}>
                {CARD_BY_ID[id].name}
              </span>
            ))}
          </div>
        )}
      </div>
      <CardGuide focus={latest} />
    </div>
  );
}

function Lobby({ state, me, online, code, onAction, onAddLocal, isHost }: Props & { isHost: boolean }) {
  return (
    <section className="pt-2">
      {code && <ShareCode code={code} />}
      <h2 className="mt-6 mb-1 text-xl font-extrabold tracking-tight">Wer spielt mit?</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {code
          ? "Schick den Link und sag die PIN dazu. Die Reihenfolge ist die Zugreihenfolge."
          : "Die Reihenfolge ist die Zugreihenfolge."}
      </p>
      <PlayerManager state={state} me={me} online={online} editable={isHost} onAction={onAction} onAddLocal={onAddLocal} />
      <GameSettings state={state} editable={isHost} online={!!code} onAction={onAction} className="mt-6" />
      {isHost ? (
        <Button size="lg" className="mt-6 w-full" disabled={!state.players.length} onClick={() => onAction({ type: "start" })}>
          Spiel starten
        </Button>
      ) : (
        <p className="glass mt-6 rounded-xl py-4 text-center text-muted-foreground">Warte, bis der Host das Spiel startet …</p>
      )}
    </section>
  );
}
