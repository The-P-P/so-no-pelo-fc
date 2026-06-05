"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getEloColor } from "@/lib/ranked";
import type { RankedEntry } from "@/lib/actions/ranked-actions";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface RankedBoardProps {
  entries: RankedEntry[];
}

export function RankedBoard({ entries }: RankedBoardProps) {
  const sorted = [...entries].sort((a, b) => b.total_pdl - a.total_pdl);
  const hasData = sorted.some((e) => e.total_pdl > 0);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum jogador no grupo ainda.
      </p>
    );
  }

  if (!hasData) {
    return (
      <p className="text-sm text-muted-foreground">
        Ninguém pontuou na liga ainda. Marque vitórias nas peladas!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((entry, index) => {
        const isTop3 = index < 3 && entry.total_pdl > 0;

        return (
          <div
            key={entry.user_id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3",
              isTop3 && "border-primary/30 bg-primary/5"
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                index === 0 && entry.total_pdl > 0
                  ? "bg-yellow-500/20 text-yellow-600"
                  : index === 1 && entry.total_pdl > 0
                    ? "bg-gray-400/20 text-gray-600"
                    : index === 2 && entry.total_pdl > 0
                      ? "bg-amber-700/20 text-amber-700"
                      : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </span>

            <Avatar className="h-9 w-9">
              <AvatarImage
                src={entry.avatar_url ?? undefined}
                alt={entry.displayName}
              />
              <AvatarFallback className="text-xs">
                {getInitials(entry.displayName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {entry.displayName}
              </p>
              <p className="text-xs text-muted-foreground">
                {entry.victories} vitória{entry.victories !== 1 ? "s" : ""}
                {entry.nextEloName &&
                  entry.pdlNeededForNext !== null &&
                  ` · faltam ${entry.pdlNeededForNext} PDL para ${entry.nextEloName}`}
              </p>
              {entry.nextEloName && entry.pdlNeededForNext !== null && (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${entry.progressPercent}%` }}
                  />
                </div>
              )}
            </div>

            <div className="shrink-0 text-right">
              <p
                className={cn(
                  "text-sm font-bold",
                  getEloColor(entry.eloName)
                )}
              >
                {entry.eloName}
              </p>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {entry.total_pdl}
              </p>
              <p className="text-[10px] text-muted-foreground">PDL</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
