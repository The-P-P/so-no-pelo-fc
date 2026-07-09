import {
  User,
  CalendarDays,
  Trophy,
  Users,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import type { TeamRole } from "@/types";

export type NavItemConfig = {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const BOTTOM_NAV_ITEMS: NavItemConfig[] = [
  {
    title: "Perfil",
    href: "/dashboard/perfil",
    icon: User,
  },
  {
    title: "Peladas",
    href: "/dashboard/peladas",
    icon: CalendarDays,
  },
  {
    title: "Stats",
    href: "/dashboard",
    icon: BarChart3,
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
  },
];

export const SIDEBAR_NAV_ITEMS: NavItemConfig[] = BOTTOM_NAV_ITEMS;

export function filterNavItems(
  items: NavItemConfig[],
  userRole?: TeamRole
): NavItemConfig[] {
  return items.filter(
    (item) =>
      !item.adminOnly || userRole === "owner" || userRole === "admin"
  );
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (href === "/dashboard/perfil") {
    return (
      pathname === "/dashboard/perfil" ||
      pathname.startsWith("/dashboard/grupo")
    );
  }
  return pathname.startsWith(href);
}

export function isLiveModePath(pathname: string): boolean {
  return /\/dashboard\/peladas\/[^/]+\/ao-vivo$/.test(pathname);
}
