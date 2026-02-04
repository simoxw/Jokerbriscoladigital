# 🃏 Joker Briscola Multiplayer

Un gioco di Briscola digitale moderno, fluido e ottimizzato per mobile, con supporto per il gioco **Offline** (contro IA) e **Online** (Multiplayer in tempo reale tramite Socket.io).

https://simoxw.github.io/Jokerbriscoladigital/

## 🚀 Caratteristiche
- **Grafica Avanzata**: Effetti visivi curati, animazioni fluide e design responsive.
- **Ottimizzazione Immagini (WebP)**: Tutte le carte sono in formato WebP, riducendo il peso del 90% per un caricamento fulmineo su mobile.
- **Super Cache (Service Worker)**: Caching aggressivo degli asset per gioco istantaneo e supporto offline parziale.
- **Effetti Sonori Reali**: Audio integrato per giocata e pesca carte con gestione intelligente del Silenzioso (Mute).
- **Supporto PWA (App)**: Installabile su smartphone come una vera applicazione con icona personalizzata.
- **Distinzione Visiva Joker**: Nuovo tema colore Viola/Fucsia per il Joker per distinguerlo chiaramente dall'Oro.
- **Multiplayer Online**: Connessione dinamica tra locale e server remoto (Render).

---

## 💻 Installazione e Test in Locale

Per testare il progetto sul tuo computer, segui questi passaggi. Il progetto utilizza Vite per il frontend e Node.js per il backend multiplayer.

### Prerequisiti
- [Node.js](https://nodejs.org/) (versione 16 o superiore)
- npm (incluso con Node.js)

### 1. Clona o Scarica il Progetto
```bash
git clone https://github.com/tuo-username/Jokerbriscoladigital.git
cd Jokerbriscoladigital
```

### 2. Installazione Dipendenze
```bash
npm install
```

### 3. Modifiche Necessarie per lo Sviluppo Locale
**Importante**: Se hai scaricato il progetto da GitHub come ZIP o clone, potrebbe contenere file di build di produzione che interferiscono con la modalità sviluppo. Apporta queste modifiche:

- **Modifica `index.html`**: Cambia la riga dello script da:
  ```html
  <script type="module" crossorigin src="/Jokerbriscoladigital/assets/index-XXXXXX.js"></script>
  ```
  a:
  ```html
  <script type="module" src="/src/main.tsx"></script>
  ```

- **Rimuovi la cartella `assets/`**: Questa cartella contiene file di build di produzione. Cancellala completamente (non toccare `public/assets/` che contiene le immagini reali).

### 4. Avvio in Modalità Sviluppo
Avvia il comando che avvia automaticamente sia il frontend che il backend:
```bash
npm run dev
```

Questo comando:
- Installa automaticamente le dipendenze se necessario (al primo avvio).
- Avvia il server backend su porta 3000.
- Avvia il server frontend Vite su porta 5173.

Apri il browser e vai a: `http://localhost:5173/Jokerbriscoladigital/`

### 5. Test del Funzionamento
- Verifica che la pagina si carichi senza errori nella console del browser.
- Prova la modalità Offline contro l'IA.
- Per testare il multiplayer: Apri due schede del browser e crea una stanza in una, unisciti dall'altra.

### Comandi Alternativi
- **Solo Backend**: `npm start` o `node server.js` (porta 3000)
- **Solo Frontend**: `npx vite` (porta 5173)
- **Build per Produzione**: `npm run build` (genera la cartella `dist/`)

---

## 🌐 Pubblicazione Online (Deployment)

Il progetto è strutturato per essere ospitato in modo ibrido su GitHub Pages (frontend) e un servizio cloud (backend).

### Frontend (GitHub Pages)
1. Esegui `npm run build` per generare i file di produzione.
2. I file buildati saranno nella cartella `dist/`.
3. Carica il contenuto di `dist/` su GitHub e attiva Pages dalle impostazioni della repo, puntando alla cartella `/root` (o `/docs` se preferisci).
4. Nota: Il `base` in `vite.config.ts` è impostato su `/Jokerbriscoladigital/` per corrispondere al nome del repo.

### Backend (Render / Railway / Heroku)
1. Carica il file `server.js` su un servizio di hosting Node.js (es. Render.com, Railway.app).
2. Assicurati che il servizio supporti Socket.io.
3. Aggiorna l'URL del socket in `src/App.tsx` con l'indirizzo fornito dal provider (sostituisci `localhost:3000`).

### Configurazioni Importanti
- **CORS**: Nel file `server.js`, la policy CORS è impostata su `*` per lo sviluppo. Per la produzione, limita agli URL autorizzati.
- **Variabili d'Ambiente**: Per deployment, usa variabili d'ambiente per URL e porte.

---

## 📂 Struttura del Progetto
```
/
├── public/                 # File statici (immagini, suoni)
│   └── assets/
│       ├── cards/          # Immagini delle carte
│       └── sounds/         # Effetti sonori
├── src/                    # Codice sorgente React/TypeScript
│   ├── components/         # Moduli: GameTable, GameDialogs, IAIndicator,
│   │                       # ItalianCard, MainMenu, OnlineMenu, Rules,
│   │                       # ScoreBoard, StatusPanel, DifficultyPanel, HistoryPanel
│   ├── ai.ts               # Logica IA per modalità offline
│   ├── App.tsx             # Stato globale e gestione Socket
│   ├── main.tsx            # Entry point e Service Worker
│   ├── cardPreloader.ts    # Ottimizzazione asset WebP
│   └── types.ts            # Definizioni TypeScript
├── server.js               # Server Node.js per multiplayer
├── dev-runner.js           # Script per avvio sviluppo
├── vite.config.ts          # Configurazione Vite
├── package.json            # Dipendenze e script
└── index.html              # Template HTML
```

### File Chiave
- `App.tsx`: Cuore dell'applicazione, gestisce la comunicazione Socket.io e lo stato del match.
- `GameTable.tsx`: Gestisce la disposizione dei giocatori e le carte sul tavolo.
- `GameDialogs.tsx`: Gestisce pop-up, fine partita e interazioni di sistema.
- `ai.ts`: Algoritmi per il comportamento dei giocatori IA.

---

## 🛠️ Tecnologie Utilizzate
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Socket.io
- **Optimizzazione**: Service Workers (PWA), WebP Images
- **Styling**: Tailwind CSS con font Google Fonts (Cinzel, Inter)

---

## 📝 Note per lo Sviluppo
- **Hot Reload**: Vite supporta hot reload automatico per modifiche ai file `.tsx`.
- **Build**: Ogni modifica al codice richiede `npm run build` per aggiornare la versione su GitHub Pages.
- **Debug**: Usa gli strumenti del browser per debug frontend; per backend, controlla i log del server.
- **Mobile**: Testa sempre su dispositivi mobili reali o emulatori, dato che il gioco è ottimizzato per mobile.
- **Contributi**: Sentiti libero di aprire issue o PR per miglioramenti!

---

---

## 🚀 Guida al Deployment Online

### 1. Configurazione Render (Backend)
1. Carica il progetto su Render come **Web Service**.
2. **Start Command**: `node server.js`
3. Il server risponderà a `https://jokerbriscoladigital.onrender.com`.

### 2. Configurazione Frontend (GitHub Pages)
Per fare in modo che il sito si colleghi al server giusto su GitHub:
1. Crea un file `.env.production` nella radice del progetto locale.
2. Aggiungi la riga: `VITE_SOCKET_URL=https://jokerbriscoladigital.onrender.com`
3. Esegui `npm run build`.
4. Copia il contenuto di `dist` nel tuo repository GitHub e fai il push.

### 3. Installazione PWA
- Su **Chrome/Android**: Apparirà il pulsante "Installa sul Telefono" nel menu.
- Su **iOS**: Clicca "Condividi" -> "Aggiungi a Home".

---

## 🐛 Troubleshooting
- **Audio non parte**: Molti browser bloccano l'audio finché l'utente non interagisce (cliccando un pulsante).
- **Pulsante Installa non appare**: Assicurati di essere su HTTPS e di aver ricaricato la pagina almeno una volta.
- **Errore Connessione**: Verifica che il server su Render non sia in modalità "sleep" (richiede ~30s per riattivarsi).

Per ulteriori problemi, apri una issue su GitHub.
