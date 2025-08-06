
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Rocket, Swords, Trophy, User, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/app/tournaments", label: "Tournaments", icon: Swords },
  { href: "/app/player-cards", label: "Player Cards", icon: User },
  { href: "/app/players", label: "Players", icon: Users },
];

const bottomMenuItems = [
  { href: "/app/profile", label: "My Profile", icon: User },
];

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/app/dashboard" className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="bg-primary text-primary-foreground rounded-lg">
                <Rocket />
            </Button>
            <span className="text-xl font-semibold text-primary">RTA PingPong</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior={false} passHref>
                  <SidebarMenuButton
                    as="a"
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                  >
                      <item.icon />
                      <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            {bottomMenuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior={false} passHref>
                  <SidebarMenuButton
                    as="a"
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                  >
                      <item.icon />
                      <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
             <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={logout}
                  tooltip="Logout"
                >
                  
                    <LogOut />
                    <span>Logout</span>
                  
                </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6 md:hidden">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold text-primary">RTA PingPong</h1>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
