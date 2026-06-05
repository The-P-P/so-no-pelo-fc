"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { formatPhoneDisplay } from "@/lib/phone";
import {
  SIDEBAR_NAV_ITEMS,
  filterNavItems,
  isNavItemActive,
} from "@/lib/navigation";
import type { Profile, TeamRole } from "@/types";

interface SidebarProps {
  user: Pick<Profile, "full_name" | "email" | "phone" | "avatar_url">;
  teamName?: string;
  userRole?: TeamRole;
}

function SidebarContent({
  user,
  teamName,
  userRole,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const contact = user.phone
    ? formatPhoneDisplay(user.phone)
    : (user.email ?? "");

  const initials = (user.full_name ?? contact)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const visibleItems = filterNavItems(SIDEBAR_NAV_ITEMS, userRole);

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            ⚽
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight">
              {teamName ?? "Só no Pelo FC"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Stats de várzea
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleItems.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-4">
        <Link
          href="/dashboard/perfil"
          className="mb-3 flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-muted"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-xs text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user.full_name ?? "Jogador"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{contact}</p>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/50 md:flex md:flex-col">
      <SidebarContent {...props} />
    </aside>
  );
}
