
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Player } from '@/lib/types';
import { players as initialPlayers } from '@/lib/data';

interface PlayerContextType {
  players: Player[];
  addPlayer: (name: string, avatar: string, id?: number) => void;
  updatePlayer: (updatedPlayer: Player) => void;
  removePlayer: (playerId: number) => void;
  updatePlayerStats: (playerId: number, score1: number, score2: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const reRankPlayers = (players: Player[]): Player[] => {
    return players
        .sort((a,b) => b.wins - a.wins)
        .map((p, index) => ({...p, rank: index + 1}));
}

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [players, setPlayers] = useState<Player[]>(reRankPlayers(initialPlayers));

  const addPlayer = (name: string, avatar: string, id?: number) => {
    const newPlayer: Player = {
      id: id || Math.max(...players.map(p => p.id), 0) + 1,
      name,
      avatar,
      rank: players.length + 1, // Initial rank
      wins: 0,
      losses: 0,
      stats: {
          winStreak: 0,
          rival: 'N/A',
          bestScore: 'N/A'
      },
      tournamentsWon: 0,
    };
    setPlayers(prevPlayers => reRankPlayers([...prevPlayers, newPlayer]));
  };

  const updatePlayer = (updatedPlayer: Player) => {
    setPlayers(prevPlayers => reRankPlayers(
      prevPlayers.map(p => (p.id === updatedPlayer.id ? updatedPlayer : p))
    ));
  };
  
  const removePlayer = (playerId: number) => {
    setPlayers(prevPlayers => reRankPlayers(
        prevPlayers.filter(p => p.id !== playerId)
    ));
  };

  const updatePlayerStats = (playerId: number, myScore: number, opponentScore: number) => {
    setPlayers(prevPlayers => {
        const updatedPlayers = prevPlayers.map(p => {
            if (p.id === playerId) {
                return { 
                    ...p, 
                    wins: myScore > opponentScore ? p.wins + 1 : p.wins, 
                    losses: myScore < opponentScore ? p.losses + 1 : p.losses 
                };
            }
            return p;
        });
        return reRankPlayers(updatedPlayers);
    });
  }

  return (
    <PlayerContext.Provider value={{ players, addPlayer, updatePlayer, removePlayer, updatePlayerStats }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayers = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayers must be used within a PlayerProvider');
  }
  return context;
};
