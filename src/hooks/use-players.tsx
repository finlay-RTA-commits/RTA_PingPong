
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, writeBatch, getDocs, where } from 'firebase/firestore';
import type { Player, Game, AchievementId } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { achievementData } from '@/lib/types';

interface PlayerContextType {
  players: Player[];
  addPlayer: (name: string, avatar: string, email: string, uid?: string) => Promise<void>;
  updatePlayer: (updatedPlayer: Player) => Promise<void>;
  removePlayer: (playerId: string) => Promise<void>;
  updatePlayerStats: (player1Id: string, player2Id: string, score1: number, score2: number, tournamentId?: string | null) => Promise<void>;
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

const REPEATABLE_ACHIEVEMENTS: AchievementId[] = [
    'KING_SLAYER',
    'HOT_STREAK',
    'BUTTERFINGERS',
    'RIVAL_REVENGE',
    'COIN_FLIP_CHAMPION',
    'YO_YO',
    'SHOULD_BE_WORKING',
];


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
                lossStreak: 0,
                rival: 'N/A',
                highestStreak: 0,
                elo: DEFAULT_ELO,
            },
            tournamentsWon: 0,
            achievements: [],
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

  const updatePlayerStats = async (player1Id: string, player2Id: string, score1: number, score2: number, tournamentId?: string | null) => {
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

    const checkAndGrantAchievement = (player: Player, achievementId: AchievementId): {newAchievements: AchievementId[], didUnlock: boolean} => {
        const isRepeatable = REPEATABLE_ACHIEVEMENTS.includes(achievementId);
        const hasAchievement = player.achievements?.includes(achievementId);

        if (!hasAchievement || isRepeatable) {
            const achievement = achievementData[achievementId];
            toast({
                title: '🏆 Achievement Unlocked!',
                description: `${player.name} earned: ${achievement.name}`,
            });
            // For non-repeatable, add it. For repeatable, we don't need to add it multiple times to the array.
            // The toast notification is the reward. We'll just return the existing achievements.
            // A better implementation for repeatable might be a separate counter if we wanted to track *how many* times.
            // For now, we'll just re-award the toast.
            if (!hasAchievement) {
                return { newAchievements: [...(player.achievements || []), achievementId], didUnlock: true };
            }
        }
        return { newAchievements: player.achievements || [], didUnlock: false };
    };
    
    // Calculate Elo ranks for achievement check
    const eloSortedPlayers = [...allPlayers]
      .sort((a, b) => (b.stats?.elo ?? 0) - (a.stats?.elo ?? 0))
      .map((p, index) => ({ ...p, eloRank: index + 1 }));


    const processPlayer = (playerId: string, ownScore: number, opponentScore: number, opponentId: string, newElo: number) => {
      const player = allPlayers.find(p => p.id === playerId);
      let opponent = allPlayers.find(p => p.id === opponentId);
      if (!player || !opponent) return;

      const playerRef = doc(db, "players", playerId);
      const wonGame = ownScore > opponentScore;
      let newAchievements = [...(player.achievements || [])];

      // Calculate wins and losses
      const newWins = player.wins + (wonGame ? 1 : 0);
      const newLosses = player.losses + (wonGame ? 0 : 1);
      
      const newWinStreak = wonGame ? (player.stats?.winStreak ?? 0) + 1 : 0;
      const newLossStreak = !wonGame ? (player.stats?.lossStreak ?? 0) + 1 : 0;

      // Get all games for this player, including the one just played
      const playerGames = [
          ...allGames.filter(g => g.player1Id === playerId || g.player2Id === playerId),
          // Add the current game to the list for calculation
          { player1Id, player2Id, score1, score2, date: new Date().toISOString(), id: 'current', tournamentId: null }
      ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


      // Calculate current win streak (legacy)
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
          const gameOpponent = game.player1Id === playerId ? game.player2Id : game.player1Id;
          acc[gameOpponent] = (acc[gameOpponent] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);

      let rivalId = 'N/A';
      let maxGames = 0;
      for (const [o, count] of Object.entries(opponentCounts)) {
          if (count > maxGames) {
              maxGames = count;
              rivalId = o;
          }
      }
      const rival = allPlayers.find(p => p.id === rivalId)?.name || 'N/A';

      // --- Achievement Checks ---
      const grant = (achId: AchievementId) => {
        const result = checkAndGrantAchievement(player, achId);
        if (result.didUnlock) {
            newAchievements = result.newAchievements;
        }
      }

      // KING_SLAYER
      const opponentEloRank = eloSortedPlayers.find(p => p.id === opponentId)?.eloRank;
      if (wonGame && (opponent.rank === 1 || opponentEloRank === 1)) {
          grant('KING_SLAYER');
      }
      // HOT_STREAK
      if (newWinStreak >= 5) {
          grant('HOT_STREAK');
      }
      // BUTTERFINGERS
      if (newLossStreak >= 5) {
          grant('BUTTERFINGERS');
      }
      // WELCOME_TO_THE_BIG_LEAGUES
      if(tournamentId) {
          grant('WELCOME_TO_THE_BIG_LEAGUES');
      }
      // WELCOME_TO_THE_PARTY_PAL
      if(player.wins === 0 && player.losses === 0) {
          grant('WELCOME_TO_THE_PARTY_PAL');
      }
      // RIVAL_REVENGE
      if (wonGame && opponent.name === player.stats?.rival) {
        grant('RIVAL_REVENGE');
      }
      // COIN_FLIP_CHAMPION
      if (wonGame && ownScore === 2 && opponentScore === 1) {
          const lastTwoGames = playerGames.slice(-3, -1);
          const all2to1Wins = lastTwoGames.every(g => {
              const isWinner = (g.player1Id === playerId && g.score1 > g.score2) || (g.player2Id === playerId && g.score2 > g.score1);
              const scoresAre2to1 = (g.player1Id === playerId && g.score1 === 2 && g.score2 === 1) || (g.player2Id === playerId && g.score2 === 2 && g.score1 === 1);
              return isWinner && scoresAre2to1;
          });
          if (lastTwoGames.length === 2 && all2to1Wins) {
            grant('COIN_FLIP_CHAMPION');
          }
      }
      // YO_YO
      const last6Games = playerGames.slice(-6);
      if (last6Games.length === 6) {
          let isYoYo = true;
          const firstGameWon = (last6Games[0].player1Id === playerId && last6Games[0].score1 > last6Games[0].score2) || (last6Games[0].player2Id === playerId && last6Games[0].score2 > last6Games[0].score1);
          for (let i = 1; i < last6Games.length; i++) {
              const currentGameWon = (last6Games[i].player1Id === playerId && last6Games[i].score1 > last6Games[i].score2) || (last6Games[i].player2Id === playerId && last6Games[i].score2 > last6Games[i].score1);
              const prevGameWon = (last6Games[i-1].player1Id === playerId && last6Games[i-1].score1 > last6Games[i-1].score2) || (last6Games[i-1].player2Id === playerId && last6Games[i-1].score2 > last6Games[i-1].score1);
              if (currentGameWon === prevGameWon) {
                  isYoYo = false;
                  break;
              }
          }
          if (isYoYo) {
              grant('YO_YO');
          }
      }
      // SHOULD_BE_WORKING
      const now = new Date();
      if (wonGame && now.getUTCHours() < 11) {
        grant('SHOULD_BE_WORKING');
      }


      // Update batch
      batch.update(playerRef, {
        wins: newWins,
        losses: newLosses,
        achievements: newAchievements,
        stats: {
          winStreak: newWinStreak,
          lossStreak: newLossStreak,
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
