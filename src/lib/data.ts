import type { Player, Game, Tournament } from './types';

export const players: Player[] = [
  { id: 1, name: 'Alice', rank: 1, wins: 15, losses: 2, avatar: 'https://placehold.co/40x40.png' },
  { id: 2, name: 'Bob', rank: 2, wins: 13, losses: 4, avatar: 'https://placehold.co/40x40.png' },
  { id: 3, name: 'Charlie', rank: 3, wins: 12, losses: 5, avatar: 'https://placehold.co/40x40.png' },
  { id: 4, name: 'Diana', rank: 4, wins: 10, losses: 7, avatar: 'https://placehold.co/40x40.png' },
  { id: 5, name: 'Ethan', rank: 5, wins: 9, losses: 8, avatar: 'https://placehold.co/40x40.png' },
  { id: 6, name: 'Fiona', rank: 6, wins: 7, losses: 10, avatar: 'https://placehold.co/40x40.png' },
  { id: 7, name: 'George', rank: 7, wins: 5, losses: 12, avatar: 'https://placehold.co/40x40.png' },
  { id: 8, name: 'Hannah', rank: 8, wins: 3, losses: 14, avatar: 'https://placehold.co/40x40.png' },
];

export const games: Game[] = [
  { id: 1, player1: players[0], player2: players[2], score1: 11, score2: 5, date: '2024-07-20' },
  { id: 2, player1: players[1], player2: players[3], score1: 7, score2: 11, date: '2024-07-20' },
  { id: 3, player1: players[4], player2: players[5], score1: 11, score2: 9, date: '2024-07-19' },
  { id: 4, player1: players[6], player2: players[7], score1: 2, score2: 11, date: '2024-07-19' },
  { id: 5, player1: players[0], player2: players[1], score1: 11, score2: 8, date: '2024-07-18' },
];

export const tournaments: Tournament[] = [
  { id: 1, name: 'Summer Slam 2024', date: '2024-08-01', participants: 32, imageUrl: 'https://placehold.co/600x400.png' },
  { id: 2, name: 'Autumn Open', date: '2024-10-15', participants: 16, imageUrl: 'https://placehold.co/600x400.png' },
  { id: 3, name: 'Winter Championship', date: '2024-12-05', participants: 24, imageUrl: 'https://placehold.co/600x400.png' },
  { id: 4, name: 'New Year Cup', date: '2025-01-10', participants: 16, imageUrl: 'https://placehold.co/600x400.png' },
];
