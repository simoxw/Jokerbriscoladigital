# Joker Briscola - Technical Updates Summary

Questo documento riassume le principali funzioni e le modifiche architettoniche apportate per migliorare l'esperienza mobile e il feedback utente. Utile per analisi future e manutenzione.

## 1. Architettura Mobile-Mirror & Container Queries
- **File**: `src/App.tsx`, tutti i componenti.
- **Container Queries (cqw)**: Il layout è migrato da `vmin` a `cqw` (Container Query Width). Il contenitore principale (`game-container`) è definito con `container-type: inline-size`. Tutte le dimensioni (carte, bottoni, font, spaziature) scalano ora in base alla larghezza del contenitore, non del viewport.
- **Real-Mobile Desktop View**: Su desktop, l'app è racchiusa in un contenitore di **420px** (`max-w-[420px]`), emulando perfettamente le proporzioni di uno smartphone moderno (iPhone Pro Max style).
- **Z-Index Layering**: Gli indicatori IA sono stati impostati a `z-10` e il tavolo di gioco a `z-50` (con `overflow-visible`) per garantire che le carte giocate passino sempre sopra gli indicatori durante le animazioni.

## 2. Sistema di Feedback (Audio & Vibrazione)
- **File**: `src/utils/audio.ts`, `src/App.tsx`
- **AudioManager**: Gestisce centralmente suoni e vibrazione.
- **Haptics (Vibrazione)**: Utilizza `navigator.vibrate()`. La funzione è integrata in:
    - `handleLocalCardPlayed`: Giocata locale.
    - `remote_play` / `ai_remote_play`: Giocate altrui riceve via socket.
    - `useEffect` per cambio turno: Trigger quando `turnIndex === myOnlineIndex`.
- **Persistenza**: Gli stati `isMuted` e `isVibrationEnabled` sono salvati in `localStorage` (`joker_is_muted`, `joker_is_vibration_enabled`).

## 3. UI Dinamica & Card Scaling (CQW Migration)
- **File**: `src/components/GameTable.tsx`, `App.tsx` (CSS Variables)
- **Responsive Variables**: Utilizzo di variabili CSS centralizzate in `App.tsx` come `--card-w-table: 29cqw`, `--card-w-hand: 26cqw`.
- **Triple Profiling (Media Queries)**:
    - **Small Mobile (< 480px)**: Layout standard originale per massima leggibilità.
    - **Large Mobile (480px - 767px)**: Carte tavolo e briscola ingrandite del 15% per sfruttare lo spazio dei phablet.
    - **Desktop/Tablet (> 768px)**: Scaling compatto con container fisso a 420px per un look professionale ed elegante.

## 4. Animazioni CSS
- **File**: `index.html` (Styles)
- **card-pop**: Effetto "salto" per le carte giocate sul tavolo.
- **card-draw**: Effetto "scivolamento" dal mazzo alla mano.
- **turn-glow**: Bagliore pulsante sulle carte del giocatore attivo.

## 5. Stato di Gioco (Online/Offline)
- **File**: `src/App.tsx`
- **matchState**: Stato globale che contiene la logica del mazzo, punteggi e fasi.
- **socket.io**: Gestisce la sincronizzazione real-time. Funzioni chiave: `sync_game_state`, `remote_play`, `ai_remote_play`.

## 6. Sincronizzazione Messaggi & Stato Online
- **File**: `src/App.tsx`, `src/types.ts`
- **Message Syncing**: Aggiunto il campo `message` all'interfaccia `MatchState`. L'host ora invia non solo lo stato dei punti e delle carte, ma anche il testo del messaggio corrente (es. "Presa: Nome (+13)").
- **Socket Relay**: Utilizzo di `update_game_state` (Host) -> `sync_game_state` (Client) per una coerenza millimetrica delle comunicazioni di gioco su tutti i dispositivi collegati.

## 7. Ottimizzazione Barra di Stato (Collisione Briscola)
- **File**: `src/App.tsx`
- **Horizontal Compression**: La barra di stato che contiene gli indicatori IA e il messaggio di sistema è stata rimpicciolita orizzontalmente.
- **Collision Avoidance**: Aggiunto un padding destro di `120px` per garantire che l'indicatore IA2 non finisca mai sotto la carta Briscola (che è posizionata assolutamente in alto a destra).
- **Centered Layout**: Cambiato l'allineamento da `justify-between` a `justify-center` con un gap controllato per mantenere gli elementi vicini e leggibili al centro del tavolo.

## 8. Ottimizzazioni Desktop Premium
- **Constraint-Based Layout**: Rimossi tutti i prefissi `lg:` e le posizioni `fixed`. L'interfaccia è ora una colonna unica e coerente che si adatta elasticamente al contenitore centrale.
## 9. Ancoraggio Messaggi & Isolamento Scaling
- **File**: `src/components/GameTable.tsx`
- **Ancoraggio a Metà Carta**: I messaggi di stato ("Presa", "Turno") sono stati ancorati direttamente al contenitore della carta giocata (`TU`) utilizzando un wrapper relativo.
- **Isolamento Scaling**: I messaggi sono posizionati come fratelli della carta, non figli. Questo impedisce che ereditino l'effetto `scale-110` della vittoria, rimanendo leggibili e di dimensione costante mentre la carta si ingrandisce.
- **Offset Orizzontale**: Applicato un offset di `+15px` verso destra rispetto alla carta per un bilanciamento visivo ottimale.

## 10. Regolazione Millimetrica Mazzo & Seme
- **File**: `src/App.tsx`
- **Posizionamento Deck**: Il mazzo è stato abbassato di **17px** rispetto al centro teorico per evitare sovrapposizioni con l'indicatore del seme.
- **Indicatore Seme**: Alzato di **3px** per massimizzare la separazione visiva senza toccare il bordo superiore del tavolo.

## 11. PWA & UX Mobile Avanzata
- **File**: `index.html`, `src/main.tsx`, `public/sw.js`
- **Configurazione PWA**: 
    - Ottimizzato `manifest.json` e `index.html` con path relativi (`./`) per compatibilità con sottocartelle GitHub Pages (`/Jokerbriscoladigital/`).
    - Aggiunto supporto completo `apple-touch-icon` e metatag Android.
- **Protezioni UX**:
    - **Blocco Zoom**: Disabilitato tramite `viewport` per un feeling da app nativa.
    - **Gestione Notch**: Implementata tramite `padding: env(safe-area-inset-...)`.
    - **Blocco Menu**: Disabilitato `contextmenu` (tasto destro/lungo tocco) e `dragstart` (trascinamento immagini) direttamente in `index.html` per una protezione immediata.
- **Service Worker (v8.1)**: Implementata strategia *Cache-First* per le immagini delle carte e *Stale-While-Revalidate* per il codice, garantendo velocità e giocabilità offline.
