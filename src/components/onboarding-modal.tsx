'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
import {
  Rocket,
  LayoutDashboard,
  Trophy,
  Swords,
  User,
  Users,
  Crown,
  Flame,
  Ticket,
  PartyPopper,
  Droplet,
  Shield,
  Coins,
  Repeat,
  Coffee,
} from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

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
  RIVAL_REVENGE: Shield,
  COIN_FLIP_CHAMPION: Coins,
  YO_YO: Repeat,
  SHOULD_BE_WORKING: Coffee,
};

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const achievements = Object.values(achievementData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Rocket className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Welcome to RTA PingPong!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Here’s a quick tour to get you started.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 px-6">
          <Carousel className="h-full w-full relative">
            <CarouselContent className="h-full">
              {/* Slide 1: Navigation */}
              <CarouselItem className="flex flex-col items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">App Navigation</h3>
                  <p className="mt-1 text-muted-foreground">
                    Use the sidebar on the left to hop between sections.
                  </p>
                  <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3 sm:grid-cols-3">
                    {menuItems.map(({ label, icon: Icon }) => (
                      <div
                        key={label}
                        className="rounded-lg border bg-card p-4 text-center shadow-sm"
                      >
                        <Icon className="mx-auto h-6 w-6 text-primary" />
                        <p className="mt-2 text-sm font-medium">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CarouselItem>

              {/* Slide 2: Create profile */}
              <CarouselItem className="flex flex-col items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">
                    Create Your Player Profile
                  </h3>
                  <p className="mt-1 text-muted-foreground">
                    Log games, earn achievements, and climb the board.
                  </p>
                  <div className="mx-auto mt-6 max-w-sm rounded-lg border-2 border-primary/40 bg-primary/10 p-5">
                    <p className="font-semibold leading-relaxed">
                      Click on{' '}
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary/20 px-2 py-1 text-sm text-primary">
                        <User className="h-4 w-4" /> My Profile
                      </span>{' '}
                      in the sidebar to add yourself to the roster.
                    </p>
                  </div>
                </div>
              </CarouselItem>

              {/* Slide 3: Achievements */}
              <CarouselItem className="flex flex-col h-full py-4">
                 <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">Unlock Achievements</h3>
                    <p className="mt-1 text-muted-foreground">
                      Earn badges for completing challenges.
                    </p>
                 </div>
                  <div className="flex-1 min-h-0">
                      <ScrollArea className="h-full w-full rounded-md border">
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {achievements.map((ach) => {
                            const Icon = achievementIcons[ach.id];
                            return (
                              <div
                                key={ach.id}
                                className="flex items-start gap-4 rounded-lg border p-3"
                              >
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                  <p className="font-semibold">{ach.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {ach.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                  </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="absolute left-[-1rem] top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-[-1rem] top-1/2 -translate-y-1/2" />
          </Carousel>
        </div>

        <DialogFooter className="p-6">
          <DialogClose asChild>
            <Button className="w-full">Got it, let’s play!</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
