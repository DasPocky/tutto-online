import { useState } from "react";
import { ChevronRight, Loader2, Smartphone } from "lucide-react";
import { PIN_RE, ROOM_CODE_RE } from "@shared/protocol";
import { cleanName } from "@shared/game";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/game/GameScreen";
import { navigate } from "@/hooks/useRoute";
import { NAME_KEY, setPendingJoin } from "@/lib/storage";
import { fmt } from "@/lib/utils";

function useRememberedName() {
  const [name, setName] = useState(() => { try { return localStorage.getItem(NAME_KEY) ?? ""; } catch { return ""; } });
  const remember = (n: string) => { try { localStorage.setItem(NAME_KEY, n); } catch { /* egal */ } };
  return [name, setName, remember] as const;
}

export function Home({ initialCode }: { initialCode?: string }) {
  const [tab, setTab] = useState(initialCode ? "join" : "create");
  const [name, setName, rememberName] = useRememberedName();
  const [pin, setPin] = useState("");
  const [code, setCode] = useState(initialCode ?? "");
  const [target, setTarget] = useState(6000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameOk = cleanName(name).length > 0;
  const pinOk = PIN_RE.test(pin);
  const codeOk = ROOM_CODE_RE.test(code);

  const create = async () => {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin, target }),
      });
      const data = (await res.json()) as { code?: string; error?: string };
      if (!res.ok || !data.code) throw new Error(data.error ?? "Raum konnte nicht erstellt werden.");
      rememberName(cleanName(name));
      setPendingJoin(data.code, { name: cleanName(name), pin });
      navigate(`/r/${data.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Keine Verbindung zum Server.");
    } finally {
      setBusy(false);
    }
  };

  const join = () => {
    rememberName(cleanName(name));
    setPendingJoin(code, { name: cleanName(name), pin });
    navigate(`/r/${code}`);
  };

  const pinField = (
    <div className="grid gap-2">
      <Label htmlFor="pin">PIN (4–8 Ziffern)</Label>
      <Input id="pin" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
        inputMode="numeric" autoComplete="off" placeholder="z. B. 4711" className="tracking-[0.3em]" />
    </div>
  );
  const nameField = (
    <div className="grid gap-2">
      <Label htmlFor="name">Dein Name</Label>
      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoComplete="nickname" placeholder="Name" />
    </div>
  );

  return (
    <main className="mx-auto flex min-h-dvh-safe max-w-md flex-col px-4 pt-[6vh] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="text-center">
        <Logo className="mx-auto mb-4 size-16 -rotate-6 rounded-2xl text-3xl" />
        <h1 className="bg-gradient-to-b from-white to-navy-300 bg-clip-text text-5xl font-extrabold leading-none tracking-tighter text-transparent">Tutto</h1>
        <p className="mx-auto mt-3 max-w-[30ch] text-muted-foreground">Karten ziehen und Punkte zählen – am Tisch oder jeder am eigenen Handy.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-7">
        <TabsList>
          <TabsTrigger value="create">Raum erstellen</TabsTrigger>
          <TabsTrigger value="join">Beitreten</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card className="grid gap-4">
            {nameField}
            {pinField}
            <div className="flex items-center justify-between">
              <Label>Spielziel</Label>
              <div className="flex items-center gap-1 rounded-xl bg-navy-950/45 p-1 ring-1 ring-inset ring-border">
                <Button variant="ghost" size="icon" className="size-10" onClick={() => setTarget((t) => Math.max(1000, t - 1000))} aria-label="Weniger">−</Button>
                <b className="min-w-[5.5ch] text-center tabular-nums">{fmt(target)}</b>
                <Button variant="ghost" size="icon" className="size-10" onClick={() => setTarget((t) => Math.min(50000, t + 1000))} aria-label="Mehr">+</Button>
              </div>
            </div>
            <Button size="lg" disabled={!nameOk || !pinOk || busy} onClick={create}>
              {busy && <Loader2 className="animate-spin" />}Raum erstellen
            </Button>
            <p className="text-sm text-muted-foreground">Mitspieler brauchen Raumcode und PIN. Du bist automatisch Host.</p>
          </Card>
        </TabsContent>

        <TabsContent value="join">
          <Card className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Raumcode</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5))}
                autoComplete="off" autoCapitalize="characters" placeholder="ABC23" className="text-center text-xl font-bold tracking-[0.3em]" />
            </div>
            {nameField}
            {pinField}
            <Button size="lg" disabled={!nameOk || !pinOk || !codeOk} onClick={join}>Beitreten</Button>
          </Card>
        </TabsContent>
      </Tabs>

      {error && <p role="alert" className="mt-4 rounded-xl bg-destructive/15 p-3 text-destructive">{error}</p>}

      <button
        type="button"
        onClick={() => navigate("/lokal")}
        className="glass mt-4 flex w-full items-center gap-3 rounded-2xl p-4 text-left outline-none transition active:scale-[0.99] focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy-600"><Smartphone className="size-5" /></span>
        <span className="flex-1">
          <span className="block font-semibold">Nur auf diesem Gerät</span>
          <span className="block text-sm text-muted-foreground">Alle spielen an einem Handy, ohne Internet</span>
        </span>
        <ChevronRight className="size-5 text-muted-foreground" />
      </button>
    </main>
  );
}
