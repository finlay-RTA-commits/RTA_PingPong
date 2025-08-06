
'use server';
/**
 * @fileOverview A flow for predicting ping pong match outcomes.
 *
 * - predictMatch - A function that predicts the winner between two players.
 * - PredictMatchInput - The input type for the predictMatch function.
 * - PredictMatchOutput - The return type for the predictMatch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { players } from '@/lib/data';

const allPlayerNames = players.map(p => p.name);

export const PredictMatchInputSchema = z.object({
  player1Name: z.enum(allPlayerNames as [string, ...string[]]).describe('The name of the first player.'),
  player2Name: z.enum(allPlayerNames as [string, ...string[]]).describe('The name of the second player.'),
});
export type PredictMatchInput = z.infer<typeof PredictMatchInputSchema>;

export const PredictMatchOutputSchema = z.object({
  winner: z.string().describe('The predicted winner of the match.'),
  confidence: z.number().describe('The confidence level of the prediction, from 0 to 1.'),
  reasoning: z.string().describe('A brief explanation for the prediction.'),
});
export type PredictMatchOutput = z.infer<typeof PredictMatchOutputSchema>;

const prompt = ai.definePrompt({
  name: 'predictMatchPrompt',
  input: { schema: PredictMatchInputSchema },
  output: { schema: PredictMatchOutputSchema },
  prompt: `
    You are a sports analyst for a competitive ping pong league. Your task is to predict the outcome of a match between two players based on their stats.

    Here are the players and their stats:
    {{#each players}}
    - Name: {{name}}
    - Rank: {{rank}}
    - Wins: {{wins}}
    - Losses: {{losses}}
    - Win Streak: {{stats.winStreak}}
    - Rival: {{stats.rival}}
    - Best Score: {{stats.bestScore}}
    {{/each}}

    Analyze the provided stats for the two players in the upcoming match: {{{player1Name}}} vs. {{{player2Name}}}.

    Based on your analysis, predict a winner, estimate your confidence in the prediction (from 0.0 to 1.0), and provide a brief reasoning. Consider all factors, including rank, win/loss record, recent performance (win streak), and any rivalries.
  `,
});


const predictMatchFlow = ai.defineFlow(
  {
    name: 'predictMatchFlow',
    inputSchema: PredictMatchInputSchema,
    outputSchema: PredictMatchOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({
      ...input,
      players: players.filter(p => p.name === input.player1Name || p.name === input.player2Name),
    });
    return output!;
  }
);


export async function predictMatch(
  input: PredictMatchInput
): Promise<PredictMatchOutput> {
  return await predictMatchFlow(input);
}
