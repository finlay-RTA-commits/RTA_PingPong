
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Trophy } from "lucide-react";
import { usePlayers } from "@/hooks/use-players";

export default function LeaderboardPage() {
  const { players } = usePlayers();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="text-primary" />
          Official Leaderboard
        </CardTitle>
        <CardDescription>
          Current standings for all registered players.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-center">Wins</TableHead>
              <TableHead className="text-center">Losses</TableHead>
              <TableHead className="text-center">Win Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players
              .sort((a, b) => a.rank - b.rank)
              .map((player) => (
                <TableRow key={player.id}>
                  <TableCell>
                    <Badge variant="secondary" className="text-lg">
                      {player.rank}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={player.avatar} alt={player.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{player.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{player.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-green-400">{player.wins}</TableCell>
                  <TableCell className="text-center text-red-400">{player.losses}</TableCell>
                  <TableCell className="text-center font-mono">
                    {player.wins + player.losses > 0
                      ? `${((player.wins / (player.wins + player.losses)) * 100).toFixed(1)}%`
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
