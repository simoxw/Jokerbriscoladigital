
// ===============================
// PRELOAD AUTOMATICO DI TUTTE LE CARTE
// Versione ottimizzata per Mobile (Image.decode())
// ===============================

import { SUITS } from './constants';

let isPreloading = false;
let preloadComplete = false;
let preloadPromise: Promise<void> | null = null;

/**
 * Precarica tutte le immagini delle carte forzando la decodifica.
 * Usa img.decode() per evitare scatti (jank) al primo rendering su mobile.
 * @returns Promise che si risolve quando tutte le carte sono pronte per la GPU.
 */
export const preloadAllCards = (): Promise<void> => {
  // Se già completato, risolvi immediatamente
  if (preloadComplete) {
    return Promise.resolve();
  }
  
  // Se già in corso, ritorna la promise esistente
  if (isPreloading && preloadPromise) {
    return preloadPromise;
  }

  isPreloading = true;
  
  preloadPromise = new Promise((resolve) => {
    const maxCards = 10; // 1.png → 10.png
    const totalImages = SUITS.length * maxCards;
    let processedCount = 0;
    let errorCount = 0;

    console.log(`🃏 Inizio precaricamento ottimizzato (decode) di ${totalImages} carte...`);
    const startTime = performance.now();

    const checkComplete = () => {
      if (processedCount === totalImages) {
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`✅ Precaricamento & Decodifica completati in ${duration}s`);
        
        if (errorCount > 0) {
          console.warn(`   ⚠️ Errori: ${errorCount} immagini non caricate correttamente`);
        } else {
          console.log(`   Tutte le immagini sono pronte in memoria GPU.`);
        }
        
        preloadComplete = true;
        isPreloading = false;
        resolve();
      }
    };

    SUITS.forEach(suit => {
      for (let i = 1; i <= maxCards; i++) {
        const img = new Image();
        const src = `/assets/cards/${suit}/${i}.png`;
        img.src = src;

        // .decode() è la chiave per le prestazioni mobile.
        // Scarica E decodifica l'immagine in un thread separato.
        img.decode()
          .then(() => {
            processedCount++;
            checkComplete();
          })
          .catch((err) => {
            // Fallback per browser vecchi o errori di rete
            console.warn(`⚠️ Errore decode su ${src}, fallback su onload`, err);
            // Proviamo a considerarla comunque caricata se l'evento load scatta
            if (img.complete) {
                processedCount++;
                checkComplete();
            } else {
                img.onload = () => {
                    processedCount++;
                    checkComplete();
                };
                img.onerror = () => {
                    errorCount++;
                    processedCount++;
                    checkComplete();
                };
            }
          });
      }
    });
  });

  return preloadPromise;
};

/**
 * Controlla se il precaricamento è completato
 */
export const isPreloadComplete = (): boolean => {
  return preloadComplete;
};

/**
 * Resetta lo stato del precaricamento (utile per testing)
 */
export const resetPreload = (): void => {
  isPreloading = false;
  preloadComplete = false;
  preloadPromise = null;
};
