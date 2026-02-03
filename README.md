# 🃏 Joker Briscola Multiplayer

Un gioco di Briscola digitale moderno, fluido e ottimizzato per mobile, con supporto per il gioco **Offline** (contro IA) e **Online** (Multiplayer in tempo reale tramite Socket.io).

## 🚀 Caratteristiche
- **Grafica Avanzata**: Effetti visivi curati, animazioni fluide e design responsive.
- **Precaricamento Asset**: Sistema di caching delle immagini per evitare lo schermo nero durante le partite.
- **Intelligenza Artificiale**: Tre livelli di difficoltà per la modalità Offline.
- **Multiplayer Online**: Crea stanze private e gioca con i tuoi amici in tempo reale.
- **Ottimizzazione Mobile**: Interfaccia studiata per essere giocata comodamente da smartphone.

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
│   ├── components/         # Componenti UI (GameTable, ItalianCard, etc.)
│   ├── ai.ts               # Logica IA per modalità offline
│   ├── App.tsx             # Componente principale
│   ├── main.tsx            # Entry point React
│   └── types.ts            # Definizioni TypeScript
├── server.js               # Server Node.js per multiplayer
├── dev-runner.js           # Script per avvio sviluppo
├── vite.config.ts          # Configurazione Vite
├── package.json            # Dipendenze e script
└── index.html              # Template HTML
```

### File Chiave
- `App.tsx`: Gestione stati globali e routing tra modalità.
- `server.js`: Logica server per stanze multiplayer e Socket.io.
- `GameScene.ts`: Logica di gioco principale.
- `cardPreloader.ts`: Caricamento ottimizzato delle immagini.

---

## 🛠️ Tecnologie Utilizzate
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Socket.io
- **Grafica**: Phaser.js per animazioni e rendering
- **Styling**: Tailwind CSS con font Google Fonts (Cinzel, Inter)

---

## 📝 Note per lo Sviluppo
- **Hot Reload**: Vite supporta hot reload automatico per modifiche ai file `.tsx`.
- **Build**: Ogni modifica al codice richiede `npm run build` per aggiornare la versione su GitHub Pages.
- **Debug**: Usa gli strumenti del browser per debug frontend; per backend, controlla i log del server.
- **Mobile**: Testa sempre su dispositivi mobili reali o emulatori, dato che il gioco è ottimizzato per mobile.
- **Contributi**: Sentiti libero di aprire issue o PR per miglioramenti!

---

## 🐛 Troubleshooting
- **Errore "Cannot resolve module"**: Assicurati di aver eseguito `npm install`.
- **Pagina bianca**: Controlla che `index.html` punti a `/src/main.tsx` e che la cartella `assets/` sia stata rimossa.
- **Socket non connesso**: Verifica che il server backend sia attivo su porta 3000.
- **Immagini non caricano**: Assicurati che i file in `public/assets/` esistano e abbiano i percorsi corretti.

Per ulteriori problemi, apri una issue su GitHub.
