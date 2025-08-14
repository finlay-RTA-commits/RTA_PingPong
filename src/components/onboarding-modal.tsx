'use client';

import * as React from 'react';
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
      <DialogContent
        className={cn(
          'w-[min(92vw,720px)] max-h-[90vh] mx-auto p-0 overflow-hidden',
          'rounded-2xl border bg-background/95 shadow-2xl'
        )}
      >
        <DialogHeader className="p-8 pb-4 text-center items-center">
          <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-8 ring-primary/10">
            <Rocket className="h-8 w-8" aria-hidden />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Welcome to RTA PingPong!
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Here’s a quick tour to get you started.
          </DialogDescription>
        </DialogHeader>

        {/* Middle content scrolls so the modal never exceeds the screen */}
        <div className="px-6 pb-2 overflow-y-auto max-h-[calc(90vh-200px)]">
          <Carousel className="w-full">
            <CarouselContent className="min-h-[360px]">
              {/* Slide 1: Navigation */}
              <CarouselItem className="flex h-full items-center justify-center">
                <div className="w-full text-center">
                  <h3 className="text-lg font-semibold">App Navigation</h3>
                  <p className="mt-1 text-muted-foreground">
                    Use the sidebar on the left to hop between sections.
                  </p>

                  <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3 justify-items-center">
                    {menuItems.map(({ label, icon: Icon }) => (
                      <div
                        key={label}
                        className="w-full max-w-[200px] rounded-xl border bg-card p-3 text-left shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CarouselItem>

              {/* Slide 2: Create profile */}
              <CarouselItem className="flex h-full items-center justify-center">
                <div className="w-full text-center">
                  <h3 className="text-lg font-semibold">Create Your Player Profile</h3>
                  <p className="mt-1 text-muted-foreground">
                    Log games, earn achievements, and climb the board.
                  </p>

                  <div className="mx-auto mt-6 max-w-xl rounded-2xl border-2 border-primary/40 bg-primary/10 p-5">
                    <p className="font-semibold leading-relaxed">
                      Click on{' '}
                      <span className="inline-flex items-center gap-1 text-primary">
                        <User className="h-4 w-4" /> My Profile
                      </span>{' '}
                      in the bottom-left of the sidebar to add yourself to the roster.
                    </p>
                  </div>
                </div>
              </CarouselItem>

              {/* Slide 3: Achievements */}
              <CarouselItem className="flex h-full items-center justify-center">
                <div className="w-full text-center">
                  <h3 className="text-lg font-semibold">Unlock Achievements</h3>
                  <p className="mt-1 text-muted-foreground">
                    Earn badges on your player card by completing challenges.
                  </p>

                  <div className="mx-auto mt-5 max-w-2xl pb-2">
                    <ScrollArea className="h-[300px] w-full rounded-xl border">
                      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 pb-4">
                        {achievements.map((ach) => {
                          const Icon = achievementIcons[ach.id];
                          return (
                            <div
                              key={ach.id}
                              className="flex gap-2 rounded-xl bg-card px-3 py-2 shadow-sm ring-1 ring-border/60 min-h-[80px]" // tightened padding
                            >
                              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <Icon className="h-4 w-4 text-primary" />
                              </div>
                              <div className="text-left">
                                <p className="font-semibold leading-tight">
                                  {ach.name}
                                </p>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                  {ach.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>

            <CarouselPrevious
              className="left-2 top-1/2 -translate-y-1/2 rounded-full border bg-background/90 shadow-sm backdrop-blur"
              aria-label="Previous"
            />
            <CarouselNext
              className="right-2 top-1/2 -translate-y-1/2 rounded-full border bg-background/90 shadow-sm backdrop-blur"
              aria-label="Next"
            />
          </Carousel>
        </div>

        <DialogFooter className="p-6 pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="h-11 w-full rounded-xl text-base font-semibold shadow-md"
          >
            Got it, let’s play!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}