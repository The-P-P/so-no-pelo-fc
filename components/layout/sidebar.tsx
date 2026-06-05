"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  Users,
  CalendarDays,
  Shield,
  LogOut,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { formatPhoneDisplay } from "@/lib/phone";
import type { Profile, TeamRole } from "@/types";

const NAV_ITEMS: {
  title: string;
  href: string;
  icon: typeof Shield;
  adminOnly?: boolean;
}[] = [
  {
    title: "Time",
    href: "/dashboard",
    icon: Shield,
  },
  {
    title: "Peladas",
    href: "/dashboard/peladas",
    icon: CalendarDays,
  },
  {
    title: "Ranking",
    href: "/dashboard/ranking",
    icon: Trophy,
  },
  {
    title: "Membros",
    href: "/dashboard/membros",
    icon: Users,
    adminOnly: true,
  },
];

interface SidebarProps {
  user: Pick<Profile, "full_name" | "email" | "phone" | "avatar_url">;
  teamName?: string;
  userRole?: TeamRole;
}

function SidebarContent({
  user,
  teamName,
  userRole,
  onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
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

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || userRole === "owner" || userRole === "admin"
  );

  return (
    <div className="flex h-full flex-col">
      {/* Logo / Time */}
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

      {/* Navegação */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
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

      {/* Usuário */}
      <div className="p-4">
        <div className="mb-3 flex items-center gap-3">
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
            <p className="truncate text-xs text-muted-foreground">
              {contact}
            </p>
          </div>
        </div>
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
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/50 md:flex md:flex-col">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile sidebar */}
      <div className="flex items-center border-b border-border bg-card/50 px-4 py-3 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent {...props} />
          </SheetContent>
        </Sheet>
        <div className="ml-3 flex items-center gap-2">
          <span className="text-lg">⚽</span>
          <span className="font-bold">
            {props.teamName ?? "Só no Pelo FC"}
          </span>
        </div>
      </div>
    </>
  );
}
