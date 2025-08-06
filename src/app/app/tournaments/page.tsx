
'use client';

import { useState } from 'react';
import Image from "next/image";
import { tournaments as initialTournaments } from "@/lib/data";
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
import { Calendar, PlusCircle, Users, GitMerge, Edit, Trash2, UserPlus, UserX, Image as ImageIcon } from "lucide-react";
import type { Tournament, Player } from '@/lib/types';
import { usePlayers } from '@/hooks/use-players';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BracketRound {
    title: string;
    seeds: (Player | null)[][];
}

const generateBracket = (participants: Player[]): BracketRound[] => {
    if (participants.length < 2) return [];

    const bracket: BracketRound[] = [];
    let currentRoundPlayers = [...participants];
    let roundNumber = 1;

    // Pad with byes if not a power of 2
    const idealSize = Math.pow(2, Math.ceil(Math.log2(currentRoundPlayers.length)));
    while (currentRoundPlayers.length < idealSize) {
        currentRoundPlayers.push(null!);
    }
     // Shuffle players for random seeding
    for (let i = currentRoundPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentRoundPlayers[i], currentRoundPlayers[j]] = [currentRoundPlayers[j], currentRoundPlayers[i]];
    }


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
            // For this simulation, we'll just advance the first player of the pair if both exist
            nextRoundPlayers.push(player1);
        }
        
        bracket.push(round);
        // This is a placeholder for advancing logic. 
        currentRoundPlayers = nextRoundPlayers.filter(p => p !== null); 
        roundNumber++;
    }
     if (bracket.length > 0) {
        bracket.push({
            title: 'Winner',
            seeds: [[currentRoundPlayers[0], null]]
        });
    }

    return bracket;
};


export default function TournamentsPage() {
  const { players } = usePlayers();
  const [tournaments, setTournaments] = useState(initialTournaments.map(t => ({...t, enrolledPlayerIds: players.slice(0, t.participants).map(p => p.id)})));
  const [isCreateOrEditOpen, setCreateOrEditOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament & {enrolledPlayerIds: number[]} | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
        setTournaments(tournaments.map(t => t.id === editingTournament.id ? {...t, name, date, imageUrl} : t));
        toast({ title: 'Tournament Updated', description: `${name} has been updated.` });

      } else {
        const newTournament: Tournament & {enrolledPlayerIds: number[]} = {
            id: Math.max(...tournaments.map(t => t.id), 0) + 1,
            name,
            date,
            participants: 0,
            imageUrl,
            enrolledPlayerIds: []
        };
        setTournaments([newTournament, ...tournaments]);
        toast({ title: 'Tournament Created', description: `${name} has been created.` });
      }

      setCreateOrEditOpen(false);
      setEditingTournament(null);
      setCoverImage(null);
  }

  const handleDeleteTournament = (tournamentId: number) => {
    setTournaments(tournaments.filter(t => t.id !== tournamentId));
    toast({ title: 'Tournament Deleted', description: 'The tournament has been removed.' });
  }

  const handleOpenEdit = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setCoverImage(tournament.imageUrl);
    setCreateOrEditOpen(true);
  }

  const handleAddPlayer = (tournamentId: number, playerId: number) => {
     setTournaments(tournaments.map(t => {
        if (t.id === tournamentId && !t.enrolledPlayerIds.includes(playerId)) {
            return {...t, enrolledPlayerIds: [...t.enrolledPlayerIds, playerId], participants: t.participants + 1 };
        }
        return t;
     }));
  }

  const handleRemovePlayer = (tournamentId: number, playerId: number) => {
      setTournaments(tournaments.map(t => {
        if (t.id === tournamentId) {
            return {...t, enrolledPlayerIds: t.enrolledPlayerIds.filter(id => id !== playerId), participants: t.participants -1 };
        }
        return t;
     }));
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
  
  const enrolledPlayers = selectedTournament ? players.filter(p => selectedTournament.enrolledPlayerIds.includes(p.id)) : [];
  const availablePlayers = selectedTournament ? players.filter(p => !selectedTournament.enrolledPlayerIds.includes(p.id)) : [];
  const bracket = selectedTournament ? generateBracket(enrolledPlayers) : [];

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
                  <Calendar className="h-4 w-4" /> {tournament.date}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> {tournament.participants} participants
                </span>
              </CardDescription>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Dialog>
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
                                <Select onValueChange={(playerId) => handleAddPlayer(selectedTournament!.id, parseInt(playerId))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Add Player" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availablePlayers.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
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
                                <div className="flex space-x-8 p-4">
                                {bracket.map((round, roundIndex) => (
                                    <div key={roundIndex} className="flex flex-col space-y-4">
                                    <h3 className="font-bold text-center">{round.title}</h3>
                                    <div className="flex flex-col justify-around min-h-full space-y-16">
                                        {round.seeds.map((match, matchIndex) => (
                                        <div key={matchIndex} className="relative">
                                            <div className="flex flex-col space-y-2">
                                                <div className="border p-2 rounded-md bg-muted/50 w-48 text-sm">{match[0]?.name ?? 'BYE'}</div>
                                                <div className="border p-2 rounded-md bg-muted/50 w-48 text-sm">{match[1]?.name ?? (match[0] ? 'BYE' : 'TBD')}</div>
                                            </div>
                                             {roundIndex < bracket.length - 2 && (
                                                <div className="absolute top-1/2 -right-10 h-[calc(100%_+_4rem)] w-10 border-r border-b border-border -translate-y-[calc(50%_-_(50%_/_2)_*_${matchIndex%2 === 0 ? 1 : -1})]" />
                                            )}
                                             {roundIndex === bracket.length - 2 && (
                                                 <div className="absolute top-1/2 -right-10 h-px w-10 bg-border -translate-y-1/2"></div>
                                             )}
                                        </div>
                                        ))}
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
    </div>
  );
}
