
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
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, PlusCircle, Users, GitMerge, Edit, Trash2, UserX, Hourglass, Trophy } from "lucide-react";
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
    winner: BracketPlayer | null;
}

interface BracketRound {
    title: string;
    matches: Match[];
}

const generateBracket = (participants: Player[], games: Game[], tournamentId: string): BracketRound[] => {
    if (participants.length < 2) return [];

    let idealSize = 2;
    while (idealSize < participants.length) {
        idealSize *= 2;
    }

    const seededPlayers: BracketPlayer[] = [...participants];
    // Simple seeding for now, can be replaced with actual seeding logic
    for (let i = seededPlayers.length; i < idealSize; i++) {
        seededPlayers.push({ name: 'BYE' });
    }

    const rounds: BracketRound[] = [];
    let currentRoundPlayers = seededPlayers;
    let roundNum = 1;

    // --- Function to find the winner of a match ---
    const findWinner = (p1: BracketPlayer, p2: BracketPlayer): BracketPlayer | null => {
        if (!p1 || !p2) return null;
        if (p1.name === 'BYE') return p2;
        if (p2.name === 'BYE') return p1;
        if (p1.name === 'TBD' || p2.name === 'TBD') return null;

        if ('id' in p1 && 'id' in p2) {
            const game = games.find(g =>
                g.tournamentId === tournamentId &&
                (
                  (g.player1Id === p1.id && g.player2Id === p2.id) ||
                  (g.player1Id === p2.id && g.player2Id === p1.id)
                )
            );
            if (game) {
                const winnerId = game.score1 > game.score2 ? game.player1Id : game.player2Id;
                return participants.find(p => p.id === winnerId) || null;
            }
        }
        return null; // No game found
    };
    
    // --- Build all rounds structure first ---
    let roundsCount = Math.log2(idealSize);
    if(idealSize === 2) roundsCount = 1;

    let previousRoundMatches: Match[] = [];
    
    for (let i = 0; i < roundsCount; i++) {
        const roundTitle =
            (idealSize / Math.pow(2, i)) === 2 ? 'Final'
            : (idealSize / Math.pow(2, i)) === 4 ? 'Semi-Finals'
            : `Round ${i + 1}`;

        const currentRound: BracketRound = { title: roundTitle, matches: [] };
        
        if (i === 0) { // First round from seeded players
            for (let j = 0; j < seededPlayers.length; j += 2) {
                const p1 = seededPlayers[j];
                const p2 = seededPlayers[j+1];
                currentRound.matches.push({ p1, p2, winner: findWinner(p1, p2) });
            }
        } else { // Subsequent rounds
            for (let j = 0; j < previousRoundMatches.length; j += 2) {
                const match1 = previousRoundMatches[j];
                const match2 = previousRoundMatches[j+1];
                const p1 = match1.winner || { name: 'TBD' };
                const p2 = match2.winner || { name: 'TBD' };
                currentRound.matches.push({ p1, p2, winner: findWinner(p1, p2) });
            }
        }
        
        rounds.push(currentRound);
        previousRoundMatches = currentRound.matches;
    }
    
    const finalMatch = rounds[rounds.length - 1]?.matches[0];
    if (finalMatch && finalMatch.winner) {
        rounds.push({
            title: 'Winner',
            matches: [{ p1: finalMatch.winner, p2: null, winner: finalMatch.winner }]
        });
    }

    return rounds;
};

const PlayerBox = ({ player, isWinner }: { player: BracketPlayer, isWinner: boolean }) => {
    const name = player?.name ?? 'TBD';
    return (
        <div className={cn(
            "border p-2 rounded-md bg-muted/50 text-sm w-48 text-foreground",
            isWinner && "font-bold border-primary text-primary"
        )}>
            {name}
        </div>
    );
};

const MatchComponent = ({ match }: { match: Match }) => {
    const isP1Winner = match.winner && 'id' in match.winner && match.p1 && 'id' in match.p1 && match.winner.id === match.p1.id;
    const isP2Winner = match.winner && 'id' in match.winner && match.p2 && 'id' in match.p2 && match.winner.id === match.p2.id;
    
    return (
        <div className="flex flex-col justify-center relative">
            <div className="space-y-2">
                <PlayerBox player={match.p1} isWinner={!!isP1Winner} />
                <PlayerBox player={match.p2} isWinner={!!isP2Winner} />
            </div>
            {/* Connector Lines */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 h-[calc(50%+1rem)] w-6 border-r border-b border-border"></div>
            <div className="absolute left-full top-1/2 h-px w-6 bg-border"></div>
        </div>
    );
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
    }, 60000);

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
         setPlayerToAdd(""); 
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
  
  const enrolledPlayers = useMemo(() => selectedTournament ? players.filter(p => selectedTournament.enrolledPlayerIds.includes(p.id)) : [], [players, selectedTournament]);
  const availablePlayers = useMemo(() => selectedTournament ? players.filter(p => !selectedTournament.enrolledPlayerIds.includes(p.id)) : [], [players, selectedTournament]);
  const bracketRounds = useMemo(() => {
    if (!selectedTournament || enrolledPlayers.length < 2) return [];
    const tournamentSpecificGames = tournamentGames.filter(g => g.tournamentId === selectedTournament.id);
    return generateBracket(enrolledPlayers, tournamentSpecificGames, selectedTournament.id);
  }, [selectedTournament, enrolledPlayers, tournamentGames]);
  
  const winner = bracketRounds.find(r => r.title === 'Winner')?.matches[0]?.winner;

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
            if (!isOpen) {
                setEditingTournament(null);
                setCoverImage(null);
            }
            setCreateOrEditOpen(isOpen);
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
                           {bracketRounds.length > 0 ? (
                                <ScrollArea className="h-full">
                                    <div className="flex items-start p-4 space-x-8">
                                        {bracketRounds.map((round, roundIndex) => (
                                            <div key={roundIndex} className="flex flex-col items-center space-y-4">
                                                <h3 className="font-bold text-lg text-center mb-4 min-h-8">{round.title !== 'Winner' ? round.title : ''}</h3>
                                                <div className="flex flex-col justify-around flex-1 space-y-10">
                                                    {round.title === 'Winner' && round.matches[0].winner ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Trophy className="w-10 h-10 text-amber-400"/>
                                                            <PlayerBox player={round.matches[0].winner} isWinner={true} />
                                                        </div>
                                                    ) : (
                                                        round.matches.map((match, matchIndex) => (
                                                          <div key={matchIndex} className="relative">
                                                            <MatchComponent match={match} />
                                                          </div>
                                                        ))
                                                    )}
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

    