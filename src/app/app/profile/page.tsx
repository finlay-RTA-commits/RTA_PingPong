
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

export default function ProfilePage() {
  const { user } = useAuth();
  const { players, addPlayer, updatePlayer } = usePlayers();
  const { toast } = useToast();
  
  const [currentUserStats, setCurrentUserStats] = useState<Player | null>(null);
  const [displayName, setDisplayName] = useState(user?.displayName || 'New Player');
  const [avatar, setAvatar] = useState(user?.photoURL || 'https://placehold.co/80x80.png');

  useEffect(() => {
    if (user) {
      // Find the player associated with the logged-in user.
      // In a real app, you'd match on a persistent user ID from the database, not email.
      const player = players.find(p => p.name.toLowerCase() === (user.displayName || '').toLowerCase() || p.id === (user as any).playerId);
      setCurrentUserStats(player || null);
      if(player){
        setDisplayName(player.name);
        setAvatar(player.avatar);
      }
    }
  }, [user, players]);

  const handleSaveChanges = () => {
    if(!user) return;
    
    if (currentUserStats) {
      // Update existing player
      updatePlayer({ ...currentUserStats, name: displayName, avatar });
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved.",
      });
    } else {
       // Add new player - In a real app, this ID would come from a database.
      const newPlayerId = Math.max(...players.map(p => p.id), 0) + 1;
      // Associate Firebase user with player id
      (user as any).playerId = newPlayerId;
      addPlayer(displayName, avatar, newPlayerId);
      toast({
        title: "Profile Created",
        description: "You are now on the player roster!",
      });
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
                <AvatarFallback className="text-3xl">{displayName[0]}</AvatarFallback>
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
            <Button onClick={handleSaveChanges}>Save Changes</Button>
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
                  <span className="font-medium font-mono">{winRate}%</span>
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
