import type { ReactNode } from "react";
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

function Die({ n, x, y, size, color }: { n: number; x: number; y: number; size: number; color: string }) {
  const k = size / 10;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={size} height={size} rx={size * 0.18} fill="#fff" stroke={color} strokeWidth={size * 0.06} />
      {PIPS[n].map(([px, py], i) => <circle key={i} cx={px * k} cy={py * k} r={size * 0.085} fill={color} />)}
    </g>
  );
}

function Clover({ color }: { color: string }) {
  const leaf = "M50 50 C 30 44, 22 22, 38 16 C 46 13, 50 22, 50 30 C 50 22, 54 13, 62 16 C 78 22, 70 44, 50 50 Z";
  return (
    <g>
      {[0, 90, 180, 270].map((r) => <path key={r} d={leaf} fill={color} transform={`rotate(${r} 50 50)`} />)}
      <path d="M50 52 Q 56 72 68 84" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="50" r="4" fill="#1d6b33" />
    </g>
  );
}

function Firework() {
  const colors = ["#e4572e", "#f2a93b", "#7b2cbf", "#2e86ab"];
  const burst = (cx: number, cy: number, r: number, c: string, n: number) => (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return <line key={i} x1={cx + Math.cos(a) * r * 0.35} y1={cy + Math.sin(a) * r * 0.35} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke={c} strokeWidth="3.2" strokeLinecap="round" />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.16} fill={c} />
    </g>
  );
  return (
    <g>
      {burst(50, 42, 30, colors[0], 14)}
      {burst(24, 74, 15, colors[1], 10)}
      {burst(78, 76, 14, colors[2], 10)}
      {burst(80, 18, 10, colors[3], 8)}
    </g>
  );
}

function StopSign() {
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 8) + (i * Math.PI) / 4;
    return `${50 + Math.cos(a) * 44},${50 + Math.sin(a) * 44}`;
  }).join(" ");
  return (
    <g>
      <polygon points={pts} fill="#d7263d" stroke="#fff" strokeWidth="3" />
      <polygon points={pts} fill="none" stroke="#d7263d" strokeWidth="1.5" transform="translate(50 50) scale(1.06) translate(-50 -50)" />
      <text x="50" y="59" textAnchor="middle" fontSize="25" fontWeight="800" fill="#fff" letterSpacing="1">STOP</text>
    </g>
  );
}

/** Mittelbild der Karte als SVG (viewBox 100×100) */
function Art({ card }: { card: CardType }): ReactNode {
  const c = card.color;
  switch (card.id) {
    case "stop": return <StopSign />;
    case "clover": return <Clover color={c} />;
    case "fire": return <Firework />;
    case "street":
      return (
        <g>
          {[1, 2, 3, 4, 5, 6].map((n, i) => <Die key={n} n={n} x={8 + (i % 3) * 30} y={14 + Math.floor(i / 3) * 32} size={24} color={c} />)}
          <text x="50" y="96" textAnchor="middle" fontSize="14" fontWeight="800" fill={c}>2000</text>
        </g>
      );
    case "x2":
      return (
        <g>
          <circle cx="50" cy="50" r="42" fill={c} />
          <circle cx="50" cy="50" r="36" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="4 4" />
          <text x="50" y="66" textAnchor="middle" fontSize="44" fontWeight="800" fill="#fff">×2</text>
        </g>
      );
    case "pm":
      return (
        <g>
          <rect x="6" y="10" width="88" height="36" rx="10" fill="#2a9d4a" />
          <text x="50" y="38" textAnchor="middle" fontSize="24" fontWeight="800" fill="#fff">+1000</text>
          <rect x="6" y="54" width="88" height="36" rx="10" fill="#d7263d" />
          <text x="50" y="82" textAnchor="middle" fontSize="24" fontWeight="800" fill="#fff">−1000</text>
        </g>
      );
    default: {
      // Bonus-Karten
      const ray = Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const r = i % 2 ? 30 : 46;
        return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`;
      }).join(" ");
      return (
        <g>
          <polygon points={ray} fill="#fbd46b" />
          <circle cx="50" cy="50" r="30" fill={c} />
          <text x="50" y="60" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff">{card.big}</text>
        </g>
      );
    }
  }
}

const TITLE: Partial<Record<CardType["id"], string>> = { b200: "Bonus", b300: "Bonus", b400: "Bonus", b500: "Bonus", b600: "Bonus", pm: "Plus / Minus", x2: "Verdoppeln" };

/** Vorderseite im Stil der Tutto-Karten: weißer Rand, farbiger Rahmen, Titelband, Bild, Eckzeichen. */
export function CardFace({ card }: { card: CardType }) {
  const title = TITLE[card.id] ?? card.name;
  const showSub = card.sub.toLowerCase() !== title.toLowerCase() && card.id !== "street";
  const corner = card.id.startsWith("b") ? card.big : card.id === "x2" ? "×2" : card.id === "pm" ? "±" : card.id === "street" ? "1–6" : card.id === "stop" ? "■" : card.id === "clover" ? "☘" : "✺";
  return (
    <div className="flex size-full flex-col rounded-[6cqw] p-[3.5cqw]" style={{ background: card.color }}>
      <div className="relative flex flex-1 flex-col rounded-[4cqw] bg-paper px-[5cqw] pt-[11cqw] pb-[10cqw] text-paper-ink">
        <span className="absolute top-[3cqw] left-[4cqw] text-[7cqw] leading-none font-extrabold" style={{ color: card.color }}>{corner}</span>
        <span className="absolute right-[4cqw] bottom-[3cqw] rotate-180 text-[7cqw] leading-none font-extrabold" style={{ color: card.color }}>{corner}</span>
        <div className="mx-auto rounded-full px-[5cqw] py-[1.5cqw] text-[7.5cqw] leading-tight font-extrabold tracking-wide text-white uppercase" style={{ background: card.color }}>
          {title}
        </div>
        <svg viewBox="0 0 100 100" className="mx-auto mt-[4cqw] mb-[2cqw] min-h-0 w-[86%] flex-1" aria-hidden="true">
          <Art card={card} />
        </svg>
        {showSub && <div className="text-center text-[6.5cqw] leading-tight font-semibold text-paper-ink/75">{card.sub}</div>}
      </div>
    </div>
  );
}
