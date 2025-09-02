# Volleyball Team Manager PWA

Eine umfassende Progressive Web App zur Verwaltung von Volleyball-Teams mit fortschrittlicher Spielerentwicklung und Jugendintegration.

[![Version](https://img.shields.io/badge/version-1.9.2-blue.svg)](https://github.com/yourusername/volleyball-app)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-Production-success.svg)](#)

## Über das Projekt

Diese Progressive Web App wurde entwickelt, um die Zusammenarbeit innerhalb einer Volleyballabteilung zu stärken. Sie unterstützt Trainer bei der Trainingsplanung und im Teammanagement und erleichtert Jugendspielern den nahtlosen Übergang in höhere Mannschaften.

Die Plattform vernetzt alle Teams der Abteilung miteinander, ermöglicht die Koordination von Trainingsgästen und bietet ein umfassendes Spielerbewertungssystem mit deutschen Vereinsliga-Standards.

**🏐 Live-Anwendung:** Produktiv im Einsatz (URL auf Anfrage verfügbar)

## 🚀 Hauptfunktionen

### 👨‍🏫 Für Trainer
- **Event-Management**: Trainings und Spiele planen mit wiederkehrenden Terminen
- **Erweiterte Spielerbewertung**: 1-99 Bewertungssystem mit deutschen Liga-Stufen (Kreisliga bis Bundesliga)
- **Sub-Attribut System**: Detaillierte Bewertung von 8 Kernattributen mit positionsspezifischen Gewichtungen
- **Trainingspool-System**: Elite-Trainingspools basierend auf Spielerleistung und Anwesenheit
- **Fortschrittsanalyse**: Umfassende Zeitreihendiagramme und Meilenstein-Tracking
- **Quick-Feedback**: Schnelle Nachbewertung nach Trainings/Spielen
- **Team-Vergleiche**: Anonyme Perzentil-Rankings innerhalb des Teams
- **Achievement-System**: 30+ Erfolgs-Badges zur Spielermotivation

### 👥 Für Spieler
- **Selbstbewertung**: Saisonale Spielerselbsteinschätzung mit Liga-Konttext
- **Entwicklungsplanung**: Fokusbereich-Auswahl für 6-Wochen-Trainingsziele
- **Fortschritts-Dashboard**: Persönliche Leistungsentwicklung visualisieren
- **Team-Einblicke**: Anonyme Position im Team ohne Preisgabe individueller Daten
- **Event-Teilnahme**: Zu- und Absagen für Trainings und Spiele
- **Push-Benachrichtigungen**: Automatische Event-Erinnerungen

### 🏐 Für Jugendspieler
- **Nahtlose Integration**: Progressiver Übergang in Erwachsenenteams
- **Trainingspool-Zugang**: Teilnahme an höheren Trainingsgruppen
- **Entwicklungspfad**: Klar definierte Aufstiegsrouten durch Liga-System

## 🛠️ Technologie-Stack

### Frontend (React 18.2.0)
- **UI Framework**: Material-UI 5.15.14 mit deutschem Design
- **State Management**: React Context API + TanStack React Query 5.83.0
- **Routing**: React Router DOM 6.14.2
- **Charts**: Recharts 3.1.2 für Fortschrittsvisualisierung
- **PWA**: Workbox 7.0.0 für Offline-Funktionalität
- **Date Handling**: date-fns 2.25.0
- **HTTP Client**: axios 1.4.0

### Backend (Node.js 18.17.0)
- **Framework**: Express 4.18.2
- **Database**: MongoDB mit Mongoose 7.5.0
- **Authentication**: JWT (jsonwebtoken 9.0.1)
- **Security**: bcryptjs 2.4.3 für Passwort-Hashing
- **Email**: nodemailer 6.9.8 mit Brevo-Integration
- **Push Notifications**: web-push 3.6.7
- **CORS**: cors 2.8.5
- **Logging**: morgan 1.10.0

### Deployment & Infrastructure
- **Platform**: Render.com (Frankfurt Region)
- **Database**: MongoDB Atlas
- **Frontend**: Produktions-URL (privat)
- **Backend**: API-URL (privat)
- **CI/CD**: Automatische Deployment über Git-Integration

## 📊 Erweiterte Features

### Spielerbewertungssystem (VB-15)
- 1-99 Bewertungsskala mit 8 Kernattributen
- Positionsspezifische Gewichtungen (Zuspieler, Außen, Mitte, Dia, Libero)
- Automatische Gesamtbewertungsberechnung
- Sub-Attribut-System für detaillierte Analyse
- Deutsche Liga-Integration (Kreisliga bis Bundesliga)

### Trainingspool-System (VB-24)
- Elite-Pools basierend auf Bewertung und 75% Anwesenheit
- Liga-basierte Pool-Struktur für teamübergreifendes Training
- MVP-Voting mit Bonuspunkten
- Automatische Event-Einladungen

### Fortschritts-Tracking (VB-19)
- Interaktive Zeitreilendiagramme für alle Attribute
- Meilenstein-Erkennung (70+, 80+, 90+ Schwellenwerte)
- Trend-Analyse (verbessernd/stabil/abnehmend)
- Datumsbereich-Filter (1M/3M/6M/1J/Gesamt)

### Datenanalyse (VB-18)
- Anonyme Perzentil-Rankings im Team
- Radar-Chart-Visualisierungen
- Stärken/Schwächen-Identifikation
- Datenschutz mit Opt-out-Funktionalität

## 📱 Progressive Web App Features

- **Offline-Funktionalität**: Service Worker für Offline-Nutzung
- **App-Installation**: Installierbar auf mobilen Geräten
- **Push-Benachrichtigungen**: Event-Erinnerungen und Team-Updates
- **Responsive Design**: Optimiert für alle Bildschirmgrößen
- **Schnelles Laden**: Optimierte Performance mit Caching

## 🗂️ Projektstruktur

```
volleyball-app/
├── client/                    # React Frontend (PWA)
│   ├── public/               # Statische Dateien & PWA Manifest
│   └── src/
│       ├── components/       # UI-Komponenten (45+ Komponenten)
│       ├── context/          # React Context für State Management
│       ├── pages/           # Seiten-Komponenten (35+ Seiten)
│       ├── hooks/           # Custom React Hooks
│       └── utils/           # Hilfsfunktionen & Utilities
├── server/                   # Node.js/Express Backend
│   ├── controllers/         # API-Controller
│   ├── models/             # Mongoose-Modelle (9 Datenmodelle)
│   ├── routes/             # API-Routen (12 Route-Sets)
│   ├── services/           # Business Logic Services
│   ├── utils/              # Backend-Utilities & Jobs
│   └── middleware/         # Express-Middleware
├── unimportant/            # Sekundäre Dokumentation & Scripts
├── CLAUDE.md              # Entwicklungsanweisungen
├── project-status.json    # Projektstatistik & Fortschritt
└── render.yaml           # Deployment-Konfiguration
```

## 🔧 Entwicklung & Testing

### ⚠️ Wichtiger Hinweis zu lokaler Entwicklung
**Lokale Entwicklung wurde längere Zeit nicht getestet und kann Probleme verursachen.** Für das Testen der Anwendung empfehlen wir **dringend die Verwendung eines Self-Hosting-Services** wie Render.com, Railway, oder Vercel.

### 🚀 Empfohlener Ansatz: Self-Hosting für Tests

#### Option 1: Render.com (Empfohlen)
1. **Fork das Repository** auf GitHub
2. **Erstelle ein Render.com Account** (kostenlos)
3. **Backend Service erstellen:**
   - "New" → "Web Service"
   - Verbinde dein geforktes Repository
   - Root Directory: `server`
   - Build Command: `npm ci`
   - Start Command: `npm start`
4. **Frontend Service erstellen:**
   - "New" → "Static Site"
   - Root Directory: `client`
   - Build Command: `npm ci && npm run build`
   - Publish Directory: `build`
5. **Umgebungsvariablen konfigurieren** (siehe .env.example)
6. **MongoDB Atlas** für die Datenbank einrichten

#### Option 2: Railway.app
```bash
# Railway CLI installieren
npm install -g @railway/cli

# Repository klonen und deployen
git clone https://github.com/yourusername/volleyball-app.git
cd volleyball-app
railway login
railway init
railway up
```

#### Option 3: Vercel (nur für Demos)
```bash
# Vercel CLI installieren
npm i -g vercel

# Frontend deployen
cd client
vercel

# Backend separat auf Vercel oder anderen Service deployen
```

### 🛠️ Lokale Entwicklung (Experimentell)

**⚠️ Warnung:** Diese Schritte sind ungetestet und können Fehler verursachen.

#### Voraussetzungen
- Node.js 18.17.0 LTS
- MongoDB (lokal oder Atlas)
- Git

#### Installation
1. **Repository klonen**
```bash
git clone https://github.com/yourusername/volleyball-app.git
cd volleyball-app
```

2. **Abhängigkeiten installieren**
```bash
# Root dependencies
npm install

# Backend dependencies
cd server
npm ci

# Frontend dependencies  
cd ../client
npm ci
```

3. **Umgebungsvariablen konfigurieren**
Kopiere `.env.example` zu `.env` und passe die Werte an:
```bash
# Backend (.env in root oder server/.env)
cp .env.example .env
# Bearbeite die .env-Datei mit deinen Werten

# Frontend (client/.env)
echo "REACT_APP_API_URL=http://localhost:5000/api" > client/.env
```

4. **MongoDB Setup**
- Lokale MongoDB-Installation ODER
- MongoDB Atlas Account erstellen

5. **Entwicklungsserver starten**
```bash
# Backend (Terminal 1)
cd server
npm run dev

# Frontend (Terminal 2) 
cd client
npm start
```

#### Bekannte lokale Entwicklungsprobleme
- Veraltete Dependencies können Konflikte verursachen
- Push-Notifications funktionieren nur mit HTTPS
- Email-Service benötigt externe Konfiguration
- PWA-Features sind eingeschränkt
- Mögliche CORS-Probleme bei verschiedenen Ports

### 🧪 Test-Environment (Bereitgestellt)
**Für schnelle Tests ohne eigenes Setup:**
- **Test-URLs**: Auf Anfrage verfügbar
- **Test-Zugangsdaten**: Auf Anfrage verfügbar

## 📊 Projektstatistiken

- **Entwicklungsphase**: Production (99% Fertigstellung)
- **Gesamte Dateien**: 142 (124 JavaScript, 8 Markdown, 10 Konfiguration)
- **Codezeilen**: 43.500+ (32.354 Frontend, 11.146 Backend)
- **React-Komponenten**: 45+
- **Seiten**: 35+
- **API-Endpoints**: 75+
- **Datenmodelle**: 9

## 👥 Benutzerrollen

1. **Trainer**: Vollzugriff auf alle Teams, Event-Management, Spielerbewertungen
2. **Spieler**: Event-Teilnahme, Selbstbewertung, Fortschritts-Dashboard  
3. **Jugendspieler**: Wie Spieler, aber mit spezieller Integration für U20-Übergang

## 🔐 Sicherheitsfeatures

- JWT-basierte Authentifizierung
- Rollenbasierte Zugriffskontrolle
- Passwort-Hashing mit bcryptjs
- CORS-Konfiguration
- Input-Validierung
- Sichere Passwort-Reset-Funktionalität

## 🚀 Deployment

Das Projekt ist für Render.com konfiguriert mit automatischem Deployment:

- **Frontend**: Automatische Builds bei Git-Push
- **Backend**: Express-Server mit MongoDB Atlas
- **Environment**: Produktionsoptimierte Konfiguration
- **Monitoring**: Basis-Logging verfügbar

## 📄 Dokumentation

- **Entwicklung**: `CLAUDE.md` - Comprehensive development guide
- **Projekt-Status**: `project-status.json` - Detailed project analytics
- **Feature-Docs**: Siehe `unimportant/` für spezifische Feature-Dokumentation

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne eine Pull Request

## 📝 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) für Details.

## 📧 Kontakt

**Entwickler**: Moritz Klement  
**Email**: moritz.klement@fau.de  
**Projekt**: [https://github.com/yourusername/volleyball-app](https://github.com/yourusername/volleyball-app)

---

**Hinweis**: Dies ist eine Produktionsanwendung mit aktiven Nutzern. Bitte teste Änderungen gründlich vor dem Deployment.