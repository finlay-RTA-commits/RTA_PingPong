
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from './ui/button';
import { achievementData, AchievementId } from '@/lib/types';
import { Rocket, LayoutDashboard, Trophy, Swords, User, Users, Crown, Flame, Ticket, PartyPopper, Droplet } from 'lucide-react';

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Leaderboard', icon: Trophy },
  { label: 'Tournaments', icon: Swords },
  { label: 'Player Cards', icon: User },
  { label: 'Players', icon: Users },
];

const achievementIcons: Record<AchievementId, React.ElementType> = {
  KING_SLAYER: Crown,
  HOT_STREAK: Flame,
  WELCOME_TO_THE_BIG_LEAGUES: Ticket,
  WELCOME_TO_THE_PARTY_PAL: PartyPopper,
  BUTTERFINGERS: Droplet,
};

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const achievements = Object.values(achievementData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex justify-center">
             <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Rocket className="h-8 w-8" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Welcome to RTA PingPong!</DialogTitle>
          <DialogDescription className="text-center">
            Here’s a quick tour to get you started.
          </DialogDescription>
        </DialogHeader>
        <Carousel className="w-full">
          <CarouselContent>
            <CarouselItem>
              <div className="p-4 text-center space-y-4">
                <h3 className="font-semibold text-lg">App Navigation</h3>
                <p className="text-muted-foreground">
                  Use the sidebar on the left to navigate through the different sections of the app.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4 text-left">
                  {menuItems.map(item => {
                      const Icon = item.icon;
                      return (
                           <div key={item.label} className="flex items-center gap-2 rounded-md border p-3">
                                <Icon className="h-5 w-5 text-primary"/>
                                <span>{item.label}</span>
                           </div>
                      )
                  })}
                </div>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="p-4 text-center space-y-4">
                <h3 className="font-semibold text-lg">Create Your Player Profile</h3>
                <p className="text-muted-foreground">
                  To start logging games and climbing the leaderboard, you need to create your player profile.
                </p>
                <div className="mt-4 rounded-lg border-2 border-primary bg-primary/10 p-4">
                   <p className="font-semibold">
                    Click on <span className="text-primary inline-flex items-center gap-1"><User className="h-4 w-4" /> My Profile</span> in the bottom-left corner of the sidebar to add yourself to the player roster.
                   </p>
                </div>
              </div>
            </CarouselItem>
             <CarouselItem>
              <div className="p-4 text-center space-y-4">
                <h3 className="font-semibold text-lg">Unlock Achievements</h3>
                <p className="text-muted-foreground">
                  Earn badges on your player card by completing challenges!
                </p>
                <div className="space-y-2 pt-4 text-left">
                  {achievements.map((ach) => {
                    const Icon = achievementIcons[ach.id];
                    return (
                      <div key={ach.id} className="flex items-start gap-3">
                        <Icon className="h-6 w-6 text-primary mt-1" />
                        <div>
                            <p className="font-semibold">{ach.name}</p>
                            <p className="text-sm text-muted-foreground">{ach.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="-left-4" />
          <CarouselNext className="-right-4" />
        </Carousel>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it, let's play!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
