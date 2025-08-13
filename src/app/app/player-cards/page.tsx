
'use client';

import { useState } from 'react';
import type { PredictMatchInput, PredictMatchOutput, Achievement } from '@/lib/types';
import { PlayerCard } from '@/components/player-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BrainCircuit, HelpCircle, Trophy } from 'lucide-react';
import { predictMatch } from '@/ai/flows/predict-match-flow';
import { useToast } from '@/hooks/use-toast';
import { usePlayers } from '@/hooks/use-players';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { achievementData } from '@/lib/types';
import { achievementIcons } from '@/components/player-card';

export default function PlayerCardsPage() {
  const { players } = usePlayers();
  const [player1, setPlayer1] = useState<string | undefined>(undefined);
  const [player2, setPlayer2] = useState<string | undefined>(undefined);
  const [prediction, setPrediction] = useState<PredictMatchOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const allAchievements = Object.values(achievementData);

  const handlePrediction = async () => {
    if (!player1 || !player2) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select both players.',
      });
      return;
    }
     if (player1 === player2) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select two different players.',
      });
      return;
    }

    setIsLoading(true);
    setPrediction(null);

    try {
      const input: PredictMatchInput = { player1Name: player1, player2Name: player2 };
      const result = await predictMatch(input);
      setPrediction(result);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Prediction Failed',
        description: 'Could not get a prediction. Please try again.',
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold">Player Cards</h1>
            <p className="text-muted-foreground">
            Detailed statistics and information for each player.
            </p>
        </div>
        
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Achievements <Trophy className="ml-2 h-4 w-4 text-amber-400" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="space-y-4">
                    <h4 className="font-medium leading-none">Unlockable Achievements</h4>
                    <div className="space-y-2">
                        {allAchievements.map((ach) => {
                            const Icon = achievementIcons[ach.id];
                            return (
                            <div key={ach.id} className="flex items-start gap-3">
                                <Icon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">{ach.name}</p>
                                    <p className="text-sm text-muted-foreground">{ach.description}</p>
                                </div>
                            </div>
                            )
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="text-primary" />
            Match Predictor
          </CardTitle>
          <CardDescription>
            Select two players to get AI-powered match prediction.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select value={player1} onValueChange={setPlayer1}>
            <SelectTrigger>
              <SelectValue placeholder="Select Player 1" />
            </SelectTrigger>
            <SelectContent>
              {players.map((p) => (
                <SelectItem key={p.id} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={player2} onValueChange={setPlayer2}>
            <SelectTrigger>
              <SelectValue placeholder="Select Player 2" />
            </SelectTrigger>
            <SelectContent>
              {players.map((p) => (
                <SelectItem key={p.id} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
           <Button onClick={handlePrediction} disabled={isLoading} className="w-full lg:w-auto">
            {isLoading ? <Loader2 className="animate-spin" /> : 'Predict Odds'}
          </Button>
        </CardContent>
        {prediction && (
          <CardFooter className="flex flex-col items-start gap-2 rounded-lg border bg-muted/50 p-4">
              <h3 className="font-bold text-lg">Prediction Result</h3>
              <p><strong className="text-primary">{prediction.winner}</strong> is predicted to win with odds of <strong className="text-primary">{prediction.odds}</strong>.</p>
              <p className="text-sm text-muted-foreground">{prediction.reasoning}</p>
          </CardFooter>
        )}
      </Card>
      

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}
