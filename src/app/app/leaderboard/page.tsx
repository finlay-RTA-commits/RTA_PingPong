
"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, BarChart } from "lucide-react";
import { usePlayers } from "@/hooks/use-players";

export default function LeaderboardPage() {
  const { players } = usePlayers();

  const eloSortedPlayers = useMemo(() => {
    return [...players]
      .sort((a, b) => (b.stats?.elo ?? 0) - (a.stats?.elo ?? 0))
      .map((p, index) => ({ ...p, eloRank: index + 1 }));
  }, [players]);

  const winSortedPlayers = useMemo(() => {
    return players.map((p, index) => ({ ...p, rank: index + 1 }));
  }, [players]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="text-primary" />
          Official Leaderboards
        </CardTitle>
        <CardDescription>
          Current standings for all registered players, sorted by wins or Elo rating.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wins">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wins">
                <Trophy className="mr-2" /> RTA Leaderboard
            </TabsTrigger>
            <TabsTrigger value="elo">
                <BarChart className="mr-2" /> Rank by Elo
            </TabsTrigger>
          </TabsList>
          <TabsContent value="wins">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-center">Wins</TableHead>
                  <TableHead className="text-center">Losses</TableHead>
                  <TableHead className="text-center">Win Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {winSortedPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="w-[80px] text-center text-lg font-bold">
                        {player.rank === 1 ? (
                          <span className="inline-block -rotate-[35deg]">👑</span>
                        ) : player.rank === 2 ? (
                          <span>🥈</span>
                        ) : player.rank === 3 ? (
                          <span>🥉</span>
                        ) : (
                          player.rank
                        )}
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
          </TabsContent>
          <TabsContent value="elo">
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-center">Elo</TableHead>
                  <TableHead className="text-center">Wins</TableHead>
                  <TableHead className="text-center">Losses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eloSortedPlayers.map((player) => (
                    <TableRow key={player.id}>
                       <TableCell className="w-[80px] text-center text-lg font-bold">
                         {player.eloRank === 1 ? (
                          <span className="inline-block -rotate-[35deg]">👑</span>
                        ) : player.eloRank === 2 ? (
                          <span>🥈</span>
                        ) : player.eloRank === 3 ? (
                          <span>🥉</span>
                        ) : (
                          player.eloRank
                        )}
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
                      <TableCell className="text-center font-mono text-primary font-bold">{player.stats?.elo ?? 1000}</TableCell>
                      <TableCell className="text-center">{player.wins}</TableCell>
                      <TableCell className="text-center">{player.losses}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
