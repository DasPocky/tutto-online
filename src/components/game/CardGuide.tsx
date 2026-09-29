import { useEffect, useRef, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { CARDS, DICE_RULES, type CardId } from "@shared/game";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CardFace } from "./CardFace";
import { cn } from "@/lib/utils";

/** Alle Karten mit Bild und ausführlicher Erklärung. Öffnet sich bei der gerade gezogenen Karte. */
export function CardGuide({ focus, children }: { focus?: CardId; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // Bonuskarten nur einmal zeigen
  const cards = CARDS.filter((c) => !c.id.startsWith("b") || c.id === "b300");
  const focusId = focus?.startsWith("b") ? "b300" : focus;

  useEffect(() => {
    if (!open || !focusId) return;
    const t = setTimeout(() => listRef.current?.querySelector(`[data-card="${focusId}"]`)?.scrollIntoView({ block: "start", behavior: "smooth" }), 250);
    return () => clearTimeout(t);
  }, [open, focusId]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children ?? (
          <button type="button" aria-label="Was bedeutet die Karte?"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-foreground ring-1 ring-inset ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Info className="size-4.5" />
          </button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Karten & Regeln</SheetTitle>
          <SheetDescription>Was jede Karte bedeutet und wie gewertet wird.</SheetDescription>
        </SheetHeader>
        <div ref={listRef} className="overflow-y-auto px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <section className="glass rounded-2xl p-4">
            <h3 className="font-semibold">So läuft ein Zug</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Karte ziehen, dann mit 6 Würfeln würfeln. Nach jedem Wurf legst du mindestens einen wertbaren Würfel beiseite und würfelst mit dem Rest weiter – oder hörst auf und schreibst die Punkte auf.
              Wirfst du nichts Wertbares, ist es eine <b className="text-foreground">Niete</b> und die Punkte des Zugs sind weg.
              Hast du alle 6 Würfel gewertet, ist das ein <b className="text-foreground">Tutto</b>.
            </p>
            <h3 className="mt-4 font-semibold">Würfelwertung</h3>
            <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
              {DICE_RULES.map(([k, v]) => (
                <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-semibold tabular-nums">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Drei Gleiche zählen nur, wenn sie in einem Wurf fallen. 2, 3, 4 und 6 zählen einzeln nichts.</p>
          </section>

          <ul className="mt-5 grid gap-3">
            {cards.map((c) => (
              <li key={c.id} data-card={c.id}
                className={cn("flex scroll-mt-3 gap-4 rounded-2xl p-3.5", c.id === focusId ? "bg-navy-600/60 ring-1 ring-inset ring-navy-300/50" : "glass")}>
                <div className="@container aspect-[5/7] w-18 shrink-0 self-start"><CardFace card={c} /></div>
                <div className="min-w-0">
                  <h4 className="font-bold">
                    {c.id === "b300" ? "Bonus 200 – 600" : c.name}
                    <span className="block text-xs font-normal text-muted-foreground">{c.id === "b300" ? "25×" : `${c.count}×`} im Stapel</span>
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.id === "b300" ? c.help.replace("300", "200 bis 600") : c.help}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
