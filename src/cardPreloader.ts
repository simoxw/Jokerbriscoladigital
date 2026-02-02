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
 */
export const preloadAllCards = (): Promise<void> => {
  if (preloadComplete) return Promise.resolve();
  if (isPreloading && preloadPromise) return preloadPromise;

  isPreloading = true;
  
  // Recupera automaticamente "/" in locale e "/Jokerbriscoladigital/" online
  const baseUrl = import.meta.env.BASE_URL;

  preloadPromise = new Promise((resolve) => {
    const maxCards = 10; // 1.png → 10.png
    const totalImages = SUITS.length * maxCards;
    let processedCount = 0;
    let errorCount = 0;

    console.log(`🃏 Precaricamento avviato su: ${baseUrl}`);

    const checkComplete = () => {
      if (processedCount === totalImages) {
        preloadComplete = true;
        isPreloading = false;
        console.log(`✅ Precaricamento completato (${errorCount} errori)`);
        resolve();
      }
    };

    SUITS.forEach(suit => {
      for (let i = 1; i <= maxCards; i++) {
        const img = new Image();
        // COSTRUZIONE PERCORSO DINAMICO
        const src = `${baseUrl}assets/cards/${suit}/${i}.png`;
        img.src = src;

        img.decode()
          .then(() => {
            processedCount++;
            checkComplete();
          })
          .catch((err) => {
            console.warn(`⚠️ Errore decode su ${src}, provando onload`, err);
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

export const isPreloadComplete = (): boolean => preloadComplete;