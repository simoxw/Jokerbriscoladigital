
import { MatchState, Card, PlayerData, Suit } from './types';
import { RANK_VALUES } from './constants';

/**
 * Determines the winner of a trick based on Briscola rules.
 */
export const getTrickWinnerIndex = (
  playedCards: { playerId: number; card: Card }[],
  briscolaSuit: Suit,
  leadSuit: Suit
): number => {
  if (playedCards.length === 0) return -1;

  let winnerPlay = playedCards[0];

  for (let i = 1; i < playedCards.length; i++) {
    const currentPlay = playedCards[i];
    const winCard = winnerPlay.card;
    const curCard = currentPlay.card;

    // 1. Current is Briscola, Winner is not -> Current wins
    if (curCard.suit === briscolaSuit && winCard.suit !== briscolaSuit) {
      winnerPlay = currentPlay;
    }
    // 2. Both Briscola or Both Same Suit -> Higher value/rank wins
    else if (curCard.suit === winCard.suit) {
      if (curCard.value > winCard.value) {
        winnerPlay = currentPlay;
      } else if (curCard.value === winCard.value && curCard.rank > winCard.rank) {
        winnerPlay = currentPlay;
      }
    }
    // 3. Current follows Lead Suit, Winner is Off-Suit (and not Briscola) -> Current wins
    // (This case actually merges with case 2 usually, but strictly: if Winner was already Lead Suit,
    // and Current is Lead Suit, handled by 2. If Winner was NOT Lead Suit (and not Briscola), Winner is invalid?
    // In standard logic: The first card sets the lead suit.
    // Any subsequent card of Lead Suit beats any card of Non-Lead/Non-Briscola.)
    else if (curCard.suit === leadSuit && winCard.suit !== briscolaSuit && winCard.suit !== leadSuit) {
      winnerPlay = currentPlay;
    }
  }

  return winnerPlay.playerId;
};

/**
 * Calculates the total points currently on the table.
 */
const getTrickPoints = (playedCards: { card: Card }[]): number => {
  return playedCards.reduce((sum, p) => sum + p.card.value, 0);
};

/**
 * Checks which high ranking cards (A, 3) and Briscolas have been played.
 */
const analyzeHistory = (game: MatchState) => {
  const played = new Set<string>();
  game.history.forEach(trick => {
    trick.plays.forEach(p => played.add(p.card.id));
  });

  // Count how many Briscolas are gone
  let briscolasGone = 0;
  // Count if master cards (Ace/Three of Briscola) are gone
  let briscolaAceGone = false;
  let briscolaThreeGone = false;

  game.history.forEach(trick => {
    trick.plays.forEach(p => {
        if (p.card.suit === game.briscolaSuit) {
            briscolasGone++;
            if (p.card.rank === 1) briscolaAceGone = true;
            if (p.card.rank === 3) briscolaThreeGone = true;
        }
    });
  });

  return { briscolasGone, briscolaAceGone, briscolaThreeGone };
};

/**
 * MAIN AI FUNCTION
 */
export const calculateBestMove = (game: MatchState, myPlayerId: number): Card => {
  const me = game.players.find(p => p.id === myPlayerId)!;
  const legalMoves = me.hand; // In Briscola, all cards are legal to play
  
  // 1. If Difficulty is BASE, play random valid or simple high-card logic
  if (game.difficulty === 'BASE') {
    return calculateBaseMove(game, me, legalMoves);
  }

  // 2. ESPERTO (Expert) Logic
  return calculateExpertMove(game, me, legalMoves);
};

const calculateBaseMove = (game: MatchState, me: PlayerData, legalMoves: Card[]): Card => {
   const { playedCards, briscolaSuit, leadSuit } = game;
   
   // If leading, try not to play Briscola unless it's the only choice or have many
   if (playedCards.length === 0) {
      const nonBriscola = legalMoves.filter(c => c.suit !== briscolaSuit);
      if (nonBriscola.length > 0) {
        // Play lowest value non-briscola
        return nonBriscola.sort((a,b) => a.value - b.value || a.rank - b.rank)[0];
      }
      // Play lowest briscola
      return legalMoves.sort((a,b) => a.value - b.value || a.rank - b.rank)[0];
   }

   // If following, try to win if points > 0
   const currentPoints = getTrickPoints(playedCards);
   const winningMoves = legalMoves.filter(card => {
        const simCards = [...playedCards, { playerId: me.id, card }];
        return getTrickWinnerIndex(simCards, briscolaSuit!, leadSuit!) === me.id;
   });

   if (winningMoves.length > 0 && currentPoints > 0) {
      // Win with the lowest possible winning card to save resources
      // Prefer non-briscola wins first
      const nonBriscolaWins = winningMoves.filter(c => c.suit !== briscolaSuit);
      if (nonBriscolaWins.length > 0) {
          return nonBriscolaWins.sort((a,b) => a.value - b.value)[0];
      }
      return winningMoves.sort((a,b) => a.value - b.value)[0];
   }

   // Otherwise, dump lowest card
   return legalMoves.sort((a,b) => a.value - b.value || a.rank - b.rank)[0];
};

const calculateExpertMove = (game: MatchState, me: PlayerData, legalMoves: Card[]): Card => {
    const { playedCards, briscolaSuit, leadSuit, jokerPlayerId } = game;
    const historyAnalysis = analyzeHistory(game);
    const currentTrickPoints = getTrickPoints(playedCards);
    
    // Who is currently winning?
    let currentWinnerId = -1;
    if (playedCards.length > 0) {
        currentWinnerId = getTrickWinnerIndex(playedCards, briscolaSuit!, leadSuit!);
    }

    // Determine implied roles
    const amIJoker = me.role === 'JOKER';
    const isJokerRevealed = jokerPlayerId !== null;
    const isCurrentWinnerJoker = isJokerRevealed && currentWinnerId === jokerPlayerId;
    const isCurrentWinnerAlly = isJokerRevealed && !isCurrentWinnerJoker && currentWinnerId !== -1; // If I am Ally, he is Ally

    // Score each candidate card
    const scoredMoves = legalMoves.map(card => {
        let score = 0;
        
        // --- SIMULATION ---
        const simPlayedCards = [...playedCards, { playerId: me.id, card }];
        // If I am leading, I set the lead suit
        const simLeadSuit = leadSuit || card.suit;
        const winnerId = getTrickWinnerIndex(simPlayedCards, briscolaSuit!, simLeadSuit);
        const iWin = winnerId === me.id;
        
        const totalPointsInTrick = currentTrickPoints + card.value;

        // --- FACTOR 1: BECOMING JOKER RISK/REWARD ---
        // If Joker is not revealed, playing a Briscola makes me the Joker
        if (!isJokerRevealed && card.suit === briscolaSuit) {
            // Do I generally want to be the Joker? Only if my hand is strong
            // Heuristic: Count Ace/Three/Re in hand
            const strongCards = me.hand.filter(c => c.value >= 4 || c.suit === briscolaSuit).length;
            if (strongCards >= 4) {
                 score += 20; // Good to reveal if strong
            } else {
                 score -= 50; // Bad to reveal if weak
            }
            
            // However, if this specific trick gives lots of points, it might be worth it
            if (iWin && totalPointsInTrick >= 10) score += 40;
        }

        // --- FACTOR 2: WINNING LOGIC ---
        if (iWin) {
            // Value of winning points
            score += totalPointsInTrick * 15; 
            
            // Penalize using Master cards (Ace/Three) for small points
            if (card.value >= 10 && totalPointsInTrick < 4) {
                score -= 30; // Don't waste Ace/Three for nothing
            }
            
            // Penalize using Briscola for small points if not necessary
            if (card.suit === briscolaSuit && totalPointsInTrick < 3) {
                score -= 20; 
            }
        } else {
            // I lose this trick
            
            // Who wins?
            const finalWinnerId = winnerId;
            const winnerIsJoker = isJokerRevealed && finalWinnerId === jokerPlayerId;
            const winnerIsAlly = isJokerRevealed && !winnerIsJoker;

            if (amIJoker) {
                // If I am Joker, anyone else winning is bad
                score -= totalPointsInTrick * 10;
                // Don't throw points away!
                if (card.value > 0) score -= card.value * 5; 
            } 
            else if (me.role === 'ALLY') {
                 if (winnerIsAlly) {
                     // Great! My partner wins. "Carico" (Load points)
                     score += card.value * 20; 
                     // But don't throw the Ace of Briscola on a partner trick unless needed
                     if (card.suit === briscolaSuit && card.value >= 10) score -= 10; 
                 } else if (winnerIsJoker) {
                     // Terrible. Joker wins. Minimize points.
                     score -= totalPointsInTrick * 10;
                     if (card.value > 0) score -= card.value * 20; // Don't give points
                 } else {
                     // Unknown role winning (early game). Be conservative.
                     if (card.value > 0) score -= card.value * 5;
                 }
            }
            else {
                // Role UNKNOWN (Early game, nobody played Briscola yet)
                // Don't give free points to anyone
                if (card.value > 0) score -= card.value * 2;
            }
        }

        // --- FACTOR 3: HAND MANAGEMENT (Strozzino) ---
        // If leading, prefer playing "Liscio" (low value, non-briscola)
        if (playedCards.length === 0) {
            if (card.suit !== briscolaSuit && card.value === 0) score += 15;
            if (card.suit === briscolaSuit) score -= 10; // Avoid leading briscola usually
            if (card.value >= 10) score -= 10; // Avoid leading big points
        }

        return { card, score };
    });

    // Select highest score, add some randomness for tie-breaking or 'human-like' unpredictable moves
    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Debug Log (optional, can be removed)
    // console.log(`AI ${me.name} thinking...`, scoredMoves.map(m => `${m.card.label}: ${m.score}`));

    return scoredMoves[0].card;
};
