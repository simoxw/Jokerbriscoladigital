
export type Suit = 'foglia' | 'onda' | 'roccia' | 'stella';
export type AIDifficulty = 'BASE' | 'ESPERTO';

export interface Card {
  id: string;
  suit: Suit;
  rank: number;
  value: number;
  label: string;
}

export type PlayerRole = 'JOKER' | 'ALLY' | 'NONE';

export interface PlayerData {
  id: number;
  name: string;
  index: number;
  handSize: number;
  hand: Card[];
  role: PlayerRole;
  pointsInMatch: number;
  totalScore: number;
  capturedCards: Card[];
}

export interface TrickRecord {
  round: number;
  plays: { playerId: number; playerName: string; card: Card }[];
  winnerId: number;
  winnerName: string;
  points: number;
}

export interface MatchState {
  players: PlayerData[];
  deck: Card[];
  deckCount: number;
  briscola: Card | null;
  briscolaSuit?: Suit;
  lastCard?: Card;
  playedCards: { playerId: number; card: Card }[];
  turnIndex: number;
  jokerPlayerId: number | null;
  phase: 'WAITING' | 'PLAYING' | 'TRICK_END' | 'MATCH_END' | 'TOURNAMENT_WIN';
  roundCount: number;
  leadSuit?: Suit;
  difficulty: AIDifficulty;
  waitingForNextTrick: boolean;
  tempWinnerId: number | null;
  history: TrickRecord[];
  message?: string;
}
