# Joker Briscola - Technical Updates Summary

Questo documento riassume le principali funzioni e le modifiche architettoniche apportate per migliorare l'esperienza mobile e il feedback utente. Utile per analisi future e manutenzione.

## 1. Architettura Mobile & Layout
- **File**: `index.html`, `src/App.tsx`
- **Dynamic Viewport Height (--vh)**: Implementato un fix Javascript in `index.html` che calcola `window.innerHeight` e lo assegna alla variabile CSS `--vh`. Questo evita i "salti" del layout su Chrome/Safari mobile quando compaiono le barre di navigazione.
- **App-Like Units**: Il contenitore principale usa `height: calc(var(--vh, 1vh) * 100)` per garantire la copertura perfetta dello schermo.
- **Adaptive Layout**: Ridotte le altezze di `StatusPanel` e `IAIndicator` per massimizzare lo spazio verticale. Rimosso `overflow-hidden` dal contenitore del tavolo per permettere alle carte di sovrapporsi elegantemente alla barra di stato (effetto glassmorphism).
- **Overflow Control**: Impostato `overflow: hidden` sul body per eliminare lo scroll elastico, forzando un'esperienza simile a un'app nativa.

## 2. Sistema di Feedback (Audio & Vibrazione)
- **File**: `src/utils/audio.ts`, `src/App.tsx`
- **AudioManager**: Gestisce centralmente suoni e vibrazione.
- **Haptics (Vibrazione)**: Utilizza `navigator.vibrate()`. La funzione è integrata in:
    - `handleLocalCardPlayed`: Giocata locale.
    - `remote_play` / `ai_remote_play`: Giocate altrui riceve via socket.
    - `useEffect` per cambio turno: Trigger quando `turnIndex === myOnlineIndex`.
- **Persistenza**: Gli stati `isMuted` e `isVibrationEnabled` sono salvati in `localStorage` (`joker_is_muted`, `joker_is_vibration_enabled`).

## 3. UI Dinamica & Card Scaling
- **File**: `src/components/GameTable.tsx`
- **Scaling Proporzionale**: Le carte nella mano usano `width: clamp(70px, 28vw, 110px)`. Le carte sul tavolo usano `width: clamp(85px, 28vw, 110px)`. Questo permette agli elementi di rimpicciolirsi automaticamente su schermi stretti per prevenire sovrapposizioni, mantenendo la massima visibilità possibile.
- **Z-Index & Clipping Fix**: Rimosso `overflow-hidden` dall'area della mano e aggiunto `hover:z-50` alle carte per garantire che, quando vengono selzionate/zoomate, appaiano sopra il tavolo e non vengano tagliate.
- **Deck Relocation**: Spostato il contatore del mazzo dal centro del tavolo alla parte alta-centrale per liberare l'area di gioco principale e migliorare la leggibilità.
- **UI Tweaks**: Alzato il pulsante "RACCOGLI" di 15px per non sovrapporsi alle carte giocate e spostata la corona della vittoria a fianco dei nomi dei giocatori.
- **Safe Area Support**: Utilizzato `pb-[env(safe-area-inset-bottom)]` nella Hand Area per evitare che gli indicatori di sistema (barra home di iOS/Android) coprano le carte.

## 4. Animazioni CSS
- **File**: `index.html` (Styles)
- **card-pop**: Effetto "salto" per le carte giocate sul tavolo.
- **card-draw**: Effetto "scivolamento" dal mazzo alla mano.
- **turn-glow**: Bagliore pulsante sulle carte del giocatore attivo.

## 5. Stato di Gioco (Online/Offline)
- **File**: `src/App.tsx`
- **matchState**: Stato globale che contiene la logica del mazzo, punteggi e fasi.
- **socket.io**: Gestisce la sincronizzazione real-time. Funzioni chiave: `sync_game_state`, `remote_play`, `ai_remote_play`.
