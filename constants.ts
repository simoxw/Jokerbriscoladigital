
import { Suit, Card } from './types';

export const SUITS: Suit[] = ['foglia', 'onda', 'roccia', 'stella'];

export const RANK_VALUES: Record<number, number> = {
  1: 11, // Asso
  3: 10, // Tre
  10: 4, // Re
  9: 3,  // Cavallo
  8: 2,  // Fante
  7: 0, 6: 0, 5: 0, 4: 0, 2: 0
};

export const RANK_LABELS: Record<number, string> = {
  1: 'Asso', 2: 'Due', 3: 'Tre', 4: 'Quattro', 5: 'Cinque',
  6: 'Sei', 7: 'Sette', 8: 'Fante', 9: 'Cavallo', 10: 'Re'
};

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    for (let rank = 1; rank <= 10; rank++) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        value: RANK_VALUES[rank],
        label: RANK_LABELS[rank]
      });
    }
  });
  
  // Rimuovi un 2 a caso
  const twosIndices = deck.map((c, i) => c.rank === 2 ? i : -1).filter(i => i !== -1);
  const toRemove = twosIndices[Math.floor(Math.random() * twosIndices.length)];
  deck.splice(toRemove, 1);

  // Algoritmo di Fisher-Yates per mescolare il mazzo
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

export const ASSET_MAPPING = {
  foglia: 'Bastoni',
  onda: 'Coppe',
  roccia: 'Spade',
  stella: 'Denari'
};

// Added missing helper to get suit icons
export const getSuitIcon = (suit: Suit): string => {
  switch (suit) {
    case 'foglia': return '🌿';
    case 'onda': return '🌊';
    case 'roccia': return '⛰️';
    case 'stella': return '⭐';
    default: return '';
  }
};

// Added missing helper to get suit colors for Tailwind
export const getSuitColor = (suit: Suit): string => {
  switch (suit) {
    case 'foglia': return 'text-green-600';
    case 'onda': return 'text-blue-600';
    case 'roccia': return 'text-slate-600';
    case 'stella': return 'text-amber-600';
    default: return 'text-slate-900';
  }
};
