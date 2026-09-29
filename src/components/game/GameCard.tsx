import { useEffect, useRef, useState } from "react";
import { CARD_BY_ID, type CardId } from "@shared/game";
import { cn, vibrate } from "@/lib/utils";

const reduceMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Die Tutto-Karte mit Umdreh-Animation. Zeigt immer die zuletzt gezogene Karte des Zugs. */
export function GameCard({ cards, onDraw, disabled }: { cards: CardId[]; onDraw?: () => void; disabled?: boolean }) {
  const latest = cards.length ? cards[cards.length - 1] : null;
  const [shown, setShown] = useState<CardId | null>(latest);
  const [flipped, setFlipped] = useState(!!latest);
  const prevCount = useRef(cards.length);

  useEffect(() => {
    const changed = cards.length !== prevCount.current;
    prevCount.current = cards.length;
    if (!changed) return;
    if (!latest) { setFlipped(false); return; }
    if (latest === "stop") vibrate([40, 50, 40]);
    if (flipped && !reduceMotion()) {
      setFlipped(false);
      const t = setTimeout(() => { setShown(latest); setFlipped(true); }, 420);
      return () => clearTimeout(t);
    }
    setShown(latest);
    const r = requestAnimationFrame(() => setFlipped(true));
    return () => cancelAnimationFrame(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length, latest]);

  const t = shown ? CARD_BY_ID[shown] : null;

  return (
    <button
      type="button"
      onClick={() => { if (!disabled) { vibrate(12); onDraw?.(); } }}
      disabled={disabled}
      aria-label={t && flipped ? `${t.name}. Tippen für die nächste Karte` : "Karte ziehen"}
      className="flip mx-auto block w-[min(52vw,210px)] rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring active:scale-[0.97] transition-transform disabled:cursor-default"
    >
      <div className="flip-inner relative aspect-[5/7]" data-flipped={flipped}>
        <div className="flip-face card-back grid place-items-center rounded-2xl border-[9px] border-paper shadow-[0_12px_28px_rgba(0,0,0,.4)]">
          <span className="-rotate-8 text-3xl font-extrabold text-paper">TUTTO</span>
          {!disabled && <span className="absolute inset-x-0 bottom-3 text-center text-xs text-paper/85">Tippen zum Ziehen</span>}
        </div>
        <div
          className="flip-face flip-front flex flex-col rounded-2xl border-t-[11px] bg-paper p-3 text-center text-paper-ink shadow-[0_12px_28px_rgba(0,0,0,.4)]"
          style={{ borderTopColor: t?.color ?? "#999" }}
        >
          {t && (
            <>
              <div className="grid flex-1 place-items-center">
                <div className={cn("font-extrabold leading-none tracking-tight", t.big.length > 3 ? "text-4xl" : "text-5xl")} style={{ color: t.color }}>
                  {t.big}
                  <small className="mt-1.5 block text-sm font-semibold tracking-normal text-paper-ink">{t.sub}</small>
                </div>
              </div>
              <div className="text-base font-extrabold">{t.name}</div>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
