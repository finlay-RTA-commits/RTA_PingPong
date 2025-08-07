
import type { Player, Game, Tournament } from './types';

// This data is no longer used by the application, which now connects directly to Firestore.
// It can be removed or kept for reference, but it does not affect the live app data.

export const players: Omit<Player, 'id' | 'uid'>[] = [];

export const games: Omit<Game, 'id'>[] = [];

export const tournaments: Omit<Tournament, 'id'>[] = [];
