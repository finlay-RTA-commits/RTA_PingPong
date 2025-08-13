
import { z } from 'zod';

export type Player = {
  id: string; // Firestore document ID
  uid?: string; // Firebase Auth User ID
  name: string;
  email?: string; // Player's email for invites
  rank: number;
  wins: number;
  losses: number;
  avatar: string;
  stats?: PlayerStats;
  tournamentsWon?: number;
  achievements?: AchievementId[];
};

export type PlayerStats = {
  winStreak: number;
  lossStreak: number;
  rival: string;
  highestStreak: number;
  elo: number;
};

export type Game = {
  id: string; // Firestore document ID
  player1?: Player; // This is populated client-side
  player2?: Player; // This is populated client-side
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

// === Gamification Types ===

export const achievementData = {
  KING_SLAYER: { id: 'KING_SLAYER', name: 'King Slayer', description: 'Defeat the #1 ranked player.', icon: 'Crown' },
  HOT_STREAK: { id: 'HOT_STREAK', name: 'Hot Streak', description: 'Win 5 games in a row.', icon: 'Flame' },
  BUTTERFINGERS: { id: 'BUTTERFINGERS', name: 'Butterfingers', description: 'Lose 5 games in a row.', icon: 'Droplet' },
  WELCOME_TO_THE_BIG_LEAGUES: { id: 'WELCOME_TO_THE_BIG_LEAGUES', name: 'Welcome to the Big Leagues', description: 'Play your first tournament match.', icon: 'Ticket' },
  WELCOME_TO_THE_PARTY_PAL: { id: 'WELCOME_TO_THE_PARTY_PAL', name: 'Welcome to the Party, Pal!', description: 'Play your first game.', icon: 'PartyPopper' },
  RIVAL_REVENGE: { id: 'RIVAL_REVENGE', name: 'Rival Revenge', description: 'Defeat your official rival.', icon: 'Shield' },
  COIN_FLIP_CHAMPION: { id: 'COIN_FLIP_CHAMPION', name: 'Coin Flip Champion', description: 'Win 3 matches in a row with a 2-1 score.', icon: 'Coins' },
  YO_YO: { id: 'YO_YO', name: 'Yo-Yo', description: 'Alternate wins and losses for 6 matches straight.', icon: 'Repeat' },
  SHOULD_BE_WORKING: { id: 'SHOULD_BE_WORKING', name: 'Should be Working', description: 'Win a match before 11am GMT.', icon: 'Coffee' },
} as const;

export type AchievementId = keyof typeof achievementData;
export type Achievement = typeof achievementData[AchievementId];


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
