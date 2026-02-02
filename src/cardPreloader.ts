// ===============================
// PRELOAD AUTOMATICO DI TUTTE LE CARTE
// Versione ottimizzata per React/TypeScript
// ===============================

import { SUITS } from './constants';

let isPreloading = false;
let preloadComplete = false;
let preloadPromise: Promise<void> | null = null;

/**
 * Precarica tutte le immagini delle carte
 * @returns Promise che si risolve quando tutte le carte sono caricate
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
    let loadedCount = 0;
    let errorCount = 0;

    console.log(`🃏 Inizio precaricamento di ${totalImages} carte...`);
    const startTime = performance.now();

    SUITS.forEach(suit => {
      for (let i = 1; i <= maxCards; i++) {
        const img = new Image();
        
        img.onload = () => {
          loadedCount++;
          checkComplete();
        };
        
        img.onerror = () => {
          errorCount++;
          console.warn(`⚠️ Errore caricamento: ${suit}/${i}.png`);
          loadedCount++;
          checkComplete();
        };
        
        img.src = `/assets/cards/${suit}/${i}.png`;
      }
    });

    function checkComplete() {
      if (loadedCount === totalImages) {
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`✅ Precaricamento completato in ${duration}s`);
        console.log(`   Caricate: ${totalImages - errorCount}/${totalImages} carte`);
        
        if (errorCount > 0) {
          console.warn(`   Errori: ${errorCount} immagini non caricate`);
        }
        
        preloadComplete = true;
        isPreloading = false;
        resolve();
      }
    }
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
