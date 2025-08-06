import { players, games, tournaments } from "@/lib/data";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Calendar } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
      {/* Log Game */}
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Log a New Game</CardTitle>
          <CardDescription>
            Enter the details of a recent game to update the leaderboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-end">
            <div className="space-y-2">
              <Label>Player 1</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Player 1" />
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
              <Input type="number" placeholder="Enter score" />
            </div>
            <div className="space-y-2">
              <Label>Player 2</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Player 2" />
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
              <Input type="number" placeholder="Enter score" />
            </div>
            <Button className="w-full md:col-span-2">Submit Game</Button>
          </form>
        </CardContent>
      </Card>

      {/* Leaderboard Snippet */}
      <Card className="lg:col-span-2">
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

      {/* Recent Games */}
      <Card className="lg:col-span-6">
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
                  <TableCell className="text-right">{game.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Upcoming Tournaments */}
       <Card className="lg:col-span-6">
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
    </div>
  );
}
