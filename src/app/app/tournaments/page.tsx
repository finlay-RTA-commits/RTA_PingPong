
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, PlusCircle, Users, GitMerge, Edit, Trash2, UserX, Hourglass } from "lucide-react";
import type { Tournament, Player, Game } from '@/lib/types';
import { usePlayers } from '@/hooks/use-players';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type BracketPlayer = Player | { name: 'BYE' } | { name: 'TBD' } | null;

interface Match {
  p1: BracketPlayer;
  p2: BracketPlayer;
  winner: BracketPlayer;
}
interface BracketRound {
    title: string;
    matches: Match[];
}

const generateBracket = (participants: Player[], games: Game[], tournamentId: string): BracketRound[] => {
    if (participants.length < 2) return [];

    const findWinner = (p1: BracketPlayer, p2: BracketPlayer): BracketPlayer | null => {
        if (!p1 || !p2 || !('id' in p1) || !('id' in p2)) return null;
        
        const game = games.find(g =>
            g.tournamentId === tournamentId &&
            ((g.player1Id === p1.id && g.player2Id === p2.id) || (g.player1Id === p2.id && g.player2Id === p1.id))
        );

        if (!game) return null;
        
        const winnerId = game.score1 > game.score2 ? game.player1Id : game.player2Id;
        return participants.find(p => p.id === winnerId) || null;
    };

    // 1. Determine bracket size and add BYEs
    let idealSize = 2;
    while (idealSize < participants.length) {
        idealSize *= 2;
    }
    const byes = idealSize - participants.length;
    
    // Seed players and add BYEs
    const seededPlayers: BracketPlayer[] = [...participants].sort(() => Math.random() - 0.5);
    for (let i = 0; i < byes; i++) {
        // Distribute BYEs by adding them to the end of the list.
        seededPlayers.push({ name: 'BYE' });
    }

    // 2. Build Round 1
    const rounds: BracketRound[] = [];
    const round1: BracketRound = { title: 'Round 1', matches: [] };
    for (let i = 0; i < seededPlayers.length; i += 2) {
        const p1 = seededPlayers[i];
        const p2 = seededPlayers[i+1];
        let winner: BracketPlayer = null;

        if (p1?.name === 'BYE') winner = p2;
        else if (p2?.name === 'BYE') winner = p1;
        else winner = findWinner(p1, p2);
        
        round1.matches.push({ p1, p2, winner });
    }
    rounds.push(round1);

    // 3. Build subsequent rounds based on the potential structure
    let previousRound = round1;
    while (previousRound.matches.length > 1) {
        const currentRoundMatches: Match[] = [];
        for (let i = 0; i < previousRound.matches.length; i += 2) {
            const match1 = previousRound.matches[i];
            const match2 = previousRound.matches[i + 1];

            const p1 = match1.winner;
            const p2 = match2.winner;

            const winner = findWinner(p1, p2);

            currentRoundMatches.push({
                p1: p1 || { name: 'TBD' },
                p2: p2 || { name: 'TBD' },
                winner: winner
            });
        }
        
        const roundTitle = 
            currentRoundMatches.length === 1 ? "Final" :
            currentRoundMatches.length === 2 ? "Semi-Finals" :
            currentRoundMatches.length === 4 ? "Quarter-Finals" :
            `Round ${rounds.length + 1}`;
            
        const currentRound = { title: roundTitle, matches: currentRoundMatches };
        rounds.push(currentRound);
        previousRound = currentRound;
    }

    // 4. Add a final "Winner" round if the final match has a winner
    const finalMatch = rounds[rounds.length - 1]?.matches[0];
    if (finalMatch && finalMatch.winner) {
        rounds.push({
            title: 'Winner',
            matches: [{ p1: finalMatch.winner, p2: null, winner: finalMatch.winner }]
        });
    }

    return rounds;
};

export default function TournamentsPage() {
  const { players } = usePlayers();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentGames, setTournamentGames] = useState<Game[]>([]);
  const [isCreateOrEditOpen, setCreateOrEditOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [playerToAdd, setPlayerToAdd] = useState<string>("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();
  
  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "tournaments"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const tournamentsData: Tournament[] = [];
        snapshot.forEach(doc => tournamentsData.push({ id: doc.id, ...doc.data() } as Tournament));
        setTournaments(tournamentsData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching tournaments:", error);
        toast({variant: 'destructive', title: 'Error', description: 'Could not fetch tournaments.'});
        setLoading(false);
    });
    
    const gamesUnsubscribe = onSnapshot(collection(db, "games"), (snapshot) => {
        const gamesData: Game[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.tournamentId) {
                gamesData.push({ id: doc.id, ...data } as Game);
            }
        });
        setTournamentGames(gamesData);
    });


    return () => {
        unsubscribe();
        gamesUnsubscribe();
    }
  }, [toast]);
  
  useEffect(() => {
    if (selectedTournament) {
        const updatedTournament = tournaments.find(t => t.id === selectedTournament.id);
        if (updatedTournament) {
            setSelectedTournament(updatedTournament);
        }
    }
  }, [tournaments, selectedTournament]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const name = formData.get('name') as string;
      const date = formData.get('date') as string;
      const imageUrl = coverImage || 'https://placehold.co/600x400.png';
      
      if(!name || !date) {
        toast({variant: 'destructive', title: 'Error', description: 'Please fill out all fields.'});
        return;
      }
      
      if (editingTournament) {
        const tournamentDoc = doc(db, "tournaments", editingTournament.id);
        await updateDoc(tournamentDoc, { name, date, imageUrl });
        toast({ title: 'Tournament Updated', description: `${name} has been updated.` });
      } else {
        await addDoc(collection(db, "tournaments"), {
            name,
            date,
            imageUrl,
            participants: 0,
            enrolledPlayerIds: []
        });
        toast({ title: 'Tournament Created', description: `${name} has been created.` });
      }

      setCreateOrEditOpen(false);
      setEditingTournament(null);
      setCoverImage(null);
  }

  const handleDeleteTournament = async (tournamentId: string) => {
    await deleteDoc(doc(db, "tournaments", tournamentId));
    toast({ title: 'Tournament Deleted', description: 'The tournament has been removed.' });
  }

  const handleOpenEdit = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setCoverImage(tournament.imageUrl);
    setCreateOrEditOpen(true);
  }

  const updateTournamentPlayers = async (tournamentId: string, newPlayerIds: string[]) => {
      const tournamentDoc = doc(db, "tournaments", tournamentId);
      await updateDoc(tournamentDoc, { enrolledPlayerIds: newPlayerIds, participants: newPlayerIds.length });
  }

  const handleAddPlayer = (tournamentId: string, playerId: string) => {
     if (!playerId) return;
     const tournament = tournaments.find(t => t.id === tournamentId);
     if (tournament && !tournament.enrolledPlayerIds.includes(playerId)) {
         const newPlayerIds = [...tournament.enrolledPlayerIds, playerId];
         updateTournamentPlayers(tournamentId, newPlayerIds);
         setPlayerToAdd(""); // Reset the select
     }
  }

  const handleRemovePlayer = (tournamentId: string, playerId: string) => {
     const tournament = tournaments.find(t => t.id === tournamentId);
     if (tournament) {
         const newPlayerIds = tournament.enrolledPlayerIds.filter(id => id !== playerId);
         updateTournamentPlayers(tournamentId, newPlayerIds);
     }
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setCoverImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    } else {
        toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please upload a JPG or PNG image.',
        });
    }
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
  
  const isDisqualified = (tournamentDate: string) => {
      const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
      const tournamentStartDate = new Date(tournamentDate).getTime();
      const now = new Date().getTime();
      return now - tournamentStartDate > THREE_DAYS;
  }

  const enrolledPlayers = useMemo(() => selectedTournament ? players.filter(p => selectedTournament.enrolledPlayerIds.includes(p.id)) : [], [players, selectedTournament]);
  const availablePlayers = useMemo(() => selectedTournament ? players.filter(p => !selectedTournament.enrolledPlayerIds.includes(p.id)) : [], [players, selectedTournament]);
  const bracket = useMemo(() => {
    if (!selectedTournament) return [];
    const tournamentSpecificGames = tournamentGames.filter(g => g.tournamentId === selectedTournament.id);
    return generateBracket(enrolledPlayers, tournamentSpecificGames, selectedTournament.id);
  }, [selectedTournament, enrolledPlayers, tournamentGames]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tournaments</h1>
          <p className="text-muted-foreground">
            Browse and manage all official RTA PingPong tournaments.
          </p>
        </div>
        <Dialog open={isCreateOrEditOpen} onOpenChange={(isOpen) => {
            setCreateOrEditOpen(isOpen);
            if (!isOpen) {
                setEditingTournament(null);
                setCoverImage(null);
            }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setCreateOrEditOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Tournament
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleFormSubmit}>
              <DialogHeader>
                <DialogTitle>{editingTournament ? 'Edit Tournament' : 'Create New Tournament'}</DialogTitle>
                <DialogDescription>
                  {editingTournament ? 'Update the details for this tournament.' : 'Fill in the details below to set up a new tournament.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tournament Name</Label>
                  <Input id="name" name="name" placeholder="e.g., Summer Slam 2024" required defaultValue={editingTournament?.name}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Start Date</Label>
                  <Input id="date" name="date" type="date" required defaultValue={editingTournament?.date}/>
                </div>
                 <div className="space-y-2">
                  <Label>Cover Image</Label>
                  {coverImage && <Image src={coverImage} alt="Cover image preview" width={200} height={100} className="rounded-md object-cover" />}
                   <Input id="imageUrl" name="imageUrl" type="file" accept="image/png, image/jpeg" onChange={handleCoverImageChange} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                   <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">{editingTournament ? 'Save Changes' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
                <CardHeader className="p-0">
                    <Skeleton className="aspect-video w-full rounded-t-lg" />
                </CardHeader>
                <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                    <Skeleton className="mt-1 h-4 w-1/3" />
                </CardContent>
                <CardFooter className="p-4 pt-0">
                    <Skeleton className="h-10 w-full" />
                </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
            <Card key={tournament.id} className="flex flex-col">
                <CardHeader className="p-0">
                <div className="aspect-video overflow-hidden rounded-t-lg border-b relative">
                    <Image
                    src={tournament.imageUrl}
                    alt={tournament.name}
                    width={600}
                    height={400}
                    className="h-full w-full object-cover"
                    data-ai-hint="ping pong"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleOpenEdit(tournament)}>
                            <Edit className="h-4 w-4"/>
                            <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button size="icon" variant="destructive" className="h-8 w-8">
                                    <Trash2 className="h-4 w-4"/>
                                    <span className="sr-only">Delete</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the tournament.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTournament(tournament.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                </CardHeader>
                <CardContent className="flex-grow p-4">
                <CardTitle>{tournament.name}</CardTitle>
                <CardDescription className="mt-2 flex flex-col gap-2">
                    <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> {new Date(tournament.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> {tournament.participants} participants
                    </span>
                     <span className="flex items-center gap-2">
                        <Hourglass className="h-4 w-4" />
                        {getCountdown(tournament.date)}
                    </span>
                </CardDescription>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedTournament(null)}>
                    <DialogTrigger asChild>
                    <Button className="w-full" variant="secondary" onClick={() => setSelectedTournament(tournaments.find(t=>t.id === tournament.id) ?? null)}>View Bracket</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-7xl grid-rows-[auto_1fr] h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>{selectedTournament?.name}</DialogTitle>
                            <DialogDescription>A visual bracket of the tournament progress and player management.</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 overflow-hidden h-full">
                        <div className="flex flex-col gap-4 border-r pr-6">
                            <h3 className="font-semibold text-lg">Participants ({enrolledPlayers.length})</h3>
                            <div className="flex gap-2">
                                    <Select value={playerToAdd} onValueChange={(playerId) => handleAddPlayer(selectedTournament!.id, playerId)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Add Player" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availablePlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="space-y-2">
                                    {enrolledPlayers.map(player => (
                                        <div key={player.id} className="flex items-center justify-between rounded-md border p-2">
                                            <span>{player.name}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleRemovePlayer(selectedTournament!.id, player.id)}>
                                                <UserX className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                            {bracket.length > 0 ? (
                                <ScrollArea className="h-full">
                                    <div className="relative flex p-4" style={{'--round-gap': '5rem', '--match-gap': '4rem'} as React.CSSProperties}>
                                    {bracket.map((round, roundIndex) => (
                                        <div key={roundIndex} className="flex flex-col justify-around" style={{ marginRight: 'var(--round-gap)' }}>
                                            <h3 className="font-bold text-center mb-4 text-lg">{round.title}</h3>
                                            <div className="flex flex-col justify-around flex-1">
                                                {round.matches.map((match, matchIndex) => {
                                                     const isWinnerRound = roundIndex === bracket.length - 1 && round.matches.length === 1 && match.p2 === null;
                                                     const p1IsWinner = match.winner && match.p1 && 'id' in match.p1 && 'id' in match.winner && match.winner.id === match.p1.id;
                                                     const p2IsWinner = match.winner && match.p2 && 'id' in match.p2 && 'id' in match.winner && match.winner.id === match.p2.id;
                                                     

                                                    return (
                                                        <div key={matchIndex} className="relative flex flex-col justify-center">
                                                            <div className="flex flex-col space-y-2 z-10">
                                                                <div className={cn("border p-2 rounded-md bg-muted/50 w-48 text-sm", p1IsWinner && 'font-bold border-primary', match.p1?.name === 'BYE' && 'opacity-0' )}>{match.p1?.name ?? 'TBD'}</div>
                                                                {!isWinnerRound && <div className={cn("border p-2 rounded-md bg-muted/50 w-48 text-sm", p2IsWinner && 'font-bold border-primary', match.p2?.name === 'BYE' && 'opacity-0')}>{match.p2?.name ?? 'TBD'}</div>}
                                                            </div>
                                                          
                                                            {/* Connectors */}
                                                            {!isWinnerRound && roundIndex < bracket.length - 1 && (
                                                                <>
                                                                    {/* Line from match to the horizontal connector */}
                                                                    <div className="absolute left-full top-1/2 -translate-y-1/2 h-px w-[calc(var(--round-gap)/2)] bg-border"></div>

                                                                    {/* Vertical line connecting to the next match's horizontal line */}
                                                                    {matchIndex % 2 === 0 && (
                                                                        <div
                                                                            className="absolute left-[calc(100%_+_calc(var(--round-gap)/2))] top-1/2 w-px bg-border"
                                                                            style={{ height: `calc(100% + ${Math.pow(2, roundIndex)} * 2.25rem + ${Math.pow(2, roundIndex-1)}rem)` }}
                                                                        ></div>
                                                                    )}
                                                                      {/* Horizontal line connecting the vertical line to the next round's match */}
                                                                    {matchIndex % 2 === 0 && (
                                                                        <div
                                                                            className="absolute left-[calc(100%_+_calc(var(--round-gap)/2))] bg-border h-px"
                                                                            style={{
                                                                                width: `calc(var(--round-gap)/2)`,
                                                                                top: `calc(50% + (100% + ${Math.pow(2, roundIndex)} * 2.25rem + ${Math.pow(2, roundIndex-1)}rem) / 2)`
                                                                            }}
                                                                        ></div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                 </ScrollArea>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50 h-full">
                                    <GitMerge className="h-12 w-12 text-muted-foreground" />
                                    <p className="mt-4 text-muted-foreground">Add at least 2 players to generate a bracket.</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
                </CardFooter>
            </Card>
            ))}
        </div>
      )}
    </div>
  );
}

