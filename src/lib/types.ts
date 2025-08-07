
import { z } from 'zod';

export type Player = {
  id: string; // Firestore document ID
  uid?: string; // Firebase Auth User ID
  name: string;
  rank: number;
  wins: number;
  losses: number;
  avatar: string;
  stats?: PlayerStats;
  tournamentsWon?: number;
};

export type PlayerStats = {
  winStreak: number;
  rival: string;
  bestScore: string;
};

export type Game = {
  id: string; // Firestore document ID
  player1: Player; // This is populated client-side
  player2: Player; // This is populated client-side
  player1Id: string;
  player2Id: string;
  score1: number;
  score2: number;
  date: string;
  tournamentId?: string | null;
};

export type Tournament = {
  id: string; // Firestore document ID
  name: string;
  date: string;
  participants: number;
  imageUrl: string;
  enrolledPlayerIds: string[];
};

// === AI Flow Types ===

export const PredictMatchInputSchema = z.object({
  player1Name: z.string().describe('The name of the first player.'),
  player2Name: z.string().describe('The name of the second player.'),
});
export type PredictMatchInput = z.infer<typeof PredictMatchInputSchema>;

export const PredictMatchOutputSchema = z.object({
  winner: z.string().describe('The predicted winner of the match.'),
  odds: z.string().describe("The fractional style betting odds for the predicted winner (e.g., '5/2', '1/3')."),
  reasoning: z.string().describe('A brief explanation for the prediction.'),
});
export type PredictMatchOutput = z.infer<typeof PredictMatchOutputSchema>;
