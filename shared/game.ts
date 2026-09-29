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
  rule: string;
  /** Punkte-Schnelltaste, die zu dieser Karte passt */
  quick?: number;
}

export const CARDS: CardType[] = [
  { id: "b200", name: "Bonus 200", big: "200", sub: "Bonus", count: 5, color: "#e8a317", quick: 200, rule: "Bei einem Tutto gibt es 200 Punkte extra." },
  { id: "b300", name: "Bonus 300", big: "300", sub: "Bonus", count: 5, color: "#e8a317", quick: 300, rule: "Bei einem Tutto gibt es 300 Punkte extra." },
  { id: "b400", name: "Bonus 400", big: "400", sub: "Bonus", count: 5, color: "#e8a317", quick: 400, rule: "Bei einem Tutto gibt es 400 Punkte extra." },
  { id: "b500", name: "Bonus 500", big: "500", sub: "Bonus", count: 5, color: "#e8a317", quick: 500, rule: "Bei einem Tutto gibt es 500 Punkte extra." },
  { id: "b600", name: "Bonus 600", big: "600", sub: "Bonus", count: 5, color: "#e8a317", quick: 600, rule: "Bei einem Tutto gibt es 600 Punkte extra." },
  { id: "x2", name: "x2", big: "×2", sub: "Verdoppeln", count: 5, color: "#7b2cbf", rule: "Bei einem Tutto werden die Punkte dieses Zugs verdoppelt." },
  { id: "fire", name: "Feuerwerk", big: "✺", sub: "Feuerwerk", count: 5, color: "#e4572e", rule: "Würfeln bis zur Niete, Aufhören geht nicht. Alle Punkte bis dahin zählen." },
  { id: "street", name: "Straße", big: "1–6", sub: "2000 Punkte", count: 5, color: "#2e86ab", quick: 2000, rule: "1 bis 6 je einmal auslegen. Gelingt es, gibt es 2000 Punkte, sonst nichts." },
  { id: "pm", name: "Plus/Minus", big: "±", sub: "1000 Punkte", count: 5, color: "#3a3a3a", quick: 1000, rule: "Bei einem Tutto: 1000 Punkte für dich, der Führende verliert 1000." },
  { id: "stop", name: "Stopp", big: "STOP", sub: "Zug vorbei", count: 10, color: "#d7263d", rule: "Der Zug ist sofort vorbei. Der Nächste ist dran." },
  { id: "clover", name: "Kleeblatt", big: "☘", sub: "Kleeblatt", count: 1, color: "#2a9d4a", rule: "Zweimal hintereinander Tutto – dann ist das Spiel sofort gewonnen." },
];

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

export interface GameState {
  v: 1;
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
  | { type: "movePlayer"; id: string; dir: -1 | 1 };

export class GameError extends Error {}

const ADMIN_ACTIONS = new Set<Action["type"]>(["undo", "shuffle", "newGame", "start", "setTarget", "removePlayer", "movePlayer"]);
const TURN_ACTIONS = new Set<Action["type"]>(["draw", "addPts", "clearPts", "double", "setPm", "book", "clover"]);

function randomInt(n: number): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % n;
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
      if (!s.pile.length) s.pile = freshPile();
      s.turnCards.push(s.pile.pop()!);
      return s;
    }
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
      const pts = a.zero ? 0 : s.turnPts;
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
      if (p.score >= s.target) s.winnerId = p.id;
      else s.cur = (s.cur + 1) % s.players.length;
      return s;
    }
    case "clover": {
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
      return s;
    }
    case "shuffle":
      s.pile = freshPile();
      s.turnCards = [];
      return s;
    case "newGame": {
      const fresh = createGame(s.target);
      fresh.players = s.players.map((p) => ({ ...p, score: 0 }));
      fresh.hostId = s.hostId;
      fresh.started = true;
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
