
'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePlayers } from '@/hooks/use-players';
import type { Player } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { players, addPlayer, updatePlayer, loading: playersLoading } = usePlayers();
  const { toast } = useToast();
  
  const [currentUserStats, setCurrentUserStats] = useState<Player | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('https://placehold.co/80x80.png');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user && !playersLoading) {
      // Find the player associated with the logged-in user's UID.
      const player = players.find(p => p.uid === user.uid);
      if (player) {
        setCurrentUserStats(player);
        setDisplayName(player.name);
        setAvatar(player.avatar);
      } else {
        // If no player found, set defaults from auth profile
        setDisplayName(user.displayName || 'New Player');
        setAvatar(user.photoURL || 'https://placehold.co/80x80.png');
        setCurrentUserStats(null);
      }
    }
  }, [user, players, playersLoading]);

  const handleSaveChanges = async () => {
    if(!user) return;
    setIsSaving(true);
    
    try {
        if (currentUserStats) {
          // Update existing player
          await updatePlayer({ ...currentUserStats, name: displayName, avatar, email: user.email || undefined });
          toast({
            title: "Profile Updated",
            description: "Your changes have been saved.",
          });
        } else {
           // Add new player, linking with Firebase Auth UID
          await addPlayer(displayName, avatar, user.email || '', user.uid);
          toast({
            title: "Profile Created",
            description: "You are now on the player roster!",
          });
        }
    } catch (error) {
        console.error("Error saving profile:", error);
        toast({
            variant: 'destructive',
            title: "Error",
            description: "Could not save your profile. Please try again.",
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
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
  
  const totalGames = currentUserStats ? currentUserStats.wins + currentUserStats.losses : 0;
  const winRate = totalGames > 0 ? ((currentUserStats!.wins / totalGames) * 100).toFixed(1) : "0";

  if (authLoading || playersLoading) {
      return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
            </div>
             <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-muted-foreground py-8">
                            <p>Loading stats...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your name and avatar. Your email is <span className="font-medium text-primary">{user?.email}</span>.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatar} alt={displayName} data-ai-hint="person portrait" />
                <AvatarFallback className="text-3xl">{displayName?.[0]}</AvatarFallback>
              </Avatar>
               <Input id="picture" type="file" accept="image/png, image/jpeg" onChange={handleAvatarChange} className="hidden" />
               <Button asChild variant="outline">
                 <Label htmlFor="picture">Change Avatar</Label>
               </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Player Statistics</CardTitle>
            <CardDescription>Your performance at a glance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentUserStats ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Rank</span>
                  <span className="font-bold text-primary text-2xl">#{currentUserStats.rank}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wins</span>
                  <span className="font-medium text-green-400">{currentUserStats.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Losses</span>
                  <span className="font-medium text-red-400">{currentUserStats.losses}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Games</span>
                  <span className="font-medium">{totalGames}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="font-mono font-medium">{winRate}%</span>
                </div>
              </>
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>You are not on the player roster yet.</p>
                    <p>Save your profile to be added!</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
