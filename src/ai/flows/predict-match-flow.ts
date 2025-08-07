
'use server';
/**
 * @fileOverview A flow for predicting ping pong match outcomes.
 *
 * - predictMatch - A function that predicts the winner between two players.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Player, PredictMatchInputSchema, PredictMatchOutputSchema, PredictMatchInput, PredictMatchOutput } from '@/lib/types';


const getPlayers = async (): Promise<Player[]> => {
    const playersCollection = collection(db, "players");
    const snapshot = await getDocs(playersCollection);
    const players: Player[] = [];
    snapshot.forEach(doc => {
        players.push({ id: doc.id, ...doc.data() } as Player);
    });
    return players;
};


const prompt = ai.definePrompt({
  name: 'predictMatchPrompt',
  input: { schema: z.object({
    player1Name: z.string(),
    player2Name: z.string(),
    players: z.any(),
  })},
  output: { schema: PredictMatchOutputSchema },
  prompt: `
    You are a sports betting analyst for a competitive ping pong league. Your task is to predict the outcome of a match between two players and provide betting odds.

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

    Based on your analysis, predict a winner, provide the fractional style betting odds, and give a brief reasoning for your prediction.
  `,
});


const predictMatchFlow = ai.defineFlow(
  {
    name: 'predictMatchFlow',
    inputSchema: PredictMatchInputSchema,
    outputSchema: PredictMatchOutputSchema,
  },
  async (input) => {
    const allPlayers = await getPlayers();
    const player1 = allPlayers.find(p => p.name === input.player1Name);
    const player2 = allPlayers.find(p => p.name === input.player2Name);

    if (!player1 || !player2) {
        throw new Error('One or both players not found');
    }

    const { output } = await prompt({
      ...input,
      players: [player1, player2],
    });
    return output!;
  }
);


export async function predictMatch(
  input: PredictMatchInput
): Promise<PredictMatchOutput> {
  // We will validate inside the flow after fetching live data
  return await predictMatchFlow(input);
}
