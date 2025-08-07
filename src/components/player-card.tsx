
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Player } from '@/lib/types';
import { Flame, Mail, Star, Swords, Trophy } from 'lucide-react';
import { Button } from './ui/button';

interface PlayerCardProps {
  player: Player;
}

export function PlayerCard({ player }: PlayerCardProps) {
  const winRate = player.wins + player.losses > 0 ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(0) : 0;
  
  const generateGmailLink = () => {
    if (!player.email) return undefined;
    
    const to = encodeURIComponent(player.email);
    const subject = encodeURIComponent("Ping Pong Challenge!");
    const body = encodeURIComponent(
      `Hey ${player.name},\n\nI challenge you to a game of ping pong!\n\nLet me know when you're free to play.\n\nFrom the RTA PingPong App.`
    );
    
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
  };

  const gmailLink = generateGmailLink();

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-card to-muted/50 shadow-lg flex flex-col">
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
                {player.tournamentsWon && player.tournamentsWon > 0 ? (
                  <Trophy className="h-6 w-6 text-amber-400" />
                ) : null}
              </CardTitle>
              <p className="font-semibold text-muted-foreground">Rank: #{player.rank}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
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
                <span className="flex items-center gap-2 text-muted-foreground"><Star className="h-4 w-4 text-primary" /> Highest Streak</span>
                <span className="font-semibold">{player.stats?.highestStreak ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><Swords className="h-4 w-4 text-primary" /> Main Rival</span>
                <span className="font-semibold">{player.stats?.rival ?? 'N/A'}</span>
            </div>
        </div>
      </CardContent>
       <CardFooter className="p-4 pt-0">
        <Button asChild variant="outline" className="w-full" disabled={!player.email}>
          <a href={gmailLink} target="_blank" rel="noopener noreferrer">
            <Mail className="mr-2 h-4 w-4" />
            {player.email ? 'Invite to Game' : 'Email not available'}
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
