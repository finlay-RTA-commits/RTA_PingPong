
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, writeBatch, getDocs, where } from 'firebase/firestore';
import type { Player, Game } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';

interface PlayerContextType {
  players: Player[];
  addPlayer: (name: string, avatar: string, email: string, uid?: string) => Promise<void>;
  updatePlayer: (updatedPlayer: Player) => Promise<void>;
  removePlayer: (playerId: string) => Promise<void>;
  updatePlayerStats: (player1Id: string, player2Id: string, score1: number, score2: number) => Promise<void>;
  loading: boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const reRankPlayers = (players: Player[]): Player[] => {
    return players
        .sort((a,b) => b.wins - a.wins)
        .map((p, index) => ({...p, rank: index + 1}));
}

// Elo Calculation Constants
const K_FACTOR = 32;
const DEFAULT_ELO = 1000;

const calculateExpectedScore = (playerElo: number, opponentElo: number) => {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
};


export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const playersCollection = collection(db, "players");
    const q = query(playersCollection, orderBy("wins", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const playersData: Player[] = [];
      querySnapshot.forEach((doc) => {
        playersData.push({ id: doc.id, ...doc.data() } as Player);
      });
      setPlayers(reRankPlayers(playersData));
      setLoading(false);
    }, (error) => {
        console.error("Error fetching players:", error);
        toast({variant: 'destructive', title: 'Error', description: 'Could not fetch players from Firestore.'});
        setLoading(false);
    });
    
    return () => unsubscribe();
  }, [toast]);

  const addPlayer = async (name: string, avatar: string, email: string, uid?: string) => {
    try {
        if(uid) {
            const existingPlayerQuery = query(collection(db, "players"), where("uid", "==", uid));
            const querySnapshot = await getDocs(existingPlayerQuery);

            if (!querySnapshot.empty) {
                toast({variant: 'destructive', title: 'Error', description: 'A player profile for this user already exists.'});
                return;
            }
        }

        await addDoc(collection(db, "players"), {
            name,
            avatar,
            email,
            rank: 99, // Rank will be recalculated on the next snapshot
            wins: 0,
            losses: 0,
            stats: {
                winStreak: 0,
                rival: 'N/A',
                highestStreak: 0,
                elo: DEFAULT_ELO,
            },
            tournamentsWon: 0,
            uid: uid || null 
        });
    } catch(e) {
        console.error("Error adding player: ", e);
        toast({variant: 'destructive', title: 'Error', description: 'Could not add player to Firestore.'});
    }
  };

  const updatePlayer = async (updatedPlayer: Player) => {
    const playerDoc = doc(db, "players", updatedPlayer.id);
    try {
        const { id, ...playerData } = updatedPlayer;
        await updateDoc(playerDoc, playerData);
    } catch(e) {
        console.error("Error updating player: ", e);
        toast({variant: 'destructive', title: 'Error', description: 'Could not update player in Firestore.'});
    }
  };
  
  const removePlayer = async (playerId: string) => {
    try {
        await deleteDoc(doc(db, "players", playerId));
    } catch(e) {
        console.error("Error removing player: ", e);
        toast({variant: 'destructive', title: 'Error', description: 'Could not remove player from Firestore.'});
    }
  };

  const updatePlayerStats = async (player1Id: string, player2Id: string, score1: number, score2: number) => {
    const batch = writeBatch(db);
    const allPlayers = players; 
    
    const player1 = allPlayers.find(p => p.id === player1Id);
    const player2 = allPlayers.find(p => p.id === player2Id);
    
    if(!player1 || !player2) {
      console.error("One or both players not found for stat update.");
      return;
    }

    // --- ELO Calculation ---
    const player1Elo = player1.stats?.elo ?? DEFAULT_ELO;
    const player2Elo = player2.stats?.elo ?? DEFAULT_ELO;

    const player1Expected = calculateExpectedScore(player1Elo, player2Elo);
    const player2Expected = calculateExpectedScore(player2Elo, player1Elo);
    
    const player1Won = score1 > score2;
    const player1ActualScore = player1Won ? 1 : 0;
    const player2ActualScore = player1Won ? 0 : 1;

    const newPlayer1Elo = Math.round(player1Elo + K_FACTOR * (player1ActualScore - player1Expected));
    const newPlayer2Elo = Math.round(player2Elo + K_FACTOR * (player2ActualScore - player2Expected));


    // Fetch all games to calculate other stats
    const gamesSnapshot = await getDocs(query(collection(db, "games"), orderBy("date", "asc")));
    const allGames = gamesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));

    const processPlayer = (playerId: string, ownScore: number, opponentScore: number, opponentId: string, newElo: number) => {
      const player = allPlayers.find(p => p.id === playerId);
      if (!player) return;

      const playerRef = doc(db, "players", playerId);
      const wonGame = ownScore > opponentScore;

      // Calculate wins and losses
      const newWins = player.wins + (wonGame ? 1 : 0);
      const newLosses = player.losses + (wonGame ? 0 : 1);

      // Get all games for this player, including the one just played
      const playerGames = [
          ...allGames.filter(g => g.player1Id === playerId || g.player2Id === playerId),
          // Add the current game to the list for calculation
          { player1Id, player2Id, score1, score2, date: new Date().toISOString(), id: 'current', tournamentId: null }
      ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


      // Calculate current win streak
      let currentStreak = 0;
      for (let i = playerGames.length - 1; i >= 0; i--) {
        const game = playerGames[i];
        const isWinner = (game.player1Id === playerId && game.score1 > game.score2) || (game.player2Id === playerId && game.score2 > game.score1);
        if (isWinner) {
          currentStreak++;
        } else {
          break; // Streak broken
        }
      }

      // Calculate highest streak
      let maxStreak = 0;
      let tempStreak = 0;
      for (const game of playerGames) {
          const isWinner = (game.player1Id === playerId && game.score1 > game.score2) || (game.player2Id === playerId && game.score2 > game.score1);
          if (isWinner) {
              tempStreak++;
          } else {
              if (tempStreak > maxStreak) {
                  maxStreak = tempStreak;
              }
              tempStreak = 0;
          }
      }
      if (tempStreak > maxStreak) {
          maxStreak = tempStreak;
      }
      const highestStreak = maxStreak;

      // Calculate rival
      const opponentCounts = playerGames.reduce((acc, game) => {
          const opponent = game.player1Id === playerId ? game.player2Id : game.player1Id;
          acc[opponent] = (acc[opponent] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);

      let rivalId = 'N/A';
      let maxGames = 0;
      for (const [opponent, count] of Object.entries(opponentCounts)) {
          if (count > maxGames) {
              maxGames = count;
              rivalId = opponent;
          }
      }
      const rival = allPlayers.find(p => p.id === rivalId)?.name || 'N/A';

      // Update batch
      batch.update(playerRef, {
        wins: newWins,
        losses: newLosses,
        stats: {
          winStreak: currentStreak,
          highestStreak: highestStreak,
          rival: rival,
          elo: newElo,
        }
      });
    };

    processPlayer(player1Id, score1, score2, player2Id, newPlayer1Elo);
    processPlayer(player2Id, score2, score1, player1Id, newPlayer2Elo);

    try {
      await batch.commit();
    } catch (e) {
      console.error("Error updating stats: ", e);
      toast({variant: 'destructive', title: 'Error', description: 'Could not update player stats in Firestore.'});
    }
  };


  return (
    <PlayerContext.Provider value={{ players, loading, addPlayer, updatePlayer, removePlayer, updatePlayerStats }}>
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
