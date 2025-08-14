'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, PlusCircle, Users, GitMerge, Edit, Trash2, UserX, Hourglass, Trophy, Lock, Swords } from "lucide-react";
import type { Tournament, Player, Game } from '@/lib/types';
import { usePlayers } from '@/hooks/use-players';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/* ----------------------------- types ----------------------------- */

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

/* ----------------------------- helpers ----------------------------- */

const nextPow2 = (n: number) => { let p = 1; while (p < n) p <<= 1; return p; };

const stableSeedOrder = (players: Player[]) =>
  [...players].sort((a, b) =>
    (b.stats?.elo ?? 1000) - (a.stats?.elo ?? 1000) ||
    a.name.localeCompare(b.name) ||
    a.id.localeCompare(b.id)
  ).map(p => p.id);

const clampSeedIdsToSize = (seedIds: string[], size: number) => {
  const out = seedIds.slice(0, size);
  while (out.length < size) out.push('BYE');
  return out;
};

const replaceInArray = <T,>(arr: T[], predicate: (v: T, i: number) => boolean, replacer: (v: T, i: number) => T): T[] => {
  let replaced = false;
  return arr.map((v, i) => {
    if (!replaced && predicate(v, i)) { replaced = true; return replacer(v, i); }
    return v;
  });
};

/* -------------------------- bracket generator -------------------------- */

const generateBracketFromSeedsAndPlayIns = (
  initialSeeds: BracketPlayer[], // already padded to bracketSize (locked) or padded for preview (unlocked)
  playInSeeds: BracketPlayer[],  // late joiners after lock
  games: Game[],
  tournamentId: string,
  playersById: Map<string, Player>
): BracketRound[] => {
  const makeSeededPairs = (seeds: BracketPlayer[]) => {
    const pairs: BracketPlayer[] = [];
    const mid = seeds.length / 2;
    for (let i = 0; i < mid; i++) {
      pairs.push(seeds[i]);
      pairs.push(seeds[seeds.length - 1 - i]);
    }
    return pairs;
  };

  const makePlayInPairs = (late: BracketPlayer[]) => {
    const pairs: BracketPlayer[] = [];
    for (let i = 0; i < late.length; i += 2) {
      const a = late[i];
      const b = late[i + 1] ?? ({ name: 'TBD' } as const);
      pairs.push(a, b);
    }
    return pairs;
  };

  const seededRound1 = makeSeededPairs(initialSeeds);
  const playInRound1 = makePlayInPairs(playInSeeds);

  const findWinner = (p1: BracketPlayer, p2: BracketPlayer): BracketPlayer | null => {
    if (!p1 || !p2) return null;
    if ('name' in p1 && p1.name === 'BYE') return p2;
    if ('name' in p2 && p2.name === 'BYE') return p1;
    if ('name' in p1 && p1.name === 'TBD') return null;
    if ('name' in p2 && p2.name === 'TBD') return null;

    if ('id' in p1 && 'id' in p2) {
      const played = games.filter(g =>
        g.tournamentId === tournamentId &&
        ((g.player1Id === p1.id && g.player2Id === p2.id) ||
         (g.player1Id === p2.id && g.player2Id === p1.id))
      );
      if (played.length) {
        // If you track timestamps, sort by latest here.
        const g = played[0];
        const winnerId = g.score1 > g.score2 ? g.player1Id : g.player2Id;
        return playersById.get(winnerId) ?? null;
      }
    }
    return null;
  };

  const rounds: BracketRound[] = [];
  const round1: BracketRound = { title: 'Round 1', matches: [] };

  // Fixed seeded Round-1 first
  for (let i = 0; i < seededRound1.length; i += 2) {
    const p1 = seededRound1[i];
    const p2 = seededRound1[i + 1];
    round1.matches.push({ p1, p2, winner: findWinner(p1, p2) });
  }
  // Then appended play-ins (additional Round-1s)
  for (let i = 0; i < playInRound1.length; i += 2) {
    const p1 = playInRound1[i];
    const p2 = playInRound1[i + 1];
    round1.matches.push({ p1, p2, winner: findWinner(p1, p2) });
  }

  rounds.push(round1);

  // Advance winners: fixed seeded winners first, then play-ins winners
  const seededWinners = round1.matches.slice(0, seededRound1.length / 2).map(m => m.winner);
  const playInWinners = round1.matches.slice(seededRound1.length / 2).map(m => m.winner);
  let advancing = [...seededWinners, ...playInWinners];

  // Pad advancing to next power-of-two for Round 2+
  const target = nextPow2(Math.max(1, advancing.filter(Boolean).length));
  while (advancing.length < target) advancing.push({ name: 'BYE' });

  let lastWinners: (BracketPlayer | null)[] = advancing;
  while (lastWinners.length > 1) {
    const next: BracketRound = { title: `Round ${rounds.length + 1}`, matches: [] };
    for (let i = 0; i < lastWinners.length; i += 2) {
      const p1 = lastWinners[i] ?? { name: 'TBD' };
      const p2 = lastWinners[i + 1] ?? { name: 'TBD' };
      next.matches.push({ p1, p2, winner: findWinner(p1, p2) });
    }
    if (next.matches.length === 1) next.title = 'Final';
    else if (next.matches.length === 2) next.title = 'Semi-Finals';
    else if (next.matches.length === 4) next.title = 'Quarter-Finals';

    rounds.push(next);
    lastWinners = next.matches.map(m => m.winner);
  }

  const finalMatch = rounds.find(r => r.matches.length === 1);
  if (finalMatch?.matches[0]?.winner) {
    rounds.push({
      title: 'Winner',
      matches: [{ p1: finalMatch.matches[0].winner, p2: null, winner: finalMatch.matches[0].winner }]
    });
  }

  return rounds;
};

/* ----------------------------- UI atoms ----------------------------- */

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
    {children}
  </span>
);

const PlayerBox = ({ player }: { player: BracketPlayer }) => {
  const name = player?.name ?? 'TBD';
  const isBye = name === 'BYE';
  return (
    <div className={cn(
      "bg-card text-card-foreground px-3 py-1.5 text-sm truncate",
      isBye && 'text-muted-foreground italic'
    )}>
      {name}
    </div>
  );
};

const MatchBox = ({ match }: { match: Match }) => {
  if (!match.p2) {
    // Winner display
    return (
      <div className="flex flex-col items-center">
        <Trophy className="w-10 h-10 text-amber-400 mb-2"/>
        <div className="border border-amber-400 rounded-md shadow-lg">
          <PlayerBox player={match.p1} />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col border border-border rounded-md shadow-sm bg-background">
      <PlayerBox player={match.p1} />
      <div className="border-t border-border">
        <PlayerBox player={match.p2} />
      </div>
    </div>
  );
};

/* ------------------------------ page ------------------------------ */

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

  /* Keep time fresh for the countdown */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  /* Subscribe to games first so auto-lock can see existing games */
  useEffect(() => {
    const gamesUnsubscribe = onSnapshot(collection(db, "games"), (snapshot) => {
      const gamesData: Game[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.tournamentId) gamesData.push({ id: docSnap.id, ...data } as Game);
      });
      setTournamentGames(gamesData);
    });
    return () => { gamesUnsubscribe(); };
  }, []);

  /* Subscribe to tournaments + auto-heal + auto-lock */
  useEffect(() => {
    const q = query(collection(db, "tournaments"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const tournamentsData: Tournament[] = [];
      const updates: Promise<any>[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Tournament;
        const id = docSnap.id;
        tournamentsData.push({ id, ...data });

        // --- Auto-heal: ensure fields exist
        const patch: Partial<Tournament> = {};
        if (typeof data.locked !== 'boolean') patch.locked = false;
        if (!Array.isArray(data.seedIds)) patch.seedIds = [];
        if (typeof data.bracketSize !== 'number') patch.bracketSize = 0;
        if (!('startedAt' in data)) patch.startedAt = null;
        if (!Array.isArray(data.playInIds)) patch.playInIds = [];

        // --- Auto-lock: if games exist but not locked
        const hasGames = tournamentGames.some(g => g.tournamentId === id);
        if (!data.locked && hasGames) {
          const entrants = (data.enrolledPlayerIds ?? [])
            .map(pid => players.find(p => p.id === pid))
            .filter(Boolean) as Player[];
          if (entrants.length >= 2) {
            const size = nextPow2(entrants.length);
            const ordered = stableSeedOrder(entrants);
            const byes = size - ordered.length;
            const seeds = clampSeedIdsToSize(ordered, size); // ensures exact length
            // add BYEs explicitly:
            for (let i = 0; i < byes; i++) seeds.push('BYE');
            patch.seedIds = seeds.slice(0, size); // exact bracketSize
            patch.bracketSize = size;
            patch.locked = true;
            patch.startedAt = new Date().toISOString();
          }
        }

        if (Object.keys(patch).length > 0) updates.push(updateDoc(doc(db, "tournaments", id), patch));
      });

      if (updates.length > 0) {
        await Promise.all(updates).catch(err => console.error("Error auto-updating tournaments:", err));
      }

      setTournaments(tournamentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tournaments:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch tournaments.' });
      setLoading(false);
    });

    return () => { unsubscribe(); };
  }, [toast, players, tournamentGames]);

  /* Keep selected tournament object fresh */
  useEffect(() => {
    if (selectedTournament) {
      const updated = tournaments.find(t => t.id === selectedTournament.id);
      if (updated) setSelectedTournament(updated);
    }
  }, [tournaments, selectedTournament]);

  /* --------------------- form + CRUD handlers --------------------- */

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
      await updateDoc(doc(db, "tournaments", editingTournament.id), { name, date, imageUrl });
      toast({ title: 'Tournament Updated', description: `${name} has been updated.` });
    } else {
      await addDoc(collection(db, "tournaments"), {
        name, date, imageUrl,
        participants: 0, enrolledPlayerIds: [],
        locked: false, seedIds: [], bracketSize: 0, startedAt: null, playInIds: []
      });
      toast({ title: 'Tournament Created', description: `${name} has been created.` });
    }

    setCreateOrEditOpen(false);
    setEditingTournament(null);
    setCoverImage(null);
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    await deleteDoc(doc(db, "tournaments", tournamentId));
    toast({ title: 'Tournament Deleted', description: 'The tournament has been removed.' });
  };

  const handleOpenEdit = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setCoverImage(tournament.imageUrl);
    setCreateOrEditOpen(true);
  };

  const updateTournamentPlayers = async (tournamentId: string, newPlayerIds: string[], extraPlayInsCount = 0) => {
    await updateDoc(doc(db, "tournaments", tournamentId), {
      enrolledPlayerIds: newPlayerIds,
      participants: newPlayerIds.length + extraPlayInsCount
    });
  };

  // Start & Lock tournament (freeze initial Round-1)
  const startTournament = async (t: Tournament, entrants: Player[]) => {
    const size = nextPow2(entrants.length);
    const ordered = stableSeedOrder(entrants);
    const byes = size - ordered.length;
    const seeds = [...ordered];
    for (let i = 0; i < byes; i++) seeds.push('BYE'); // explicit BYEs
    const seedIds = clampSeedIdsToSize(seeds, size);
    await updateDoc(doc(db, "tournaments", t.id), {
      locked: true,
      startedAt: new Date().toISOString(),
      bracketSize: size,
      seedIds,
    });
    toast({ title: 'Tournament started', description: 'Bracket locked. Late joiners will enter play-ins.' });
  };

  // Add player: pre-lock → entrants, post-lock → play-ins (and update participants)
  const handleAddPlayer = async (tournamentId: string, playerId: string) => {
    if (!playerId) return;
    const t = tournaments.find(x => x.id === tournamentId);
    if (!t) return;

    if (!t.locked) {
      const enrolled = t.enrolledPlayerIds ?? [];
      if (!enrolled.includes(playerId)) {
        const newIds = [...enrolled, playerId];
        await updateTournamentPlayers(tournamentId, newIds, (t.playInIds ?? []).length);
        setPlayerToAdd("");
      }
      return;
    }

    // locked: push into play-ins
    const playInIds = Array.isArray(t.playInIds) ? t.playInIds : [];
    if (playInIds.includes(playerId) || (t.enrolledPlayerIds ?? []).includes(playerId)) {
      toast({ variant: 'destructive', title: 'Already added', description: 'This player is already in the tournament.' });
      return;
    }
    const newPlayIns = [...playInIds, playerId];
    await updateDoc(doc(db, "tournaments", t.id), {
      playInIds: newPlayIns,
      participants: (t.enrolledPlayerIds?.length ?? 0) + newPlayIns.length
    });
    setPlayerToAdd("");
    toast({ title: 'Player added to Play-ins', description: 'A new Round-1 match will appear when paired.' });
  };

  // Remove player:
  // - pre-lock: remove from enrolled
  // - post-lock: replace their id in seedIds with 'BYE' and remove from enrolled for accuracy; update participants
  const handleRemovePlayer = async (tournamentId: string, playerId: string) => {
    const t = tournaments.find(x => x.id === tournamentId);
    if (!t) return;
    const enrolled = t.enrolledPlayerIds ?? [];
    const playIns = t.playInIds ?? [];

    if (!t.locked) {
      const newIds = enrolled.filter(id => id !== playerId);
      await updateTournamentPlayers(tournamentId, newIds, playIns.length);
      return;
    }

    // Locked: replace in seedIds with 'BYE' (only first occurrence)
    const seeds = (t.seedIds ?? []).slice();
    const idx = seeds.findIndex(s => s === playerId);
    if (idx === -1) {
      toast({ variant: 'destructive', title: 'Not removable', description: 'Player is not part of the locked seeds.' });
      return;
    }
    seeds[idx] = 'BYE';

    const newEnrolled = enrolled.filter(id => id !== playerId);
    await updateDoc(doc(db, "tournaments", t.id), {
      seedIds: seeds,
      enrolledPlayerIds: newEnrolled,
      participants: newEnrolled.length + playIns.length
    });
    toast({ title: 'Player removed', description: 'Replaced with a BYE in the locked bracket.' });
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverImage(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a JPG or PNG image.' });
    }
  };

  /* --------------------- computed values --------------------- */

  const getCountdown = (date: string) => {
    const tournamentDate = new Date(date);
    const diff = tournamentDate.getTime() - currentTime.getTime();
    if (diff <= 0) return <span className="text-primary font-semibold">In Progress</span>;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return <span className="font-semibold text-accent">{hours} hours to go</span>;
  };

  const enrolledPlayers = useMemo(
    () => selectedTournament ? players.filter(p => selectedTournament.enrolledPlayerIds?.includes(p.id)) : [],
    [players, selectedTournament]
  );

  const availablePlayers = useMemo(
    () => selectedTournament
      ? players.filter(p =>
          !(selectedTournament.enrolledPlayerIds ?? []).includes(p.id) &&
          !(selectedTournament.playInIds ?? []).includes(p.id)
        )
      : [],
    [players, selectedTournament]
  );

  const bracketRounds = useMemo(() => {
    if (!selectedTournament) return [];

    const tournamentSpecificGames = tournamentGames.filter(g => g.tournamentId === selectedTournament.id);
    const playersById = new Map(players.map(p => [p.id, p]));

    // PREVIEW (unlocked): show what would happen if started now
    if (!selectedTournament.locked) {
      if (enrolledPlayers.length < 2) return [];
      const orderedIds = stableSeedOrder(enrolledPlayers);
      const size = nextPow2(orderedIds.length);
      const seeds: string[] = [...orderedIds];
      for (let i = seeds.length; i < size; i++) seeds.push('BYE'); // pad exactly
      const initialSeeds: BracketPlayer[] = seeds.map(id => id === 'BYE' ? ({ name: 'BYE' } as const) : (playersById.get(id) ?? null));
      return generateBracketFromSeedsAndPlayIns(initialSeeds, [], tournamentSpecificGames, selectedTournament.id, playersById);
    }

    // LOCKED: use frozen seeds exactly as stored (already padded to bracketSize)
    const seedIds = clampSeedIdsToSize(selectedTournament.seedIds ?? [], selectedTournament.bracketSize ?? (selectedTournament.seedIds?.length ?? 0));
    const initialSeeds: BracketPlayer[] = seedIds.map(id => id === 'BYE' ? ({ name: 'BYE' } as const) : (playersById.get(id) ?? null));

    const playInIds = Array.isArray(selectedTournament.playInIds) ? selectedTournament.playInIds : [];
    const playInSeeds: BracketPlayer[] = playInIds.map(id => playersById.get(id) ?? null);

    return generateBracketFromSeedsAndPlayIns(initialSeeds, playInSeeds, tournamentSpecificGames, selectedTournament.id, playersById);
  }, [selectedTournament, enrolledPlayers, tournamentGames, players]);

  /* ------------------------------ render ------------------------------ */

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tournaments</h1>
          <p className="text-muted-foreground">Browse and manage all official RTA PingPong tournaments.</p>
        </div>
        <Dialog open={isCreateOrEditOpen} onOpenChange={(isOpen) => { if (!isOpen) { setEditingTournament(null); setCoverImage(null); } setCreateOrEditOpen(isOpen); }}>
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
                  <Input id="name" name="name" placeholder="e.g., Summer Slam 2025" required defaultValue={editingTournament?.name}/>
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
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
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
              <CardHeader className="p-0"><Skeleton className="aspect-video w-full rounded-t-lg" /></CardHeader>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
                <Skeleton className="mt-1 h-4 w-1/3" />
              </CardContent>
              <CardFooter className="p-4 pt-0"><Skeleton className="h-10 w-full" /></CardFooter>
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
                      <Edit className="h-4 w-4"/><span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="destructive" className="h-8 w-8">
                          <Trash2 className="h-4 w-4"/><span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone. This will permanently delete the tournament.</AlertDialogDescription>
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
                <CardTitle className="flex items-center gap-2">
                  {tournament.locked && <Lock className="h-4 w-4 text-muted-foreground" />} {tournament.name}
                </CardTitle>
                <CardDescription className="mt-2 flex flex-col gap-2">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> {new Date(tournament.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> {tournament.participants} participants
                  </span>
                  <span className="flex items-center gap-2">
                    <Hourglass className="h-4 w-4" /> {getCountdown(tournament.date)}
                  </span>
                </CardDescription>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedTournament(null)}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => setSelectedTournament(tournaments.find(t=>t.id === tournament.id) ?? null)}
                    >
                      View Bracket
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-7xl grid-rows-[auto_1fr] h-[90vh]">
                    <DialogHeader className="flex items-center justify-between">
                      <div>
                        <DialogTitle>{selectedTournament?.name}</DialogTitle>
                        <DialogDescription>A visual bracket of the tournament progress and player management.</DialogDescription>
                      </div>

                      {/* Start Tournament button */}
                      {selectedTournament && !selectedTournament.locked && (selectedTournament.enrolledPlayerIds?.length ?? 0) >= 2 && (
                        <Button onClick={() => startTournament(selectedTournament, enrolledPlayers)}>
                          <Lock className="mr-2 h-4 w-4" /> Start Tournament
                        </Button>
                      )}
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 overflow-hidden h-full">
                      {/* Participants + Play-ins */}
                      <div className="flex flex-col gap-4 border-r pr-6">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">Participants</h3>
                          <Pill>{enrolledPlayers.length} total</Pill>
                        </div>

                        <div className="flex gap-2">
                          <Select
                            value={playerToAdd}
                            onValueChange={(playerId) => handleAddPlayer(selectedTournament!.id, playerId)}
                          >
                            <SelectTrigger disabled={!selectedTournament || (!selectedTournament.locked && availablePlayers.length===0)}>
                              <SelectValue placeholder={selectedTournament?.locked ? "Add to Play-ins" : "Add Player"} />
                            </SelectTrigger>
                            <SelectContent>
                              {availablePlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedTournament?.locked ? (
                          <div className="text-xs text-muted-foreground -mt-2">
                            Bracket is locked. New players join as <span className="font-medium">Play-ins</span>.
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground -mt-2">
                            You can still add or remove players before starting.
                          </div>
                        )}

                        <ScrollArea className="flex-1">
                          <div className="space-y-2">
                            {enrolledPlayers.map(player => (
                              <div key={player.id} className="flex items-center justify-between rounded-md border p-2">
                                <div className="flex items-center gap-2">
                                  <Swords className="h-4 w-4 text-muted-foreground" />
                                  <span>{player.name}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() => handleRemovePlayer(selectedTournament!.id, player.id)}
                                  disabled={false /* enabled always per your request */}
                                >
                                  <UserX className="h-4 w-4"/>
                                </Button>
                              </div>
                            ))}
                          </div>

                          {/* Play-ins list */}
                          {selectedTournament?.locked && (
                            <div className="mt-6">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-sm">Play-ins</h4>
                                <Pill>{(selectedTournament.playInIds ?? []).length}</Pill>
                              </div>
                              <div className="space-y-2">
                                {(selectedTournament.playInIds ?? []).length === 0 && (
                                  <div className="text-xs text-muted-foreground border rounded-md p-2">
                                    No play-ins yet. Add late players with the selector above.
                                  </div>
                                )}
                                {(selectedTournament.playInIds ?? []).map(pid => {
                                  const p = players.find(pp => pp.id === pid);
                                  return (
                                    <div key={pid} className="flex items-center justify-between rounded-md border p-2">
                                      <div className="flex items-center gap-2">
                                        <Swords className="h-4 w-4 text-muted-foreground" />
                                        <span>{p?.name ?? 'Unknown Player'}</span>
                                      </div>
                                      <Pill>Late entry</Pill>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </ScrollArea>
                      </div>

                      {/* Bracket column */}
                      <div className="overflow-auto p-4">
                        <div className="relative flex h-full w-full items-center justify-center">
                          {bracketRounds.length > 0 ? (
                            <div className="inline-flex items-center gap-x-12">
                              {bracketRounds.map((round, roundIndex) => (
                                <div key={roundIndex} className="flex flex-col justify-around h-full w-48 space-y-4">
                                  <h4 className="text-center font-bold text-lg mb-4">{round.title}</h4>
                                  {round.matches.map((match, matchIndex) => (
                                    <MatchBox key={matchIndex} match={match} />
                                  ))}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50 h-full w-full">
                              <GitMerge className="h-12 w-12 text-muted-foreground" />
                              <p className="mt-4 text-muted-foreground">Add at least 2 players to generate a bracket.</p>
                            </div>
                          )}
                        </div>
                      </div>
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