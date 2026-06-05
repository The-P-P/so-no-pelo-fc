"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { STAT_EMOJIS } from "@/lib/stats";
import { formatPeladaDate } from "@/lib/peladas";
import { cn } from "@/lib/utils";
import { getEloColor } from "@/lib/ranked";
import type {
  PersonalPeladaEntry,
  PersonalStatTotals,
  PersonalStatsBundle,
  TeamPersonalStats,
  TeamRankedSummary,
} from "@/lib/actions/personal-stats-actions";

type FilterId = "all" | string;

const STAT_CARDS: {
  key: keyof Pick<
    PersonalStatTotals,
    "goals" | "assists" | "god_saves" | "vacilos" | "own_goals"
  >;
  label: string;
  emoji: string;
}[] = [
  { key: "goals", label: "Gols", emoji: STAT_EMOJIS.goals },
  { key: "assists", label: "Assistências", emoji: STAT_EMOJIS.assists },
  { key: "god_saves", label: "God Saves", emoji: STAT_EMOJIS.god_saves },
  { key: "vacilos", label: "Vacilos", emoji: STAT_EMOJIS.vacilos },
  { key: "own_goals", label: "Gols contra", emoji: "🙈" },
];

function formatScore(score: number) {
  return score > 0 ? `+${score}` : String(score);
}

function getActiveStats(
  filter: FilterId,
  bundle: PersonalStatsBundle
): PersonalStatTotals & { rank?: number; total_players?: number } {
  if (filter === "all") return bundle.aggregate;

  const team = bundle.byTeam.find((t) => t.team_id === filter);
  if (!team) return bundle.aggregate;

  return {
    goals: team.goals,
    assists: team.assists,
    god_saves: team.god_saves,
    own_goals: team.own_goals,
    vacilos: team.vacilos,
    peladas_jogadas: team.peladas_jogadas,
    total_peladas: team.total_peladas,
    score: team.score,
    rank: team.rank,
    total_players: team.total_players,
  };
}

function filterPeladas(
  peladas: PersonalPeladaEntry[],
  filter: FilterId
): PersonalPeladaEntry[] {
  if (filter === "all") return peladas;
  return peladas.filter((p) => p.team_id === filter);
}

function getActiveRanked(
  filter: FilterId,
  bundle: PersonalStatsBundle
): TeamRankedSummary | null {
  if (filter === "all") return null;
  return bundle.rankedByTeam.find((r) => r.team_id === filter) ?? null;
}

interface PersonalStatsDashboardProps {
  bundle: PersonalStatsBundle;
}

export function PersonalStatsDashboard({ bundle }: PersonalStatsDashboardProps) {
  const [filter, setFilter] = useState<FilterId>("all");

  const stats = useMemo(
    () => getActiveStats(filter, bundle),
    [filter, bundle]
  );

  const peladas = useMemo(
    () => filterPeladas(bundle.recentPeladas, filter),
    [filter, bundle.recentPeladas]
  );

  const ranked = useMemo(
    () => getActiveRanked(filter, bundle),
    [filter, bundle]
  );

  const attendancePct =
    stats.total_peladas > 0
      ? Math.round((stats.peladas_jogadas / stats.total_peladas) * 100)
      : 0;

  const hasAnyStats =
    stats.goals > 0 ||
    stats.assists > 0 ||
    stats.god_saves > 0 ||
    stats.vacilos > 0 ||
    stats.own_goals > 0 ||
    stats.peladas_jogadas > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="h-9"
        >
          Todos os grupos
        </Button>
        {bundle.teams.map((team) => (
          <Button
            key={team.id}
            variant={filter === team.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(team.id)}
            className="h-9"
          >
            {team.name}
          </Button>
        ))}
      </div>

      {ranked && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Liga PDL · {ranked.season_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                className={cn(
                  "text-2xl font-bold",
                  getEloColor(ranked.eloName)
                )}
              >
                {ranked.eloName}
              </p>
              <p className="text-sm text-muted-foreground">
                {ranked.total_pdl} PDL · {ranked.victories} vitória
                {ranked.victories !== 1 ? "s" : ""}
              </p>
            </div>
            {ranked.nextEloName && ranked.pdlNeededForNext !== null && (
              <div className="min-w-[200px] flex-1">
                <p className="mb-1 text-xs text-muted-foreground">
                  Faltam {ranked.pdlNeededForNext} PDL para {ranked.nextEloName}
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${ranked.progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/30 bg-primary/5 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pontuação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {formatScore(stats.score)}
            </p>
            <p className="text-xs text-muted-foreground">
              {filter === "all"
                ? `Soma de ${bundle.teams.length} grupo${bundle.teams.length !== 1 ? "s" : ""}`
                : stats.rank && stats.total_players
                  ? `${stats.rank}º de ${stats.total_players} no ranking`
                  : "No grupo selecionado"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Presença</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {stats.peladas_jogadas}
              <span className="text-lg text-muted-foreground">
                /{stats.total_peladas}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.total_peladas > 0
                ? `${attendancePct}% das peladas`
                : "Nenhuma pelada no período"}
            </p>
          </CardContent>
        </Card>

        {STAT_CARDS.slice(0, 2).map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <span>{stat.emoji}</span>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{stats[stat.key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {STAT_CARDS.slice(2).map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <span>{stat.emoji}</span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{stats[stat.key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filter === "all" && bundle.byTeam.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por grupo</CardTitle>
            <CardDescription>
              Suas estatísticas separadas em cada pelada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {bundle.byTeam.map((team) => (
              <TeamBreakdownRow
                key={team.team_id}
                team={team}
                isActive={false}
                onSelect={() => setFilter(team.team_id)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas peladas</CardTitle>
          <CardDescription>
            {filter === "all"
              ? "Suas performances recentes em todos os grupos."
              : "Suas performances recentes neste grupo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasAnyStats && peladas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma estatística aprovada ainda. Confirma presença nas peladas e
              pede pro admin lançar as stats!
            </p>
          ) : peladas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma pelada com stats neste filtro.
            </p>
          ) : (
            <div className="space-y-2">
              {peladas.map((pelada) => (
                <Link
                  key={`${pelada.pelada_id}-${pelada.date}`}
                  href={`/dashboard/peladas/${pelada.pelada_id}`}
                  className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {formatPeladaDate(pelada.date)}
                      {pelada.location && (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {pelada.location}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {filter === "all" && (
                        <span>{pelada.team_name} · </span>
                      )}
                      {pelada.goals}G · {pelada.assists}A · {pelada.god_saves}{" "}
                      defesas
                      {pelada.vacilos > 0 && ` · ${pelada.vacilos} vacilos`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-bold tabular-nums",
                      pelada.score > 0 ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {formatScore(pelada.score)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TeamBreakdownRow({
  team,
  onSelect,
}: {
  team: TeamPersonalStats;
  isActive: boolean;
  onSelect: () => void;
}) {
  const hasStats =
    team.goals > 0 ||
    team.assists > 0 ||
    team.god_saves > 0 ||
    team.vacilos > 0 ||
    team.score !== 0 ||
    team.peladas_jogadas > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted/50"
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
          "bg-muted text-muted-foreground"
        )}
      >
        {team.team_name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{team.team_name}</p>
        <p className="text-xs text-muted-foreground">
          {hasStats ? (
            <>
              {team.goals}G · {team.assists}A · {team.peladas_jogadas} peladas ·{" "}
              {team.rank}º lugar
            </>
          ) : (
            "Sem stats ainda"
          )}
        </p>
      </div>
      <span className="shrink-0 text-sm font-bold tabular-nums text-primary">
        {formatScore(team.score)}
      </span>
    </button>
  );
}
