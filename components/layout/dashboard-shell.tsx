"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BOTTOM_NAV_ITEMS } from "@/lib/navigation";
import type { Profile, TeamRole } from "@/types";

interface DashboardShellProps {
  user: Pick<Profile, "full_name" | "email" | "phone" | "avatar_url">;
  teamName?: string;
  userRole?: TeamRole;
  children: React.ReactNode;
}

function getMobilePageTitle(pathname: string): string | undefined {
  const item = BOTTOM_NAV_ITEMS.find((nav) =>
    pathname.startsWith(nav.href)
  );
  return item?.title;
}

export function DashboardShell({
  user,
  teamName,
  userRole,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const pageTitle = getMobilePageTitle(pathname);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar user={user} teamName={teamName} userRole={userRole} />
      <div className="flex min-h-0 flex-1 flex-col">
        <MobileHeader teamName={teamName} pageTitle={pageTitle} />
        <main className="flex-1 overflow-auto pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          {children}
        </main>
        <BottomNav userRole={userRole} />
      </div>
    </div>
  );
}
