# Joker Briscola - Technical Updates Summary

Questo documento riassume le principali funzioni e le modifiche architettoniche apportate per migliorare l'esperienza mobile e il feedback utente. Utile per analisi future e manutenzione.

## 1. Architettura Mobile & Layout
- **File**: `index.html`, `src/App.tsx`
- **Universal Scaling (vh/vmin)**: Il layout non si basa più solo sulla larghezza (`vw`), ma su unità relative all'altezza (`vh`) e alla dimensione minima del viewport (`vmin`). Questo garantisce che su schermi bassi il gioco si comprima proporzionalmente.
- **Flex-Shrink Architecture**: Tutti i componenti (Header, ScoreBoards, Tavolo) hanno il permesso di rimpicciolirsi (`min-h-0`, `flex-shrink`) per lasciare spazio alla mano del giocatore.
- **Scroll Fallback**: Aggiunto `overflow-y-auto` sul contenitore principale per garantire che nulla sia mai "tagliato" fuori dallo schermo su dispositivi piccolissimi.

## 2. Sistema di Feedback (Audio & Vibrazione)
- **File**: `src/utils/audio.ts`, `src/App.tsx`
- **AudioManager**: Gestisce centralmente suoni e vibrazione.
- **Haptics (Vibrazione)**: Utilizza `navigator.vibrate()`. La funzione è integrata in:
    - `handleLocalCardPlayed`: Giocata locale.
    - `remote_play` / `ai_remote_play`: Giocate altrui riceve via socket.
    - `useEffect` per cambio turno: Trigger quando `turnIndex === myOnlineIndex`.
- **Persistenza**: Gli stati `isMuted` e `isVibrationEnabled` sono salvati in `localStorage` (`joker_is_muted`, `joker_is_vibration_enabled`).

## 3. UI Dinamica & Card Scaling
- **Responsive Card Sizes**: Le carte usano ora `vmin` con uno scaling generoso (es. `clamp(80px, 30vmin, 120px)` per il tavolo). Se lo schermo è basso, le carte si rimpiccioliscono automaticamente mantenendo la massima visibilità possibile.
- **Smart Hover Experience**: Implementata media query `@media (hover: hover)` per le carte in mano. Questo previene l'effetto "carta sollevata fissa" su mobile (sticky hover), riservando l'animazione di sollevamento ai soli utenti con mouse/PC.
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
