
import { z } from 'zod';

export type Player = {
  id: number;
  name: string;
  rank: number;
  wins: number;
  losses: number;
  avatar: string;
  stats?: PlayerStats;
};

export type PlayerStats = {
  winStreak: number;
  rival: string;
  bestScore: string;
};

export type Game = {
  id: number;
  player1: Player;
  player2: Player;
  score1: number;
  score2: number;
  date: string;
  tournamentId?: number;
};

export type Tournament = {
  id: number;
  name: string;
  date: string;
  participants: number;
  imageUrl: string;
  enrolledPlayerIds: number[];
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
