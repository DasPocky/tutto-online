import type { Action, GameState } from "./game";

export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 5;
export const ROOM_CODE_RE = /^[A-HJ-NP-Z2-9]{5}$/;
export const PIN_RE = /^\d{4,8}$/;

export type ClientMessage =
  | { type: "join"; name?: string; pin?: string; playerId?: string; token?: string }
  | { type: "action"; action: Action }
  /** Nur Host: Raum sofort und endgültig löschen */
  | { type: "closeRoom" };

export type ErrorCode = "bad_pin" | "locked" | "kicked" | "not_joined" | "rejected" | "closed";

export type ServerMessage =
  | { type: "joined"; playerId: string; token: string }
  | { type: "state"; state: GameState; you: string; online: string[] }
  | { type: "error"; message: string; code?: ErrorCode; fatal?: boolean };
