/**
 * Spiellogik für Tutto – wird vom Client (lokaler Modus) und vom
 * Durable Object (Online-Räume) gleichermaßen genutzt.
 */

export type CardId =
  | "b200" | "b300" | "b400" | "b500" | "b600"
  | "x2" | "fire" | "street" | "pm" | "stop" | "clover";

export interface CardType {
  id: CardId;
  name: string;
  big: string;
  sub: string;
  count: number;
  color: string;
  /** Kurzregel unter der Karte */
  rule: string;
  /** Ausführliche Erklärung zum Nachschlagen */
  help: string;
  /** Punkte-Schnelltaste, die zu dieser Karte passt */
  quick?: number;
}

const BONUS_HELP = (n: number) =>
  `Würfle ganz normal. Schaffst du ein Tutto (alle 6 Würfel gewertet), bekommst du deine Würfelpunkte plus ${n} Bonus. ` +
  "Danach darfst du aufhören oder eine neue Karte ziehen und weiterspielen. Hörst du vor dem Tutto auf, zählen nur die Würfelpunkte. Bei einer Niete sind alle Punkte dieses Zugs weg.";

export const CARDS: CardType[] = [
  { id: "b200", name: "Bonus 200", big: "200", sub: "Bonus", count: 5, color: "#b8913a", quick: 200, rule: "Bei einem Tutto gibt es 200 Punkte extra.", help: BONUS_HELP(200) },
  { id: "b300", name: "Bonus 300", big: "300", sub: "Bonus", count: 5, color: "#b8913a", quick: 300, rule: "Bei einem Tutto gibt es 300 Punkte extra.", help: BONUS_HELP(300) },
  { id: "b400", name: "Bonus 400", big: "400", sub: "Bonus", count: 5, color: "#b8913a", quick: 400, rule: "Bei einem Tutto gibt es 400 Punkte extra.", help: BONUS_HELP(400) },
  { id: "b500", name: "Bonus 500", big: "500", sub: "Bonus", count: 5, color: "#b8913a", quick: 500, rule: "Bei einem Tutto gibt es 500 Punkte extra.", help: BONUS_HELP(500) },
  { id: "b600", name: "Bonus 600", big: "600", sub: "Bonus", count: 5, color: "#b8913a", quick: 600, rule: "Bei einem Tutto gibt es 600 Punkte extra.", help: BONUS_HELP(600) },
  { id: "x2", name: "x2", big: "×2", sub: "Verdoppeln", count: 5, color: "#6d62a3", rule: "Bei einem Tutto werden die Punkte dieses Zugs verdoppelt.",
    help: "Würfle ganz normal. Schaffst du ein Tutto, werden alle Punkte verdoppelt, die du in diesem Zug bisher gesammelt hast. Danach darfst du aufhören oder eine neue Karte ziehen. Hörst du vorher auf, zählen die Punkte einfach, ohne Verdopplung." },
  { id: "fire", name: "Feuerwerk", big: "✺", sub: "Feuerwerk", count: 5, color: "#b86a4b", rule: "Würfeln bis zur Niete, Aufhören geht nicht. Alle Punkte bis dahin zählen.",
    help: "Du musst so lange weiterwürfeln, bis du eine Niete wirfst – freiwillig aufhören ist nicht erlaubt. Jedes Tutto zwischendurch zählt einfach mit, du würfelst danach mit allen 6 Würfeln weiter. Die Niete kostet dich hier ausnahmsweise nichts: Alle Punkte bis dahin bekommst du gutgeschrieben." },
  { id: "street", name: "Straße", big: "1–6", sub: "2000 Punkte", count: 5, color: "#4a7f8c", quick: 2000, rule: "1 bis 6 je einmal auslegen. Gelingt es, gibt es 2000 Punkte, sonst nichts.",
    help: "Du brauchst eine Straße: Lege aus jedem Wurf mindestens einen Würfel mit einer Zahl beiseite, die du noch nicht hast, bis 1, 2, 3, 4, 5 und 6 vollständig sind. Gelingt es, gibt es 2000 Punkte (normale Würfelpunkte zählen hier nicht). Bringt ein Wurf keine neue Zahl, ist es eine Niete." },
  { id: "pm", name: "Plus/Minus", big: "±", sub: "1000 Punkte", count: 5, color: "#5a6478", quick: 1000, rule: "Bei einem Tutto: 1000 Punkte für dich, der Führende verliert 1000.",
    help: "Du musst ein Tutto würfeln. Gelingt es, bekommst du 1000 Punkte – die Würfelpunkte zählen dabei nicht. Gleichzeitig verliert der Führende 1000 Punkte (bei Gleichstand alle Führenden). Bist du selbst vorn, verliert niemand etwas. Bei einer Niete gibt es nichts." },
  { id: "stop", name: "Stopp", big: "STOP", sub: "Zug vorbei", count: 10, color: "#a84a57", rule: "Der Zug ist sofort vorbei. Der Nächste ist dran.",
    help: "Pech gehabt: Du darfst in diesem Zug nicht würfeln, der Nächste ist dran. Tippe einfach auf „Weiter“." },
  { id: "clover", name: "Kleeblatt", big: "☘", sub: "Kleeblatt", count: 1, color: "#4f8a5e", rule: "Zweimal hintereinander Tutto – dann ist das Spiel sofort gewonnen.",
    help: "Die seltenste Karte (nur einmal im Stapel). Schaffst du zweimal hintereinander ein Tutto, ohne zwischendurch eine Niete zu werfen, hast du das Spiel sofort gewonnen – egal wie viele Punkte du hast. Aufhören geht nicht. Bei einer Niete gibt es nichts." },
];

/** Allgemeine Würfelwertung, für die Regelübersicht */
export const DICE_RULES = [
  ["1", "100"],
  ["5", "50"],
  ["Drei Einsen", "1000"],
  ["Drei Zweien … Sechsen", "Zahl × 100"],
] as const;

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c])) as Record<CardId, CardType>;
export const DECK_SIZE = CARDS.reduce((s, c) => s + c.count, 0); // 56
export const MAX_PLAYERS = 12;
export const MAX_NAME = 20;
export const POINT_STEPS = [50, 100, 200, 300, 400, 500, 600, 1000, 2000, -50] as const;
const MAX_LOG = 200;

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface LogEntry {
  playerId: string;
  name: string;
  pts: number;
  /** Spieler, denen durch Plus/Minus 1000 Punkte abgezogen wurden */
  penalized: string[];
  cards: CardId[];
  clover?: boolean;
}

export type DiceMode = "real" | "app";

/** Zustand des App-Würfels im laufenden Zug */
export interface DiceState {
  /** aktueller Wurf (Augenzahlen) */
  roll: number[];
  /** Auswahl im aktuellen Wurf */
  sel: boolean[];
  /** seit dem letzten Tutto beiseitegelegte Würfel */
  aside: number[];
  /** Wurf ohne wertbare Würfel */
  bust: boolean;
  /** gerade ein Tutto geschafft */
  tutto: boolean;
  /** Tuttos mit der aktuellen Karte (Kleeblatt) */
  tuttos: number;
  /** zählt Würfe hoch, damit die Oberfläche neu animieren kann */
  n: number;
}

export interface GameState {
  v: 1;
  /** Echte Würfel am Tisch oder App-Würfel (fehlt bei alten Spielständen = echt) */
  diceMode?: DiceMode;
  dice?: DiceState | null;
  players: Player[];
  hostId: string | null;
  cur: number;
  target: number;
  pile: CardId[];
  turnCards: CardId[];
  turnPts: number;
  pmOn: boolean;
  log: LogEntry[];
  winnerId: string | null;
  cloverWin: boolean;
  started: boolean;
}

export type Action =
  | { type: "draw" }
  | { type: "addPts"; delta: number }
  | { type: "clearPts" }
  | { type: "double" }
  | { type: "setPm"; on: boolean }
  | { type: "book"; zero?: boolean }
  | { type: "clover" }
  | { type: "undo" }
  | { type: "shuffle" }
  | { type: "newGame" }
  | { type: "start" }
  | { type: "setTarget"; target: number }
  | { type: "removePlayer"; id: string }
  | { type: "movePlayer"; id: string; dir: -1 | 1 }
  | { type: "setDiceMode"; mode: DiceMode }
  | { type: "roll" }
  | { type: "toggleDie"; i: number };

export class GameError extends Error {}

const ADMIN_ACTIONS = new Set<Action["type"]>(["undo", "shuffle", "newGame", "start", "setTarget", "removePlayer", "movePlayer", "setDiceMode"]);
const TURN_ACTIONS = new Set<Action["type"]>(["draw", "addPts", "clearPts", "double", "setPm", "book", "clover", "roll", "toggleDie"]);

/** Gleichverteilte Zufallszahl 0..n-1 aus dem Krypto-Zufall, ohne Modulo-Verzerrung. */
export function randomInt(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n;
  const a = new Uint32Array(1);
  do crypto.getRandomValues(a); while (a[0] >= limit);
  return a[0] % n;
}

export function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => randomInt(6) + 1);
}

/** Punkte einer Würfelauswahl nach Tutto-Regeln, null wenn ein Würfel nicht wertbar ist. */
export function scoreDice(dice: number[]): number | null {
  if (!dice.length) return null;
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const d of dice) counts[d]++;
  let pts = 0;
  for (let f = 1; f <= 6; f++) {
    let c = counts[f];
    while (c >= 3) { pts += f === 1 ? 1000 : f * 100; c -= 3; }
    if (f === 1) pts += c * 100;
    else if (f === 5) pts += c * 50;
    else if (c > 0) return null;
  }
  return pts;
}

/** Enthält der Wurf überhaupt wertbare Würfel? */
export function canScore(roll: number[], street: boolean, aside: number[]): boolean {
  if (street) return roll.some((d) => !aside.includes(d));
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const d of roll) counts[d]++;
  return counts[1] > 0 || counts[5] > 0 || counts.some((c) => c >= 3);
}

/** Ist die Auswahl gültig? Liefert die Punkte (bei der Straße 0) oder null. */
export function selectionValue(d: DiceState, card: CardId | undefined): number | null {
  const picked = d.roll.filter((_, i) => d.sel[i]);
  if (!picked.length) return null;
  if (card === "street") {
    const set = new Set(picked);
    if (set.size !== picked.length || picked.some((x) => d.aside.includes(x))) return null;
    return 0;
  }
  return scoreDice(picked);
}

/** Karten, bei denen man nicht freiwillig aufhören darf, bevor Tutto oder Niete fällt */
export const MUST_PLAY = new Set<CardId>(["fire", "street", "pm", "clover"]);
/** Karten, bei denen die normalen Würfelpunkte nicht zählen */
const NO_DICE_POINTS = new Set<CardId>(["street", "pm", "clover"]);

function freshDice(): DiceState {
  return { roll: [], sel: [], aside: [], bust: false, tutto: false, tuttos: 0, n: 0 };
}

export function freshPile(): CardId[] {
  const pile: CardId[] = [];
  for (const c of CARDS) for (let i = 0; i < c.count; i++) pile.push(c.id);
  for (let i = pile.length - 1; i > 0; i--) {
    const r = randomInt(i + 1);
    [pile[i], pile[r]] = [pile[r], pile[i]];
  }
  return pile;
}

export function clampTarget(t: number): number {
  if (!Number.isFinite(t)) return 6000;
  return Math.min(50000, Math.max(1000, Math.round(t / 500) * 500));
}

export function createGame(target = 6000): GameState {
  return {
    v: 1, players: [], hostId: null, cur: 0, target: clampTarget(target),
    pile: freshPile(), turnCards: [], turnPts: 0, pmOn: true, log: [],
    winnerId: null, cloverWin: false, started: false,
  };
}

export function cleanName(name: unknown): string {
  return String(name ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
}

export function addPlayer(prev: GameState, p: { id: string; name: string }): GameState {
  const name = cleanName(p.name);
  if (!name) throw new GameError("Bitte gib einen Namen ein.");
  if (prev.players.length >= MAX_PLAYERS) throw new GameError(`Maximal ${MAX_PLAYERS} Spieler.`);
  if (prev.players.some((x) => x.name.toLowerCase() === name.toLowerCase()))
    throw new GameError(`„${name}“ spielt schon mit. Nimm einen anderen Namen.`);
  const s = structuredClone(prev);
  s.players.push({ id: p.id, name, score: 0 });
  if (!s.hostId) s.hostId = p.id;
  return s;
}

export function currentPlayer(s: GameState): Player | undefined {
  return s.players[s.cur];
}

export function applyAction(prev: GameState, a: Action, actorId: string | null): GameState {
  const isHost = actorId === null || actorId === prev.hostId;

  if (ADMIN_ACTIONS.has(a.type) && !isHost) throw new GameError("Das darf nur der Host.");
  if (TURN_ACTIONS.has(a.type)) {
    if (!prev.started) throw new GameError("Das Spiel hat noch nicht begonnen.");
    if (prev.winnerId) throw new GameError("Das Spiel ist schon entschieden.");
    const cur = currentPlayer(prev);
    if (!cur) throw new GameError("Es sind keine Spieler da.");
    if (!isHost && actorId !== cur.id) throw new GameError(`${cur.name} ist am Zug.`);
  }

  const s = structuredClone(prev);

  switch (a.type) {
    case "draw": {
      if (s.diceMode === "app" && s.dice) {
        const card = s.turnCards[s.turnCards.length - 1];
        const midTurn = s.dice.roll.length > 0 || s.dice.aside.length > 0;
        if (s.dice.bust) throw new GameError("Niete – der Zug ist vorbei.");
        if (card === "stop") throw new GameError("Stopp – der Zug ist vorbei.");
        if (!s.dice.tutto && midTurn) throw new GameError("Erst ein Tutto würfeln, dann gibt es eine neue Karte.");
        if (s.dice.tutto && (card === "fire" || card === "clover")) throw new GameError("Mit dieser Karte würfelst du weiter.");
      }
      if (!s.pile.length) s.pile = freshPile();
      s.turnCards.push(s.pile.pop()!);
      if (s.diceMode === "app") s.dice = freshDice();
      return s;
    }
    case "roll": {
      if (s.diceMode !== "app") throw new GameError("Der App-Würfel ist aus.");
      const card = s.turnCards[s.turnCards.length - 1];
      if (!card) throw new GameError("Zieh zuerst eine Karte.");
      if (card === "stop") throw new GameError("Stopp – in diesem Zug wird nicht gewürfelt.");
      const d = s.dice ?? freshDice();
      if (d.bust) throw new GameError("Niete – der Zug ist vorbei.");
      if (d.tutto) {
        if (card !== "fire" && card !== "clover") throw new GameError("Tutto! Zieh eine neue Karte oder trag die Punkte ein.");
        d.tutto = false;
      } else if (d.roll.length) {
        const v = selectionValue(d, card);
        if (v === null) throw new GameError(card === "street" ? "Wähle mindestens eine neue Zahl für die Straße." : "Wähle mindestens einen wertbaren Würfel (1, 5 oder drei Gleiche).");
        if (!NO_DICE_POINTS.has(card)) s.turnPts = Math.min(100000, s.turnPts + v);
        d.aside.push(...d.roll.filter((_, i) => d.sel[i]));
        d.roll = []; d.sel = [];
        if (d.aside.length >= 6) {
          d.aside = [];
          d.tuttos++;
          d.n++;
          applyTutto(s, d, card);
          if (!s.winnerId) s.dice = d;
          return s;
        }
      }
      d.roll = rollDice(6 - d.aside.length);
      d.sel = d.roll.map(() => false);
      d.bust = !canScore(d.roll, card === "street", d.aside);
      d.n++;
      s.dice = d;
      return s;
    }
    case "toggleDie": {
      const d = s.dice;
      if (!d || !d.roll.length || d.bust) throw new GameError("Gerade gibt es nichts auszuwählen.");
      if (!Number.isInteger(a.i) || a.i < 0 || a.i >= d.roll.length) throw new GameError("Diesen Würfel gibt es nicht.");
      d.sel[a.i] = !d.sel[a.i];
      return s;
    }
    case "setDiceMode":
      s.diceMode = a.mode === "app" ? "app" : "real";
      s.dice = null;
      return s;
    case "addPts": {
      if (!(POINT_STEPS as readonly number[]).includes(a.delta)) throw new GameError("Ungültiger Punktwert.");
      s.turnPts = Math.min(100000, Math.max(0, s.turnPts + a.delta));
      return s;
    }
    case "clearPts":
      s.turnPts = 0;
      return s;
    case "double":
      if (!s.turnCards.includes("x2")) throw new GameError("Verdoppeln geht nur mit der x2-Karte.");
      s.turnPts = Math.min(100000, s.turnPts * 2);
      return s;
    case "setPm":
      s.pmOn = !!a.on;
      return s;
    case "book": {
      const p = s.players[s.cur];
      const card = s.turnCards[s.turnCards.length - 1];
      let zero = !!a.zero;
      if (s.diceMode === "app" && s.dice && card) {
        const d = s.dice;
        if (d.bust) zero = card !== "fire";
        else if (!zero && !d.tutto && card !== "stop") {
          if (MUST_PLAY.has(card)) throw new GameError("Mit dieser Karte darfst du nicht aufhören – würfle weiter.");
          // offene Auswahl noch mitnehmen
          const v = d.roll.length ? selectionValue(d, card) : null;
          if (d.roll.length && v === null) throw new GameError("Wähle zuerst wertbare Würfel aus.");
          if (v) s.turnPts = Math.min(100000, s.turnPts + v);
        }
      }
      const pts = zero ? 0 : s.turnPts;
      const penalized: string[] = [];
      if (s.turnCards.includes("pm") && s.pmOn && pts > 0) {
        const max = Math.max(...s.players.map((x) => x.score));
        if (p.score < max) {
          for (const x of s.players) if (x.id !== p.id && x.score === max) { x.score -= 1000; penalized.push(x.id); }
        }
      }
      p.score += pts;
      s.log.push({ playerId: p.id, name: p.name, pts, penalized, cards: s.turnCards });
      if (s.log.length > MAX_LOG) s.log.shift();
      s.turnCards = [];
      s.turnPts = 0;
      s.pmOn = true;
      s.dice = null;
      if (p.score >= s.target) s.winnerId = p.id;
      else s.cur = (s.cur + 1) % s.players.length;
      return s;
    }
    case "clover": {
      if (s.diceMode === "app") throw new GameError("Das Kleeblatt wertet der App-Würfel automatisch.");
      if (!s.turnCards.includes("clover")) throw new GameError("Dafür brauchst du die Kleeblatt-Karte.");
      const p = s.players[s.cur];
      s.log.push({ playerId: p.id, name: p.name, pts: 0, penalized: [], cards: s.turnCards, clover: true });
      s.turnCards = [];
      s.turnPts = 0;
      s.winnerId = p.id;
      s.cloverWin = true;
      return s;
    }
    case "undo": {
      const e = s.log.pop();
      if (!e) throw new GameError("Es gibt nichts zum Zurücknehmen.");
      const idx = s.players.findIndex((x) => x.id === e.playerId);
      if (idx >= 0) { s.players[idx].score -= e.pts; s.cur = idx; }
      for (const id of e.penalized) { const x = s.players.find((y) => y.id === id); if (x) x.score += 1000; }
      s.winnerId = null;
      s.cloverWin = false;
      s.turnCards = [];
      s.turnPts = 0;
      s.pmOn = true;
      s.dice = null;
      return s;
    }
    case "shuffle":
      s.pile = freshPile();
      s.turnCards = [];
      s.dice = null;
      return s;
    case "newGame": {
      const fresh = createGame(s.target);
      fresh.players = s.players.map((p) => ({ ...p, score: 0 }));
      fresh.hostId = s.hostId;
      fresh.started = true;
      fresh.diceMode = s.diceMode;
      return fresh;
    }
    case "start":
      if (!s.players.length) throw new GameError("Mindestens ein Spieler wird gebraucht.");
      s.started = true;
      if (s.cur >= s.players.length) s.cur = 0;
      return s;
    case "setTarget":
      s.target = clampTarget(a.target);
      return s;
    case "removePlayer": {
      const i = s.players.findIndex((p) => p.id === a.id);
      if (i < 0) throw new GameError("Spieler nicht gefunden.");
      s.players.splice(i, 1);
      if (s.cur === i) { s.turnCards = []; s.turnPts = 0; s.dice = null; }
      if (s.cur > i) s.cur--;
      if (s.cur >= s.players.length) s.cur = 0;
      if (s.hostId === a.id) s.hostId = s.players[0]?.id ?? null;
      if (s.winnerId === a.id) { s.winnerId = null; s.cloverWin = false; }
      if (!s.players.length) s.started = false;
      return s;
    }
    case "movePlayer": {
      const i = s.players.findIndex((p) => p.id === a.id);
      const j = i + a.dir;
      if (i < 0 || j < 0 || j >= s.players.length) return s;
      [s.players[i], s.players[j]] = [s.players[j], s.players[i]];
      if (s.cur === i) s.cur = j;
      else if (s.cur === j) s.cur = i;
      return s;
    }
  }
}

/** Wirkung eines Tuttos je nach Karte (nur App-Würfel). */
function applyTutto(s: GameState, d: DiceState, card: CardId): void {
  const c = CARD_BY_ID[card];
  switch (card) {
    case "x2": s.turnPts = Math.min(100000, s.turnPts * 2); break;
    case "street": s.turnPts = Math.min(100000, s.turnPts + 2000); break;
    case "pm": s.turnPts = Math.min(100000, s.turnPts + 1000); s.pmOn = true; break;
    case "fire": break;
    case "clover":
      if (d.tuttos >= 2) {
        const p = s.players[s.cur];
        s.log.push({ playerId: p.id, name: p.name, pts: 0, penalized: [], cards: s.turnCards, clover: true });
        if (s.log.length > MAX_LOG) s.log.shift();
        s.turnCards = []; s.turnPts = 0; s.dice = null;
        s.winnerId = p.id; s.cloverWin = true;
        return;
      }
      break;
    default: if (c.quick) s.turnPts = Math.min(100000, s.turnPts + c.quick);
  }
  d.tutto = true;
}
