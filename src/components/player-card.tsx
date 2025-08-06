
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Player } from '@/lib/types';
import { BarChart, Flame, Shield, Star, Swords, TrendingDown, TrendingUp, Trophy } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
}

export function PlayerCard({ player }: PlayerCardProps) {
  const winRate = player.wins + player.losses > 0 ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(0) : 0;
  
  return (
    <Card className="overflow-hidden bg-gradient-to-br from-card to-muted/50 shadow-lg transition-transform hover:scale-105 hover:shadow-primary/20">
      <CardHeader className="p-0">
        <div className="bg-primary/10 p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-background">
              <AvatarImage src={player.avatar} alt={player.name} data-ai-hint="person portrait" />
              <AvatarFallback className="text-3xl">{player.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                {player.name}
                {player.tournamentsWon && player.tournamentsWon > 0 && (
                  <Trophy className="h-6 w-6 text-amber-400" />
                )}
              </CardTitle>
              <p className="font-semibold text-muted-foreground">Rank: #{player.rank}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
            <div>
                <p className="text-xs font-semibold text-muted-foreground">WINS</p>
                <p className="text-2xl font-bold">{player.wins}</p>
            </div>
            <div>
                <p className="text-xs font-semibold text-muted-foreground">LOSSES</p>
                <p className="text-2xl font-bold">{player.losses}</p>
            </div>
            <div>
                <p className="text-xs font-semibold text-muted-foreground">WIN %</p>
                <p className="text-2xl font-bold">{winRate}</p>
            </div>
        </div>
        <Separator className="my-4" />
        <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><Flame className="h-4 w-4 text-primary" /> Win Streak</span>
                <span className="font-semibold">{player.stats?.winStreak ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><Star className="h-4 w-4 text-primary" /> Best Score</span>
                <span className="font-mono font-semibold">{player.stats?.bestScore ?? 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><Swords className="h-4 w-4 text-primary" /> Main Rival</span>
                <span className="font-semibold">{player.stats?.rival ?? 'N/A'}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
