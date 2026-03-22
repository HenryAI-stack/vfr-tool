# ✈️ VFR FlightPlan

**PPL VFR Flugplanungs-Tool** – Single-Page Web App für Private Pilot Licence Inhaber.  
Hosted on GitHub Pages · Keine Installation · Läuft im Browser.

🔗 **Live:** https://henryai-stack.github.io/vfr-tool/

---

## Features

### 🗺️ Routenplanung
- Automatische Routenberechnung via **AIP Poland VFR Reporting Points** (12 polnische Flughäfen mit echten VRPs)
- **Klasse-C Luftraum Vermeidung** – live Zonen-Daten von OpenAIP API (bbox-basierter Abruf)
- Umgehungs-Wegpunkte werden automatisch in die Route eingefügt
- Routing-Modi: Via Reporting Points oder Direkt
- **Drag & Drop** Wegpunkte auf der Karte verschieben
- Wegpunkte hinzufügen/löschen (Klick auf Karte → Koordinaten übernehmen)
- **⇄ Swap-Button** zum schnellen Tauschen von Abflug und Ziel
- Waypoint-Sperre (verhindert unbeabsichtigte Änderungen)

### 🌤️ Wetter (METAR/TAF)
- **CheckWX API** (decoded METAR/TAF, primär)
- **aviationweather.gov** (Fallback, via CORS Proxy)
- VFR / MVFR / IFR Klassifikation
- Spezifische Fallback-Mappings (z.B. EPRP → EPRA)
- Link zu metar-taf.com für jeden Flughafen

### ⚠️ NOTAMs
- **Eigener NOTAM Worker** (`notam-worker.henry-ai-server.workers.dev`)  
  Quelle: autorouter.aero → Eurocontrol EAD
- POST-Request mit beiden ICAOs in einem Call
- Klick auf NOTAM-Eintrag → modales Detail-Fenster mit Raw Text
- Link zur FAA NOTAM Search

### 💾 Gespeicherte Routen (Google Drive)
- Routen automatisch in **Google Drive appDataFolder** synchronisiert
- Geräteübergreifende Sync (selber Google Account)
- localStorage als Fallback wenn Drive nicht verfügbar
- Route laden, bearbeiten, löschen
- **Export pro Route:** GPX (kompatibel mit Garmin, SkyDemon, ForeFlight) und KML (Google Earth, Avenza Maps)

### 🛩️ Flugdaten (enginetime Integration)
- Liest **enginetime** Fluglog-Dateien aus Google Drive (`enginelog_*.json`)
- Zeigt: Route, Motor AN / Takeoff / Motor AUS (Lokalzeit), Motorzeit (berechnet)
- Klick auf Eintrag → modales Detail-Fenster
- **CSV Export** aller Flugdaten
- Alle Zeitangaben in Lokalzeit

### 📱 PWA (Progressive Web App)
- Installierbar auf Android und iOS (Homescreen)
- Service Worker für Offline-Verfügbarkeit der App Shell
- `manifest.json` mit Icons in allen Größen

### 🖨️ PDF Export
- Vollständiger 2-seitiger Flugplan (Übersicht, Route, Frequenzen, Wetter, NOTAMs, Logbuch)
- Druckoptimiertes CSS Layout

---

## Technischer Stack

| Komponente | Technologie |
|---|---|
| Frontend | Vanilla HTML/CSS/JS (Single File) |
| Karte | Leaflet.js + OpenStreetMap + OpenTopoMap |
| Auth | Google Identity Services (GSI) |
| Datenspeicherung | Google Drive appDataFolder API |
| Hosting | GitHub Pages |
| CORS Proxy | Cloudflare Worker (`vfr-proxy.henry-ai-server.workers.dev`) |
| NOTAM Worker | Cloudflare Worker (`notam-worker.henry-ai-server.workers.dev`) |

---

## Repository Struktur

```
vfr-tool/
├── index.html                    ← Komplette App (Single Page)
├── manifest.json                 ← PWA Manifest
├── sw.js                         ← Service Worker (Offline)
├── README.md                     ← Diese Datei
└── src/
    ├── favicon.ico               ← Browser Tab Icon
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    ├── apple-touch-icon.png      ← iOS Homescreen Icon
    ├── android-chrome-192x192.png
    └── android-chrome-512x512.png
```

---

## Einrichtung / Konfiguration

### 1. Google Cloud Console
Für Google Login und Drive Sync:
1. Projekt erstellen auf [console.cloud.google.com](https://console.cloud.google.com)
2. OAuth 2.0 Client ID erstellen (Web Application)
3. Authorized JavaScript origins: `https://henryai-stack.github.io`
4. Scope aktivieren: `https://www.googleapis.com/auth/drive.appdata`

### 2. Cloudflare Workers
Zwei Workers sind erforderlich:

**CORS Proxy** (`vfr-proxy.henry-ai-server.workers.dev`):
- Leitet HTTPS-Requests durch und setzt CORS-Header
- Wird für aviationweather.gov und OpenAIP benötigt
- Worker-Code: siehe Projekt-Dokumentation

**NOTAM Worker** (`notam-worker.henry-ai-server.workers.dev`):
- Eigener NOTAM-Abruf via autorouter.aero → Eurocontrol EAD
- POST `/notams` mit `{ icao: ["EPWA", "EPKK"] }`
- Server-seitiger Cache, kein API-Key benötigt

### 3. API Keys (optional, in ⚙️ Einstellungen)

| Key | Quelle | Zweck |
|---|---|---|
| **CheckWX** | [checkwxapi.com](https://www.checkwxapi.com) | Decoded METAR/TAF (kostenlos, 1000 req/Tag) |
| **OpenAIP** | [openaip.net](https://www.openaip.net) | Luftraum-Kartenlayer + Klasse-C Zonen (kostenlos) |
| **CORS Proxy URL** | Eigener Cloudflare Worker | Pflichtfeld für Weather-Fallback |

---

## Unterstützte Flughäfen (VRP-Datenbank)

### 🇵🇱 Polen (AIP Poland, echte Reporting Points)
EPWA · EPKK · EPKT · EPGD · EPWR · EPPO · EPSC · EPLL · EPRZ · EPBY · EPRA · EPMO

### 🇦🇹 Österreich
LOWW · LOWI · LOWS · LOGG · LOKL · LORK

### 🇩🇪 Deutschland
EDDM · EDDN · EDDF · EDDL · EDDB · EDDH

### 🇨🇭 Schweiz
LSZH · LSZB · LSGG

### 🇨🇿 Tschechien / 🇸🇰 Slowakei / 🇸🇮 Slowenien / 🇭🇷 Kroatien / 🇭🇺 Ungarn
LKPR · LZIB · LJLJ · LDZA · LHBP

---

## Klasse-C Luftraum Vermeidung

Beim Planen einer Route werden automatisch Klasse-C Zonen aus der OpenAIP API geladen (Bounding Box um die Route). Die App:
1. Prüft jeden Streckenabschnitt auf Konflikte mit Klasse-C Zonen
2. Berechnet Tangentenpunkte links/rechts der Zone
3. Fügt den kürzeren Umweg als Wegpunkt ein (orange Raute auf der Karte)

Aktiv ab FL055 – unter dieser Höhe werden keine Klasse-C Zonen berücksichtigt.

---

## Verwandte Projekte

| Projekt | Beschreibung |
|---|---|
| [enginetime](https://henryai-stack.github.io/enginetime/) | Motor-Timestamp Erfassung für ATOM System |
| notam-fetch | Cloudflare Worker für NOTAM-Abruf via Eurocontrol EAD |

---

## Lizenz / Haftungsausschluss

⚡ **Dieses Tool ist eine Planungshilfe und ersetzt NICHT die offizielle Flugvorbereitung.**  
Immer AustroControl AIS, PANSA AIS und offizielle NOTAM-Quellen prüfen.  
Keine Haftung für Unvollständigkeiten oder Fehler.

---

*Entwickelt mit Claude AI (Anthropic) · GitHub Pages · Cloudflare Workers*
