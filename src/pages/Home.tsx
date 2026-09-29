import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PIN_RE, ROOM_CODE_RE } from "@shared/protocol";
import { cleanName } from "@shared/game";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <main className="mx-auto max-w-md px-4 pt-[8vh] pb-10">
      <div className="text-center">
        <div className="mx-auto mb-4 grid size-16 -rotate-6 place-items-center rounded-2xl border-[5px] border-paper bg-[var(--card-back)] text-2xl font-extrabold text-paper shadow-xl">T</div>
        <h1 className="text-6xl font-extrabold leading-none tracking-tighter">Tutto</h1>
        <p className="mt-3 text-muted-foreground">Karten ziehen und Punkte zählen – gemeinsam an einem Tisch oder jeder am eigenen Handy.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
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
              <div className="flex items-center gap-1">
                <Button variant="secondary" size="icon" onClick={() => setTarget((t) => Math.max(1000, t - 1000))} aria-label="Weniger">−</Button>
                <b className="min-w-[5.5ch] text-center tabular-nums">{fmt(target)}</b>
                <Button variant="secondary" size="icon" onClick={() => setTarget((t) => Math.min(50000, t + 1000))} aria-label="Mehr">+</Button>
              </div>
            </div>
            <Button size="lg" disabled={!nameOk || !pinOk || busy} onClick={create}>
              {busy && <Loader2 className="animate-spin" />}Raum erstellen
            </Button>
            <p className="text-sm text-muted-foreground">Mitspieler brauchen den Raumcode und die PIN. Du bist automatisch Host.</p>
          </Card>
        </TabsContent>

        <TabsContent value="join">
          <Card className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Raumcode</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5))}
                autoComplete="off" autoCapitalize="characters" placeholder="ABC23" className="text-xl font-bold tracking-[0.3em]" />
            </div>
            {nameField}
            {pinField}
            <Button size="lg" disabled={!nameOk || !pinOk || !codeOk} onClick={join}>Beitreten</Button>
          </Card>
        </TabsContent>
      </Tabs>

      {error && <p role="alert" className="mt-4 rounded-xl bg-destructive/15 p-3 text-destructive">{error}</p>}

      <Button variant="ghost" className="mt-6 w-full text-muted-foreground" onClick={() => navigate("/lokal")}>
        Nur auf diesem Gerät spielen
      </Button>
    </main>
  );
}
