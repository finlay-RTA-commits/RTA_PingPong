
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Player } from '@/lib/types';
import { Flame, Mail, Star, Swords, Trophy, BarChart, Crown, Ticket, Droplet, PartyPopper, Shield, Coins, Repeat, Coffee } from 'lucide-react';
import { Button } from './ui/button';
import { achievementData, Achievement, AchievementId } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: Player;
}

export const achievementIcons: Record<AchievementId, React.ElementType> = {
  KING_SLAYER: Crown,
  HOT_STREAK: Flame,
  WELCOME_TO_THE_BIG_LEAGUES: Ticket,
  WELCOME_TO_THE_PARTY_PAL: PartyPopper,
  BUTTERFINGERS: Droplet,
  RIVAL_REVENGE: Shield,
  COIN_FLIP_CHAMPION: Coins,
  YO_YO: Repeat,
  SHOULD_BE_WORKING: Coffee,
};


const AchievementBadge = ({ achievement }: { achievement: Achievement }) => {
  const Icon = achievementIcons[achievement.id as AchievementId];

  return (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center border-2",
                    achievement.id === 'KING_SLAYER' && 'bg-amber-100 border-amber-400 text-amber-500',
                    achievement.id === 'HOT_STREAK' && 'bg-orange-100 border-orange-400 text-orange-500',
                    achievement.id === 'WELCOME_TO_THE_BIG_LEAGUES' && 'bg-blue-100 border-blue-400 text-blue-500',
                    achievement.id === 'WELCOME_TO_THE_PARTY_PAL' && 'bg-teal-100 border-teal-400 text-teal-500',
                    achievement.id === 'BUTTERFINGERS' && 'bg-gray-100 border-gray-400 text-gray-500',
                    achievement.id === 'RIVAL_REVENGE' && 'bg-red-100 border-red-400 text-red-500',
                    achievement.id === 'COIN_FLIP_CHAMPION' && 'bg-yellow-100 border-yellow-400 text-yellow-500',
                    achievement.id === 'YO_YO' && 'bg-purple-100 border-purple-400 text-purple-500',
                    achievement.id === 'SHOULD_BE_WORKING' && 'bg-stone-100 border-stone-400 text-stone-500',
                )}>
                    <Icon className="h-5 w-5" />
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p className="font-bold">{achievement.name}</p>
                <p>{achievement.description}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  )
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

  const unlockedAchievements = (player.achievements || [])
    .map(id => achievementData[id])
    .filter(Boolean);

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
        
        {unlockedAchievements.length > 0 && (
          <>
          <Separator className="my-4" />
           <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground text-center">ACHIEVEMENTS</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {unlockedAchievements.map(ach => <AchievementBadge key={ach.id} achievement={ach} />)}
              </div>
           </div>
          </>
        )}

        <Separator className="my-4" />
        <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><BarChart className="h-4 w-4 text-primary" /> Elo Rating</span>
                <span className="font-semibold">{player.stats?.elo ?? 1000}</span>
            </div>
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
