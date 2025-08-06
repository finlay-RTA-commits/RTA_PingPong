import { AppSidebar } from '@/components/app-sidebar';

export default function AppPagesLayout({ children }: { children: React.ReactNode }) {
  return <AppSidebar>{children}</AppSidebar>;
}
