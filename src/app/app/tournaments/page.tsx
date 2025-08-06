
'use client';

import { useState } from 'react';
import Image from "next/image";
import { tournaments as initialTournaments, players } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, PlusCircle, Users, GitMerge } from "lucide-react";
import type { Tournament, Player } from '@/lib/types';

interface BracketRound {
    title: string;
    seeds: (Player | null)[][];
}

const generateBracket = (participants: Player[]): BracketRound[] => {
    const bracket: BracketRound[] = [];
    let currentRoundPlayers = [...participants];
    let roundNumber = 1;

    while(currentRoundPlayers.length > 1) {
        const round: BracketRound = {
            title: `Round ${roundNumber}`,
            seeds: []
        };
        const nextRoundPlayers: (Player | null)[] = [];

        for(let i = 0; i < currentRoundPlayers.length; i += 2) {
            const player1 = currentRoundPlayers[i];
            const player2 = i + 1 < currentRoundPlayers.length ? currentRoundPlayers[i+1] : null;
            round.seeds.push([player1, player2]);
            // For this simulation, we'll just advance the first player of the pair
            nextRoundPlayers.push(player1);
        }
        
        bracket.push(round);
        // This is a placeholder for advancing logic. In a real app, match results would determine this.
        currentRoundPlayers = nextRoundPlayers.filter(p => p !== null) as Player[]; 
        roundNumber++;
    }

    return bracket;
};


export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState(initialTournaments);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  const handleCreateTournament = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const name = formData.get('name') as string;
      const date = formData.get('date') as string;
      const participants = parseInt(formData.get('participants') as string, 10);

      if(!name || !date || isNaN(participants)) return;

      const newTournament: Tournament = {
          id: tournaments.length + 1,
          name,
          date,
          participants,
          imageUrl: `https://placehold.co/600x400.png`
      };
      setTournaments([newTournament, ...tournaments]);
  }
  
  const bracket = selectedTournament ? generateBracket(players.slice(0, selectedTournament.participants)) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tournaments</h1>
          <p className="text-muted-foreground">
            Browse and manage all official RTA PingPong tournaments.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Tournament
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateTournament}>
              <DialogHeader>
                <DialogTitle>Create New Tournament</DialogTitle>
                <DialogDescription>
                  Fill in the details below to set up a new tournament.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tournament Name</Label>
                  <Input id="name" name="name" placeholder="e.g., Summer Slam 2024" required/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Start Date</Label>
                  <Input id="date" name="date" type="date" required/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participants">Number of Participants</Label>
                  <Input id="participants" name="participants" type="number" min="2" step="2" placeholder="e.g., 16" required/>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                   <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button type="submit">Create</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament) => (
          <Card key={tournament.id} className="flex flex-col">
            <CardHeader>
               <div className="aspect-video overflow-hidden rounded-md border">
                <Image
                  src={tournament.imageUrl}
                  alt={tournament.name}
                  width={600}
                  height={400}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                  data-ai-hint="ping pong"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardTitle>{tournament.name}</CardTitle>
              <CardDescription className="mt-2 flex flex-col gap-2">
                 <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> {tournament.date}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> {tournament.participants} participants
                </span>
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                   <Button className="w-full" variant="secondary" onClick={() => setSelectedTournament(tournament)}>View Bracket</Button>
                </DialogTrigger>
                 <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{selectedTournament?.name}</DialogTitle>
                        <DialogDescription>A visual bracket of the tournament progress.</DialogDescription>
                    </DialogHeader>
                    {bracket.length > 0 ? (
                        <div className="flex space-x-4 overflow-x-auto p-4">
                        {bracket.map((round, roundIndex) => (
                            <div key={roundIndex} className="flex flex-col space-y-4">
                            <h3 className="font-bold text-center">{round.title}</h3>
                            <div className="flex flex-col justify-around min-h-full space-y-12">
                                {round.seeds.map((match, matchIndex) => (
                                <div key={matchIndex} className="relative">
                                    <div className="flex flex-col space-y-2">
                                        <div className="border p-2 rounded-md bg-muted/50 w-48">{match[0]?.name ?? 'TBD'}</div>
                                        <div className="border p-2 rounded-md bg-muted/50 w-48">{match[1]?.name ?? 'TBD'}</div>
                                    </div>
                                    {roundIndex < bracket.length - 1 && (
                                        <div className="absolute top-1/2 -right-6 h-px w-6 bg-border -translate-y-1/2"></div>
                                    )}
                                </div>
                                ))}
                            </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8">
                            <GitMerge className="h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">Bracket not available yet.</p>
                        </div>
                    )}
                 </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
