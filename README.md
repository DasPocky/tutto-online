# Tutto Online

Kartenstapel und Punktezähler für das Würfelspiel **Tutto**, gebaut mit React, TypeScript, Tailwind CSS v4 und shadcn/ui. Es läuft komplett kostenlos auf Cloudflare Workers mit Durable Objects.

- **Online-Räume:** Der Host erstellt einen Raum mit PIN. Mitspieler öffnen den Link, geben Name und PIN ein und sehen Karten, Punkte und Zugreihenfolge live.
- **Lokal:** Alle spielen an einem Gerät, ohne Server. Der Spielstand bleibt im Browser.
- **Ansicht „Einfach“ oder „Voll“** (im Menü, pro Gerät): große Tasten und wenig Text oder alle Tasten und Infos. Das Spiel passt ohne Scrollen auf einen Handy-Bildschirm und lässt sich als App zum Home-Bildschirm hinzufügen.

## Voraussetzungen

- Node.js 20 oder neuer
- Ein kostenloses Cloudflare-Konto (keine Kreditkarte nötig)

## Lokal starten

```bash
npm install
npm run dev
```

Öffne http://localhost:5173. Worker und Durable Objects laufen dabei lokal mit (über `@cloudflare/vite-plugin`). Zum Testen auf dem Handy im selben WLAN startest du mit `npm run dev -- --host` und öffnest die angezeigte Netzwerk-Adresse.

## Online stellen

```bash
npx wrangler login     # einmalig, öffnet den Browser
npm run deploy
```

Danach ist die App unter `https://tutto-online.<dein-subdomain>.workers.dev` erreichbar. Den Namen änderst du in `wrangler.jsonc` unter `name`.

### Automatisch bei jedem Git-Push (empfohlen)

1. Im Cloudflare-Dashboard: **Workers & Pages → Create → Import a repository**.
2. GitHub verbinden und `DasPocky/tutto-online` auswählen.
3. Build-Befehl: `npm run build`, Deploy-Befehl: `npx wrangler deploy`, Produktions-Branch: `main`.

Ab dann baut und deployt Cloudflare jeden Push auf `main` automatisch. Zusätzlich prüft ein GitHub-Actions-Workflow (`.github/workflows/ci.yml`) bei jedem Push und Pull Request, ob der Build durchläuft.

### Eigene Domain (optional)

Im Dashboard beim Worker unter **Settings → Domains & Routes** eine Domain hinzufügen, die bei Cloudflare verwaltet wird.

## Wie es funktioniert

```
Browser ──HTTP──▶ Worker ──▶ statische React-App (dist/client)
        ──WS────▶ Worker ──▶ Durable Object „TuttoRoom“ (einer pro Raumcode)
```

- **`shared/game.ts`:** Die komplette Spiellogik (Kartenstapel, Züge, Plus/Minus, Kleeblatt, Rückgängig). Client (lokal) und Server nutzen denselben Code.
- **`worker/index.ts`:** Die API (`POST /api/rooms`, `GET /api/rooms/:code`, WebSocket unter `/api/rooms/:code/ws`) und das Durable Object. Der Server ist die einzige Wahrheit, Clients schicken nur Aktionen.
- **`src/`:** Die React-App. shadcn-Komponenten liegen in `src/components/ui`, weitere kannst du mit `npx shadcn@latest add <name>` ergänzen.

### Zugang und Sicherheit

- Ein Raum hat einen 5-stelligen Code und eine 4–8-stellige PIN. Die PIN wird gesalzen und gehasht gespeichert und steht nie im Link.
- Nach 8 falschen PINs ist der Raum 10 Minuten gesperrt.
- Nach dem Beitritt merkt sich das Gerät einen geheimen Token. Beim Neuladen oder nach Funkloch geht es ohne PIN weiter.
- Wer den Raum erstellt, ist Host. Nur der Host kann starten, Spieler entfernen oder umsortieren, das Spielziel ändern, rückgängig machen und neu mischen.
- Punkte eintragen und Karten ziehen darf der Spieler am Zug oder der Host. So kann der Host auch für jemanden ohne Handy spielen.
- Räume ohne Aktivität werden nach 48 Stunden automatisch gelöscht. Der Host kann einen Raum im Menü auch sofort löschen.

### Wo liegen welche Daten?

| Ort | Inhalt | Wann gelöscht |
| --- | --- | --- |
| Durable Object `TuttoRoom` (Cloudflare, ein Objekt pro Raumcode) | PIN-Hash + Salt, Spielernamen, Punkte, Verlauf, Kartenstapel, Wiederverbindungs-Tokens, Fehlversuche | 48 h nach der letzten Aktion (Alarm) oder sofort über „Raum löschen“ |
| `localStorage` im Browser | eigener Name, Token pro Raum, lokaler Spielstand, Ansichtsmodus | beim Verlassen des Raums bzw. vom Nutzer |
| `sessionStorage` im Browser | Name + PIN für genau einen Beitritt | direkt nach dem Beitritt |

IP-Adressen oder Konten speichert die App nicht. Cloudflare selbst protokolliert Anfragen (Observability ist in `wrangler.jsonc` aktiv).

### Was passiert bei einem neuen Deploy?

Die gespeicherten Räume bleiben erhalten, denn der Speicher der Durable Objects ist unabhängig vom Code. Offene WebSocket-Verbindungen werden beim Deploy kurz getrennt, die App verbindet sich automatisch mit ihrem Token neu. Wichtig bei Code-Änderungen: Den Klassennamen `TuttoRoom` nicht umbenennen (sonst braucht es eine neue Migration in `wrangler.jsonc`) und das Format von `GameState` rückwärtskompatibel halten.

### Kostenlose Limits

Der Workers-Free-Plan erlaubt 100.000 Anfragen pro Tag. Bei Durable Objects zählen eingehende WebSocket-Nachrichten gebündelt, ausgehende sind gratis. Ein Spieleabend verbraucht davon nur einen Bruchteil.

## Projektstruktur

```
shared/        Spiellogik + Nachrichtenformat (Client & Server)
worker/        Cloudflare Worker + Durable Object
src/
  components/ui/    shadcn/ui-Komponenten
  components/game/  Karte, Punkteleiste, Punkte-Tasten, Menü, Lobby
  hooks/            useRoom (WebSocket), useRoute (Mini-Router)
  pages/            Startseite, lokales Spiel, Online-Raum
wrangler.jsonc  Cloudflare-Konfiguration
```
