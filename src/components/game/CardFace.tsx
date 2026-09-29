import type { CardType } from "@shared/game";

/** Augen-Positionen für Würfelseiten 1–6 (im 10×10-Raster) */
const PIPS: Record<number, [number, number][]> = {
  1: [[5, 5]],
  2: [[3, 3], [7, 7]],
  3: [[3, 3], [5, 5], [7, 7]],
  4: [[3, 3], [7, 3], [3, 7], [7, 7]],
  5: [[3, 3], [7, 3], [5, 5], [3, 7], [7, 7]],
  6: [[3, 3], [7, 3], [3, 5], [7, 5], [3, 7], [7, 7]],
};

/** Helle Tönung einer Kartenfarbe (für Flächen) */
const tint = (hex: string, a: number) => `${hex}${Math.round(a * 255).toString(16).padStart(2, "0")}`;

function Art({ card }: { card: CardType }) {
  const c = card.color;
  switch (card.id) {
    case "stop": {
      const pts = Array.from({ length: 8 }, (_, i) => {
        const a = Math.PI / 8 + (i * Math.PI) / 4;
        return `${50 + Math.cos(a) * 40},${50 + Math.sin(a) * 40}`;
      }).join(" ");
      return (
        <g>
          <polygon points={pts} fill={c} />
          <text x="50" y="58.5" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff" letterSpacing="1">STOP</text>
        </g>
      );
    }
    case "clover": {
      const leaf = "M50 50 C 32 45, 25 25, 39 19 C 46 16, 50 24, 50 31 C 50 24, 54 16, 61 19 C 75 25, 68 45, 50 50 Z";
      return (
        <g>
          <circle cx="50" cy="50" r="44" fill={tint(c, 0.12)} />
          {[0, 90, 180, 270].map((r) => <path key={r} d={leaf} fill={c} transform={`rotate(${r} 50 50)`} />)}
          <path d="M52 54 Q 57 70 66 80" stroke={c} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </g>
      );
    }
    case "fire": {
      const burst = (cx: number, cy: number, r: number, n: number, o: number) =>
        Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2;
          return <line key={`${cx}-${i}`} x1={cx + Math.cos(a) * r * 0.4} y1={cy + Math.sin(a) * r * 0.4} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke={c} strokeOpacity={o} strokeWidth="3.2" strokeLinecap="round" />;
        });
      return (
        <g>
          <circle cx="50" cy="50" r="44" fill={tint(c, 0.1)} />
          {burst(50, 44, 28, 14, 1)}
          {burst(26, 72, 13, 10, 0.55)}
          {burst(75, 74, 12, 10, 0.55)}
        </g>
      );
    }
    case "street":
      return (
        <g>
          {[1, 2, 3, 4, 5, 6].map((n, i) => {
            const x = 9 + (i % 3) * 29, y = 14 + Math.floor(i / 3) * 29, k = 2.3;
            return (
              <g key={n} transform={`translate(${x} ${y})`}>
                <rect width="23" height="23" rx="4.5" fill={tint(c, 0.12)} stroke={c} strokeWidth="1.6" />
                {PIPS[n].map(([px, py], j) => <circle key={j} cx={px * k} cy={py * k} r="2.1" fill={c} />)}
              </g>
            );
          })}
          <text x="50" y="90" textAnchor="middle" fontSize="15" fontWeight="800" fill={c}>2000</text>
        </g>
      );
    case "x2":
      return (
        <g>
          <circle cx="50" cy="50" r="40" fill={tint(c, 0.12)} stroke={c} strokeWidth="2.5" />
          <text x="50" y="65" textAnchor="middle" fontSize="42" fontWeight="800" fill={c}>×2</text>
        </g>
      );
    case "pm":
      return (
        <g>
          <rect x="10" y="14" width="80" height="32" rx="9" fill={tint("#4f8a5e", 0.14)} />
          <text x="50" y="38" textAnchor="middle" fontSize="21" fontWeight="800" fill="#4f8a5e">+1000</text>
          <rect x="10" y="54" width="80" height="32" rx="9" fill={tint("#a84a57", 0.14)} />
          <text x="50" y="78" textAnchor="middle" fontSize="21" fontWeight="800" fill="#a84a57">−1000</text>
        </g>
      );
    default: {
      const ray = Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const r = i % 2 ? 36 : 45;
        return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`;
      }).join(" ");
      return (
        <g>
          <polygon points={ray} fill={tint(c, 0.16)} />
          <circle cx="50" cy="50" r="32" fill="none" stroke={c} strokeWidth="2.5" />
          <text x="50" y="59" textAnchor="middle" fontSize="26" fontWeight="800" fill={c}>{card.big}</text>
        </g>
      );
    }
  }
}

const TITLE: Partial<Record<CardType["id"], string>> = { b200: "Bonus", b300: "Bonus", b400: "Bonus", b500: "Bonus", b600: "Bonus", pm: "Plus / Minus", x2: "Verdoppeln" };

/** Vorderseite im Stil der Tutto-Karten: weiße Karte, feiner farbiger Rahmen, Titel, ruhiges Bild. */
export function CardFace({ card }: { card: CardType }) {
  const title = TITLE[card.id] ?? card.name;
  const showSub = card.sub.toLowerCase() !== title.toLowerCase() && card.id !== "street";
  return (
    <div className="size-full rounded-[7cqw] bg-paper p-[4cqw]">
      <div className="flex size-full flex-col items-center rounded-[4.5cqw] px-[5cqw] pt-[7cqw] pb-[6cqw] text-paper-ink" style={{ boxShadow: `inset 0 0 0 1.6cqw ${card.color}` }}>
        <div className="text-[8.5cqw] leading-none font-extrabold tracking-[0.08em] uppercase" style={{ color: card.color }}>{title}</div>
        <div className="mt-[2.5cqw] h-[0.9cqw] w-[18cqw] rounded-full" style={{ background: tint(card.color, 0.45) }} />
        <svg viewBox="0 0 100 100" className="my-[4cqw] min-h-0 w-[84%] flex-1" aria-hidden="true">
          <Art card={card} />
        </svg>
        <div className="min-h-[1lh] text-center text-[7cqw] leading-tight font-semibold text-paper-ink/60">{showSub ? card.sub : ""}</div>
      </div>
    </div>
  );
}
