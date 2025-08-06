
'use client';

import { useState } from 'react';
import { players } from "@/lib/data";
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

// Let's assume the logged-in user is the first player for stats purposes.
// In a real app, this would be fetched from a database based on the user's ID.
const currentUserStats = players[0];
const totalGames = currentUserStats.wins + currentUserStats.losses;
const winRate = totalGames > 0 ? ((currentUserStats.wins / totalGames) * 100).toFixed(1) : "0";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use user's display name or a default, and allow it to be updated.
  const [displayName, setDisplayName] = useState(user?.displayName || 'New Player');
  const [avatar, setAvatar] = useState(user?.photoURL || 'https://placehold.co/80x80.png');

  const handleSaveChanges = () => {
    // In a real app, you'd update the user's profile in Firebase Auth
    // and your database here.
    toast({
      title: "Profile Updated",
      description: "Your changes have been saved locally.",
    });
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


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
               <Input id="picture" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
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
            <CardDescription>Your performance at a glance (sample data).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
