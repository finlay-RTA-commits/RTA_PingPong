
import type { Player, Game, Tournament } from './types';

export const players: Player[] = [
  { id: 1, name: 'Alice', rank: 1, wins: 15, losses: 2, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 5, rival: 'Bob', bestScore: '11-2' } },
  { id: 2, name: 'Bob', rank: 2, wins: 13, losses: 4, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 2, rival: 'Alice', bestScore: '11-4' } },
  { id: 3, name: 'Charlie', rank: 3, wins: 12, losses: 5, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 0, rival: 'Diana', bestScore: '11-5' } },
  { id: 4, name: 'Diana', rank: 4, wins: 10, losses: 7, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 3, rival: 'Charlie', bestScore: '11-6' } },
  { id: 5, name: 'Ethan', rank: 5, wins: 9, losses: 8, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 1, rival: 'Fiona', bestScore: '11-7' } },
  { id: 6, name: 'Fiona', rank: 6, wins: 7, losses: 10, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 0, rival: 'Ethan', bestScore: '11-8' } },
  { id: 7, name: 'George', rank: 7, wins: 5, losses: 12, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 0, rival: 'Hannah', bestScore: '11-9' } },
  { id: 8, name: 'Hannah', rank: 8, wins: 3, losses: 14, avatar: 'https://placehold.co/40x40.png', stats: { winStreak: 0, rival: 'George', bestScore: '11-10' } },
];

export const games: Game[] = [
  { id: 1, player1: players[0], player2: players[2], score1: 3, score2: 1, date: '2024-07-20' },
  { id: 2, player1: players[1], player2: players[3], score1: 2, score2: 3, date: '2024-07-20' },
  { id: 3, player1: players[4], player2: players[5], score1: 3, score2: 0, date: '2024-07-19' },
  { id: 4, player1: players[6], player2: players[7], score1: 1, score2: 3, date: '2024-07-19' },
  { id: 5, player1: players[0], player2: players[1], score1: 3, score2: 2, date: '2024-07-18' },
];

export const tournaments: (Omit<Tournament, 'enrolledPlayerIds'>)[] = [
  { id: 1, name: 'Summer Slam 2024', date: '2024-08-01', participants: 8, imageUrl: 'https://placehold.co/600x400.png' },
  { id: 2, name: 'Autumn Open', date: '2024-10-15', participants: 4, imageUrl: 'https://placehold.co/600x400.png' },
  { id: 3, name: 'Winter Championship', date: '2024-12-05', participants: 6, imageUrl: 'https://placehold.co/600x400.png' },
  { id: 4, name: 'New Year Cup', date: '2025-01-10', participants: 8, imageUrl: 'https://placehold.co/600x400.png' },
];
