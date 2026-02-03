# 🃏 Joker Briscola Multiplayer

Un gioco di Briscola digitale moderno, fluido e ottimizzato per mobile, con supporto per il gioco **Offline** (contro IA) e **Online** (Multiplayer in tempo reale tramite Socket.io).

## 🚀 Caratteristiche
- **Grafica Avanzata**: Effetti visivi curati, animazioni fluide e design responsive.
- **Precaricamento Asset**: Sistema di caching delle immagini per evitare lo schermo nero durante le partite.
- **Intelligenza Artificiale**: Tre livelli di difficoltà per la modalità Offline.
- **Multiplayer Online**: Crea stanze private e gioca con i tuoi amici in tempo reale.
- **Ottimizzazione Mobile**: Interfaccia studiata per essere giocata comodamente da smartphone.

---

## 💻 Installazione in Locale

Per testare il progetto sul tuo computer, segui questi passaggi:

### 1. Prerequisiti
Assicurati di avere installato [Node.js](https://nodejs.org/).

### 2. Installazione dipendenze
Apri il terminale nella cartella del progetto e lancia:
```bash
npm install

3. Avvio in Modalità Sviluppo
Per far funzionare il gioco completo in locale, devi avviare due terminali:
Terminale 1 (Frontend - React/Vite):
npm run dev

Questo aprirà il gioco all'indirizzo http://localhost:5173.
Terminale 2 (Backend - Server Node):
node server.js

Questo attiverà il sistema di messaggistica per il multiplayer.
🌐 Pubblicazione Online (Deployment)
Il progetto è strutturato per essere ospitato in modo ibrido:
Frontend (GitHub Pages):
Esegui npm run build.
Sposta il contenuto della cartella dist nella cartella principale (root).
Fai il push su GitHub.
Attiva GitHub Pages dalle impostazioni della repo puntando alla cartella /root.
Backend (Render / Railway):
Carica il file server.js su un servizio di hosting (es. Render.com).
Assicurati di aggiornare l'URL del socket in App.tsx con l'indirizzo fornito dal provider.
📂 Struttura del Progetto
App.tsx: Cuore dell'applicazione e gestione degli stati.
server.js: Server Node.js per la gestione delle stanze e del multiplayer.
components/: Contiene tutti gli elementi dell'interfaccia (Tavolo, Carte, Score).
cardPreloader.ts: Logica per il caricamento preventivo delle immagini delle carte.
assets/: Immagini, suoni e stili CSS.
🛠️ Tecnologie Utilizzate
React 18 (Vite)
TypeScript
Tailwind CSS (per lo styling)
Socket.io (per la comunicazione real-time)
Node.js & Express (per il backend)
📝 Note per lo Sviluppo
Ogni volta che modifichi i file .tsx, ricorda di rigenerare la build con npm run build se vuoi vedere le modifiche sulla versione pubblicata su GitHub Pages.
Per il corretto funzionamento online, assicurati che la policy CORS nel file server.js includa l'indirizzo della tua pagina GitHub.
