import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Raumcode groß anzeigen und Link teilen. Die PIN gehört bewusst nicht in den Link. */
export function ShareCode({ code }: { code: string }) {
  const url = `${location.origin}/r/${code}`;
  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: "Tutto", text: `Spiel mit! Raumcode ${code}`, url }); return; }
      await navigator.clipboard.writeText(url);
      toast("Link kopiert");
    } catch { /* abgebrochen */ }
  };
  return (
    <div className="flex items-center justify-between gap-3 glass rounded-2xl p-4">
      <div>
        <div className="text-sm text-muted-foreground">Raumcode</div>
        <div className="text-3xl font-extrabold tracking-[0.18em] tabular-nums">{code}</div>
      </div>
      <Button onClick={share}><Share2 />Einladen</Button>
    </div>
  );
}
