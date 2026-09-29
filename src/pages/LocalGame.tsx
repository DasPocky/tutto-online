import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { addPlayer, applyAction, createGame, GameError, type Action, type GameState } from "@shared/game";
import { GameScreen } from "@/components/game/GameScreen";
import { navigate } from "@/hooks/useRoute";
import { readJSON, writeJSON } from "@/lib/storage";

const KEY = "tutto:local";

/** Offline-Modus: ein Gerät, alle Spieler. Der Spielstand bleibt im Browser. */
export function LocalGame() {
  const [state, setState] = useState<GameState>(() => {
    const saved = readJSON<GameState>(KEY);
    return saved?.v === 1 ? saved : createGame();
  });

  useEffect(() => writeJSON(KEY, state), [state]);

  const run = useCallback((fn: (s: GameState) => GameState) => {
    setState((s) => {
      try { return fn(s); } catch (e) {
        if (e instanceof GameError) queueMicrotask(() => toast(e.message));
        return s;
      }
    });
  }, []);

  return (
    <GameScreen
      state={state}
      me={null}
      online={null}
      onAction={(a: Action) => run((s) => applyAction(s, a, null))}
      onAddLocal={(name) => run((s) => addPlayer(s, { id: crypto.randomUUID(), name }))}
      onLeave={() => navigate("/")}
    />
  );
}
