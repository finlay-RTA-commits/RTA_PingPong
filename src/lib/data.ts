
import type { Player, Game, Tournament } from './types';

// This data is now used for initial seeding if the database is empty, but the primary source of truth is Firestore.

export const players: Omit<Player, 'id' | 'uid'>[] = [
  { name: 'Alice', rank: 1, wins: 15, losses: 2, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 5, rival: 'Bob', bestScore: '11-2' }, tournamentsWon: 2 },
  { name: 'Bob', rank: 2, wins: 13, losses: 4, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 2, rival: 'Alice', bestScore: '11-4' }, tournamentsWon: 1 },
  { name: 'Charlie', rank: 3, wins: 12, losses: 5, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 0, rival: 'Diana', bestScore: '11-5' } },
  { name: 'Diana', rank: 4, wins: 10, losses: 7, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 3, rival: 'Charlie', bestScore: '11-6' } },
  { name: 'Ethan', rank: 5, wins: 9, losses: 8, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 1, rival: 'Fiona', bestScore: '11-7' } },
  { name: 'Fiona', rank: 6, wins: 7, losses: 10, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 0, rival: 'Ethan', bestScore: '11-8' } },
  { name: 'George', rank: 7, wins: 5, losses: 12, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 0, rival: 'Hannah', bestScore: '11-9' } },
  { name: 'Hannah', rank: 8, wins: 3, losses: 14, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 0, rival: 'George', bestScore: '11-10' } },
];

export const games: Omit<Game, 'id'>[] = [
  // Games will also be stored in Firestore. This is just for local placeholder.
];

export const tournaments: Omit<Tournament, 'id'>[] = [
  { name: 'Summer Slam 2024', date: '2024-08-01', participants: 8, imageUrl: 'https://placehold.co/600x400.png', enrolledPlayerIds: [] },
  { name: 'Autumn Open', date: '2024-10-15', participants: 4, imageUrl: 'https://placehold.co/600x400.png', enrolledPlayerIds: [] },
  { name: 'Winter Championship', date: '2024-12-05', participants: 6, imageUrl: 'https://placehold.co/600x400.png', enrolledPlayerIds: [] },
  { name: 'New Year Cup', date: '2025-01-10', participants: 8, imageUrl: 'https://placehold.co/600x400.png', enrolledPlayerIds: [] },
];
