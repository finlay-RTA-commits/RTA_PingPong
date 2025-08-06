export type Player = {
  id: number;
  name: string;
  rank: number;
  wins: number;
  losses: number;
  avatar: string;
};

export type Game = {
  id: number;
  player1: Player;
  player2: Player;
  score1: number;
  score2: number;
  date: string;
};

export type Tournament = {
  id: number;
  name: string;
  date: string;
  participants: number;
  imageUrl: string;
};
