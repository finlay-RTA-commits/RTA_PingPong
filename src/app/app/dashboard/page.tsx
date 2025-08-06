
"use client";

import { useState } from 'react';
import { players as initialPlayers, games as initialGames, tournaments } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Calendar, Plus } from "lucide-react";
import type { Player, Game } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [games, setGames] = useState<Game[]>(initialGames);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();

  const handleLogGame = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const player1Id = formData.get('player1') as string;
    const player2Id = formData.get('player2') as string;
    const score1 = parseInt(formData.get('score1') as string, 10);
    const score2 = parseInt(formData.get('score2') as string, 10);
    const tournamentId = formData.get('tournament') as string;

    if (!player1Id || !player2Id || isNaN(score1) || isNaN(score2)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields correctly.' });
      return;
    }
    
    if (player1Id === player2Id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Players cannot play against themselves.' });
        return;
    }

    const player1 = players.find(p => p.id === parseInt(player1Id));
    const player2 = players.find(p => p.id === parseInt(player2Id));

    if (!player1 || !player2) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not find selected players.' });
      return;
    }

    const newGame: Game = {
      id: games.length + 1,
      player1,
      player2,
      score1,
      score2,
      date: new Date().toISOString().split('T')[0],
      tournamentId: tournamentId ? parseInt(tournamentId) : undefined
    };

    const updatedPlayers = players.map(p => {
        if (p.id === player1.id) {
            return { ...p, wins: score1 > score2 ? p.wins + 1 : p.wins, losses: score1 < score2 ? p.losses + 1 : p.losses };
        }
        if (p.id === player2.id) {
            return { ...p, wins: score2 > score1 ? p.wins + 1 : p.wins, losses: score2 < score1 ? p.losses + 1 : p.losses };
        }
        return p;
    }).sort((a,b) => b.wins - a.wins).map((p, index) => ({...p, rank: index + 1}));


    setGames([newGame, ...games]);
    setPlayers(updatedPlayers);
    
    setIsSheetOpen(false);

    toast({ title: 'Game Logged', description: `${player1.name} vs ${player2.name} has been recorded.` });
  };


  return (
    <>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="text-primary" />
            Leaderboard
          </CardTitle>
          <CardDescription>Top 5 players.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Wins</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.slice(0, 5).map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-bold">{player.rank}</TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell>{player.wins}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
       <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Upcoming Tournaments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tournaments.slice(0, 2).map((tournament) => (
              <div key={tournament.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <h3 className="font-semibold">{tournament.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {tournament.date}
                    </p>
                </div>
                <Button variant="secondary">View Details</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Recent Games</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player 1</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Player 2</TableHead>
                <TableHead>Tournament</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => (
                <TableRow key={game.id}>
                  <TableCell className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={game.player1.avatar} alt={game.player1.name} data-ai-hint="person portrait" />
                      <AvatarFallback>{game.player1.name[0]}</AvatarFallback>
                    </Avatar>
                    <span>{game.player1.name}</span>
                    {game.score1 > game.score2 && <Badge variant="default" className="bg-primary/20 text-primary">WIN</Badge>}
                  </TableCell>
                  <TableCell className="font-mono">{`${game.score1} - ${game.score2}`}</TableCell>
                  <TableCell className="flex items-center gap-2">
                     <Avatar className="h-6 w-6">
                      <AvatarImage src={game.player2.avatar} alt={game.player2.name} data-ai-hint="person portrait"/>
                      <AvatarFallback>{game.player2.name[0]}</AvatarFallback>
                    </Avatar>
                    <span>{game.player2.name}</span>
                     {game.score2 > game.score1 && <Badge variant="default" className="bg-primary/20 text-primary">WIN</Badge>}
                  </TableCell>
                  <TableCell>
                      {game.tournamentId ? tournaments.find(t=>t.id === game.tournamentId)?.name : 'Exhibition'}
                  </TableCell>
                  <TableCell className="text-right">{game.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
    </div>
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
            <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg" size="icon">
                <Plus className="h-8 w-8" />
                <span className="sr-only">Log a new game</span>
            </Button>
        </SheetTrigger>
        <SheetContent>
            <SheetHeader>
                <SheetTitle>Log a New Game</SheetTitle>
                <SheetDescription>
                    Enter the details of a recent game to update the leaderboard.
                </SheetDescription>
            </SheetHeader>
            <div className="py-4">
                 <form className="grid grid-cols-1 gap-6" onSubmit={handleLogGame}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Player 1</Label>
                        <Select name="player1" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Player" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((p) => (
                              <SelectItem key={p.id} value={String(p.id)}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Score</Label>
                        <Input name="score1" type="number" placeholder="Games won" required min="0" max="3" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Player 2</Label>
                        <Select name="player2" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Player" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((p) => (
                              <SelectItem key={p.id} value={String(p.id)}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Score</Label>
                        <Input name="score2" type="number" placeholder="Games won" required min="0" max="3"/>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tournament (Optional)</Label>
                      <Select name="tournament">
                        <SelectTrigger>
                          <SelectValue placeholder="Select Tournament" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Exhibition Match</SelectItem>
                          {tournaments.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full">Submit Game</Button>
                </form>
            </div>
        </SheetContent>
    </Sheet>
    </>
  );
}
