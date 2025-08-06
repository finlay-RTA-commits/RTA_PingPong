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

// Let's assume the logged-in user is the first player, Alice.
const currentUser = players[0];
const totalGames = currentUser.wins + currentUser.losses;
const winRate = totalGames > 0 ? ((currentUser.wins / totalGames) * 100).toFixed(1) : 0;

export default function ProfilePage() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your name and avatar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} data-ai-hint="person portrait" />
                <AvatarFallback className="text-3xl">{currentUser.name[0]}</AvatarFallback>
              </Avatar>
              <Button variant="outline">Change Avatar</Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue={currentUser.name} />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save Changes</Button>
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Rank</span>
              <span className="font-bold text-primary text-2xl">#{currentUser.rank}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wins</span>
              <span className="font-medium text-green-400">{currentUser.wins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Losses</span>
              <span className="font-medium text-red-400">{currentUser.losses}</span>
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
