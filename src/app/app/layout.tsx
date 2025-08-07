
"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AppSidebar } from '@/components/app-sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayerProvider } from '@/hooks/use-players';

export default function AppPagesLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
         <div className="flex flex-col items-center gap-4">
            <div className="text-2xl font-bold">RTA PingPong</div>
            <Skeleton className="h-4 w-[250px]" />
         </div>
       </div>
    )
  }

  return (
    <PlayerProvider>
        <AppSidebar>{children}</AppSidebar>
    </PlayerProvider>
  );
}
