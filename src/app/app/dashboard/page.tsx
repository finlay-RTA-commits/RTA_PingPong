
"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Trophy, Calendar, Plus, ArrowRight, Hourglass } from "lucide-react";
import type { Player, Game, Tournament } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { usePlayers } from '@/hooks/use-players';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { collection, onSnapshot, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { OnboardingModal } from '@/components/onboarding-modal';

function DashboardPageContent() {
  const { players, updatePlayerStats } = usePlayers();
  const [games, setGames] = useState<Game[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const isNewUser = searchParams.get('new_user') === 'true';
    if (isNewUser) {
      setShowOnboarding(true);
    }
  }, [searchParams]);

  const handleOnboardingFinish = () => {
    setShowOnboarding(false);
    // Clean the URL
    window.history.replaceState({}, document.title, window.location.pathname);
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch recent games
    const gamesQuery = query(collection(db, "games"), orderBy("date", "desc"), limit(5));
    const gamesUnsubscribe = onSnapshot(gamesQuery, (snapshot) => {
      const gamesData: Game[] = [];
      snapshot.forEach(doc => {
          const data = doc.data();
          const player1 = players.find(p => p.id === data.player1Id);
          const player2 = players.find(p => p.id === data.player2Id);
          if (player1 && player2) {
            gamesData.push({ 
                id: doc.id, 
                ...data,
                player1,
                player2
            } as Game);
          }
      });
      setGames(gamesData);
    });

    // Fetch upcoming tournaments
    const tournamentsQuery = query(collection(db, "tournaments"), orderBy("date", "asc"), limit(2));
    const tournamentsUnsubscribe = onSnapshot(tournamentsQuery, (snapshot) => {
        const tournamentsData: Tournament[] = [];
        snapshot.forEach(doc => tournamentsData.push({ id: doc.id, ...doc.data() } as Tournament));
        setTournaments(tournamentsData);
    });

    return () => {
      gamesUnsubscribe();
      tournamentsUnsubscribe();
    };
  }, [players]);

  const handleLogGame = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const player1Id = formData.get('player1') as string;
    const player2Id = formData.get('player2') as string;
    const score1 = parseInt(formData.get('score1') as string, 10);
    const score2 = parseInt(formData.get('score2') as string, 10);
    const tournamentIdStr = formData.get('tournament') as string;
    const tournamentId = tournamentIdStr && tournamentIdStr !== 'exhibition' ? tournamentIdStr : null;

    if (!player1Id || !player2Id || isNaN(score1) || isNaN(score2)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields correctly.' });
      return;
    }
    
    if (player1Id === player2Id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Players cannot play against themselves.' });
        return;
    }

    const player1 = players.find(p => p.id === player1Id);
    const player2 = players.find(p => p.id === player2Id);

    if (!player1 || !player2) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not find selected players.' });
      return;
    }

    await updatePlayerStats(player1Id, player2Id, score1, score2, tournamentId);
    
    const newGame = {
      player1Id,
      player2Id,
      score1,
      score2,
      date: new Date().toISOString(),
      tournamentId: tournamentId
    };
    
    await addDoc(collection(db, 'games'), newGame);
    
    setIsSheetOpen(false);

    toast({ title: 'Game Logged', description: `${player1.name} vs ${player2.name} has been recorded.` });
  };
  
  const getCountdown = (date: string) => {
      const tournamentDate = new Date(date);
      const diff = tournamentDate.getTime() - currentTime.getTime();

      if (diff <= 0) {
          return <span className="text-primary font-semibold">In Progress</span>;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));

      return <span className="font-semibold text-accent">{hours} hours to go</span>;
  }


  return (
    <>
    <OnboardingModal open={showOnboarding} onOpenChange={setShowOnboarding} onFinish={handleOnboardingFinish} />
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="text-primary" />
            Leaderboard
          </CardTitle>
          <CardDescription>Top 5 players by wins.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Wins</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.slice(0, 5).map((player, index) => {
                const rank = index + 1;
                return (
                <TableRow key={player.id}>
                  <TableCell className="text-center font-bold text-lg">
                     {rank === 1 ? (
                      <span className="inline-block -rotate-[35deg]">👑</span>
                    ) : rank === 2 ? (
                      <span>🥈</span>
                    ) : rank === 3 ? (
                      <span>🥉</span>
                    ) : (
                      rank
                    )}
                  </TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell>{player.wins}</TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <Button asChild variant="outline" className="w-full">
                <Link href="/app/leaderboard">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
      </Card>
      
       <Card className="lg:col-span-2 flex flex-col">
        <CardHeader>
          <CardTitle>Upcoming Tournaments</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-4">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <h3 className="font-semibold">{tournament.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(tournament.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Hourglass className="h-4 w-4" />
                        {getCountdown(tournament.date)}
                    </p>
                </div>
                <Button variant="secondary" asChild><Link href="/app/tournaments">View Details</Link></Button>
              </div>
            ))}
          </div>
        </CardContent>
         <CardFooter>
            <Button asChild variant="outline" className="w-full">
                <Link href="/app/tournaments">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
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
                      {game.tournamentId ? (tournaments.find(t => t.id === game.tournamentId)?.name || 'Tournament Game') : 'Exhibition'}
                  </TableCell>
                  <TableCell className="text-right">{new Date(game.date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
    </div>
    <TooltipProvider>
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <Tooltip>
            <SheetTrigger asChild>
                <TooltipTrigger asChild>
                    <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg" size="icon">
                        <Plus className="h-8 w-8" />
                        <span className="sr-only">Log a new game</span>
                    </Button>
                </TooltipTrigger>
            </SheetTrigger>
             <TooltipContent side="left">
                <p>Log a new game</p>
            </TooltipContent>
        </Tooltip>
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
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Sets Won</Label>
                        <Select name="score1" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select score" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">0</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                            </SelectContent>
                        </Select>
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
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Sets Won</Label>
                        <Select name="score2" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select score" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">0</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                            </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tournament (Optional)</Label>
                      <Select name="tournament">
                        <SelectTrigger>
                          <SelectValue placeholder="Select Tournament" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exhibition">Exhibition Match</SelectItem>
                          {tournaments.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
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
    </TooltipProvider>
    </>
  );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardPageContent />
        </Suspense>
    )
}
