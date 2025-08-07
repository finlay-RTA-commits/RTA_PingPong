
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, writeBatch, getDocs, where } from 'firebase/firestore';
import type { Player } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { players as initialPlayers } from '@/lib/data';

interface PlayerContextType {
  players: Player[];
  addPlayer: (name: string, avatar: string, uid?: string) => Promise<void>;
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

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const seedDatabase = useCallback(async () => {
    const playersCollection = collection(db, "players");
    const snapshot = await getDocs(query(playersCollection).withConverter({
      fromFirestore: (snapshot) => ({ id: snapshot.id, ...snapshot.data() } as Player),
      toFirestore: (model) => model,
    }));
    
    if (snapshot.empty) {
        console.log('Players collection is empty. Seeding...');
        const batch = writeBatch(db);
        initialPlayers.forEach(player => {
            const docRef = doc(playersCollection);
            batch.set(docRef, player);
        });
        await batch.commit();
    }
  }, []);


  useEffect(() => {
    const initializeData = async () => {
        setLoading(true);
        await seedDatabase();

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
            toast({variant: 'destructive', title: 'Error', description: 'Could not fetch players.'});
            setLoading(false);
        });
        
        return () => unsubscribe();
    }
    
    initializeData();
  }, [toast, seedDatabase]);


  const addPlayer = async (name: string, avatar: string, uid?: string) => {
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
            rank: players.length + 1, // Initial rank
            wins: 0,
            losses: 0,
            stats: {
                winStreak: 0,
                rival: 'N/A',
                bestScore: 'N/A'
            },
            tournamentsWon: 0,
            uid: uid || null 
        });
    } catch(e) {
        console.error("Error adding player: ", e);
        toast({variant: 'destructive', title: 'Error', description: 'Could not add player.'});
    }
  };

  const updatePlayer = async (updatedPlayer: Player) => {
    const playerDoc = doc(db, "players", updatedPlayer.id);
    try {
        const { id, ...playerData } = updatedPlayer;
        await updateDoc(playerDoc, playerData);
    } catch(e) {
        console.error("Error updating player: ", e);
        toast({variant: 'destructive', title: 'Error', description: 'Could not update player.'});
    }
  };
  
  const removePlayer = async (playerId: string) => {
    try {
        await deleteDoc(doc(db, "players", playerId));
    } catch(e) {
        console.error("Error removing player: ", e);
        toast({variant: 'destructive', title: 'Error', description: 'Could not remove player.'});
    }
  };

  const updatePlayerStats = async (player1Id: string, player2Id: string, score1: number, score2: number) => {
     const batch = writeBatch(db);
     const player1Ref = doc(db, "players", player1Id);
     const player2Ref = doc(db, "players", player2Id);
     
     const player1 = players.find(p => p.id === player1Id);
     const player2 = players.find(p => p.id === player2Id);

     if (!player1 || !player2) {
        toast({variant: 'destructive', title: 'Error', description: 'One or both players not found.'});
        return;
     }

     const player1NewWins = player1.wins + (score1 > score2 ? 1 : 0);
     const player1NewLosses = player1.losses + (score1 < score2 ? 1 : 0);
     
     const player2NewWins = player2.wins + (score2 > score1 ? 1 : 0);
     const player2NewLosses = player2.losses + (score2 < score1 ? 1 : 0);

     batch.update(player1Ref, { wins: player1NewWins, losses: player1NewLosses });
     batch.update(player2Ref, { wins: player2NewWins, losses: player2NewLosses });
     
    try {
        await batch.commit();
    } catch (e) {
        console.error("Error updating stats: ", e);
        toast({variant: 'destructive', title: 'Error', description: 'Could not update player stats.'});
    }
  }

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
