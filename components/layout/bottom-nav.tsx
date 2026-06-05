"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BOTTOM_NAV_ITEMS,
  filterNavItems,
  isNavItemActive,
} from "@/lib/navigation";
import type { TeamRole } from "@/types";

interface BottomNavProps {
  userRole?: TeamRole;
}

export function BottomNav({ userRole }: BottomNavProps) {
  const pathname = usePathname();
  const items = filterNavItems(BOTTOM_NAV_ITEMS, userRole);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
        {items.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn("h-5 w-5 shrink-0", isActive && "stroke-[2.5]")}
              />
              <span
                className={cn(
                  "truncate text-[10px] font-medium leading-none",
                  isActive && "font-semibold"
                )}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
