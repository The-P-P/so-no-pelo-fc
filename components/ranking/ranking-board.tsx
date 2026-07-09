"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { STAT_EMOJIS, STAT_LABELS } from "@/lib/stats";
import type { RankingEntry } from "@/types";
import { cn } from "@/lib/utils";

type RankingTab =
  | "score"
  | "goals"
  | "assists"
  | "god_saves"
  | "vacilos"
  | "attendance";

const TABS: { id: RankingTab; label: string; emoji?: string }[] = [
  { id: "score", label: "Pontuação", emoji: "🏆" },
  { id: "goals", label: "Gols", emoji: STAT_EMOJIS.goals },
  { id: "assists", label: "Assist.", emoji: STAT_EMOJIS.assists },
  { id: "god_saves", label: "God Save", emoji: STAT_EMOJIS.god_saves },
  { id: "vacilos", label: "Vacilos", emoji: STAT_EMOJIS.vacilos },
  { id: "attendance", label: "Presença", emoji: "📅" },
];

const DETAIL_STATS = [
  "goals",
  "assists",
  "god_saves",
  "vacilos",
  "own_goals",
] as const;

function getEntryKey(entry: RankingEntry) {
  return `${entry.participant_type}-${entry.participant_id}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getValue(entry: RankingEntry, tab: RankingTab): number {
  switch (tab) {
    case "score":
      return entry.score;
    case "goals":
      return Number(entry.total_goals);
    case "assists":
      return Number(entry.total_assists);
    case "god_saves":
      return Number(entry.total_god_saves);
    case "vacilos":
      return Number(entry.total_vacilos);
    case "attendance":
      return Number(entry.peladas_jogadas);
  }
}

function formatValue(entry: RankingEntry, tab: RankingTab): string {
  if (tab === "attendance" && entry.total_peladas > 0) {
    const pct = Math.round(
      (Number(entry.peladas_jogadas) / entry.total_peladas) * 100
    );
    return `${entry.peladas_jogadas}/${entry.total_peladas} (${pct}%)`;
  }
  if (tab === "score") {
    return entry.score > 0 ? `+${entry.score}` : String(entry.score);
  }
  return String(getValue(entry, tab));
}

function sortEntries(entries: RankingEntry[], tab: RankingTab): RankingEntry[] {
  const sorted = [...entries];
  if (tab === "vacilos") {
    return sorted.sort(
      (a, b) => Number(b.total_vacilos) - Number(a.total_vacilos)
    );
  }
  if (tab === "attendance") {
    return sorted.sort(
      (a, b) => Number(b.peladas_jogadas) - Number(a.peladas_jogadas)
    );
  }
  return sorted.sort((a, b) => getValue(b, tab) - getValue(a, tab));
}

function getStatTotal(entry: RankingEntry, stat: (typeof DETAIL_STATS)[number]) {
  switch (stat) {
    case "goals":
      return Number(entry.total_goals);
    case "assists":
      return Number(entry.total_assists);
    case "god_saves":
      return Number(entry.total_god_saves);
    case "vacilos":
      return Number(entry.total_vacilos);
    case "own_goals":
      return Number(entry.total_own_goals);
  }
}

interface RankingBoardProps {
  entries: RankingEntry[];
}

export function RankingBoard({ entries }: RankingBoardProps) {
  const [tab, setTab] = useState<RankingTab>("score");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    setExpandedKey(null);
  }, [tab]);

  const sorted = sortEntries(entries, tab);
  const hasData = sorted.some((e) => getValue(e, tab) !== 0);

  function handleCardClick(entryKey: string) {
    setExpandedKey((current) => (current === entryKey ? null : entryKey));
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum jogador no grupo ainda. Convide a galera!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(t.id)}
            className="h-8"
          >
            {t.emoji && <span className="mr-1">{t.emoji}</span>}
            {t.label}
          </Button>
        ))}
      </div>

      {!hasData && tab !== "attendance" && (
        <p className="text-sm text-muted-foreground">
          Ninguém pontuou ainda. Marca presença nas peladas e lança as stats!
        </p>
      )}

      <div className="space-y-2">
        {sorted.map((entry, index) => {
          const entryKey = getEntryKey(entry);
          const value = getValue(entry, tab);
          const isTop3 = index < 3 && value > 0;
          const isExpanded = expandedKey === entryKey;
          const attendancePct =
            entry.total_peladas > 0
              ? Math.round(
                  (Number(entry.peladas_jogadas) / entry.total_peladas) * 100
                )
              : 0;

          return (
            <div
              key={entryKey}
              className={cn(
                "overflow-hidden rounded-lg border transition-colors",
                isTop3 && "border-primary/30 bg-primary/5",
                isExpanded && "border-primary/40 bg-primary/10"
              )}
            >
              <button
                type="button"
                onClick={() => handleCardClick(entryKey)}
                aria-expanded={isExpanded}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    index === 0 && value > 0
                      ? "bg-yellow-500/20 text-yellow-600"
                      : index === 1 && value > 0
                        ? "bg-gray-400/20 text-gray-600"
                        : index === 2 && value > 0
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
                    {entry.participant_type === "fictional" && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Fictício
                      </span>
                    )}
                  </p>
                  {tab === "score" && !isExpanded && (
                    <p className="text-xs text-muted-foreground">
                      {entry.total_goals}G · {entry.total_assists}A ·{" "}
                      {entry.peladas_jogadas} peladas
                    </p>
                  )}
                </div>

                <span className="shrink-0 text-lg font-bold tabular-nums">
                  {formatValue(entry, tab)}
                </span>
              </button>

              {isExpanded && (
                <div className="border-t border-border/60 px-4 pb-4 pt-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {DETAIL_STATS.map((stat) => (
                      <div
                        key={stat}
                        className="rounded-md border border-border/60 bg-background/50 px-3 py-2"
                      >
                        <p className="text-xs text-muted-foreground">
                          {STAT_EMOJIS[stat]} {STAT_LABELS[stat]}
                        </p>
                        <p className="text-lg font-bold tabular-nums">
                          {getStatTotal(entry, stat)}
                        </p>
                      </div>
                    ))}
                    <div className="rounded-md border border-border/60 bg-background/50 px-3 py-2">
                      <p className="text-xs text-muted-foreground">
                        📅 Presença
                      </p>
                      <p className="text-lg font-bold tabular-nums">
                        {entry.peladas_jogadas}/{entry.total_peladas}
                      </p>
                      {entry.total_peladas > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {attendancePct}%
                        </p>
                      )}
                    </div>
                    <div className="rounded-md border border-border/60 bg-background/50 px-3 py-2">
                      <p className="text-xs text-muted-foreground">
                        🏆 Pontuação
                      </p>
                      <p className="text-lg font-bold tabular-nums">
                        {entry.score > 0 ? `+${entry.score}` : entry.score}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
