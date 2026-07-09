"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Loader2, Users } from "lucide-react";
import { awardTeamVictory } from "@/lib/actions/ranked-actions";
import { VICTORY_PDL } from "@/lib/ranked";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import type { TeamDistribution } from "@/types";
import { cn } from "@/lib/utils";

const TEAM_COLORS = [
  "border-blue-500/40 bg-blue-500/5",
  "border-orange-500/40 bg-orange-500/5",
  "border-green-500/40 bg-green-500/5",
  "border-purple-500/40 bg-purple-500/5",
  "border-pink-500/40 bg-pink-500/5",
  "border-cyan-500/40 bg-cyan-500/5",
];

const VICTORY_DEBOUNCE_MS = 2000;

interface TeamVictoryBoardProps {
  peladaId: string;
  distribution: TeamDistribution | null;
  victoryCounts: Record<string, number>;
  onIndividualVictory?: () => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getTeamVictoryCount(
  teamPlayers: TeamDistribution["teams"][number],
  victoryCounts: Record<string, number>
) {
  return teamPlayers
    .filter((player) => player.participantType === "member")
    .reduce((sum, player) => sum + (victoryCounts[player.participantId] ?? 0), 0);
}

export function TeamVictoryBoard({
  peladaId,
  distribution,
  victoryCounts,
  onIndividualVictory,
}: TeamVictoryBoardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [pendingTeamIndex, setPendingTeamIndex] = useState<number | null>(null);
  const [localVictoryCounts, setLocalVictoryCounts] =
    useState(victoryCounts);
  const [celebratingTeam, setCelebratingTeam] = useState<number | null>(null);
  const lastAwardRef = useRef(0);

  useEffect(() => {
    setLocalVictoryCounts(victoryCounts);
  }, [victoryCounts]);

  if (!distribution || distribution.teams.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="mb-1 font-medium">Times ainda não distribuídos</p>
        <p className="mb-4 text-sm text-muted-foreground">
          Distribua os times na pelada para marcar vitórias com um toque.
        </p>
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/peladas/${peladaId}`}>
              Ir distribuir times
            </Link>
          </Button>
          {onIndividualVictory && (
            <Button variant="secondary" size="sm" onClick={onIndividualVictory}>
              <Crown className="mr-2 h-4 w-4" />
              Marcar vitória individual
            </Button>
          )}
        </div>
      </div>
    );
  }

  function handleTeamVictory(teamIndex: number) {
    const now = Date.now();
    if (now - lastAwardRef.current < VICTORY_DEBOUNCE_MS) {
      showToast("Aguarde um momento antes de marcar outra vitória.", "error");
      return;
    }

    setPendingTeamIndex(teamIndex);
    startTransition(async () => {
      const result = await awardTeamVictory(peladaId, teamIndex);

      if (result.error) {
        showToast(result.error, "error");
        setPendingTeamIndex(null);
        return;
      }

      lastAwardRef.current = Date.now();
      setCelebratingTeam(teamIndex);
      window.setTimeout(() => setCelebratingTeam(null), 1200);

      if (result.awarded) {
        setLocalVictoryCounts((current) => {
          const next = { ...current };
          for (const userId of result.awarded!) {
            next[userId] = (next[userId] ?? 0) + 1;
          }
          return next;
        });
      }

      showToast(result.success ?? "Vitória registrada!");
      setPendingTeamIndex(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {distribution.teams.map((teamPlayers, teamIndex) => {
          const teamVictories = getTeamVictoryCount(
            teamPlayers,
            localVictoryCounts
          );
          const memberCount = teamPlayers.filter(
            (player) => player.participantType === "member"
          ).length;
          const isCelebrating = celebratingTeam === teamIndex;
          const isLoading = pending && pendingTeamIndex === teamIndex;
          const colorClass = TEAM_COLORS[teamIndex % TEAM_COLORS.length];

          return (
            <div
              key={teamIndex}
              className={cn(
                "rounded-xl border p-4 transition-all",
                colorClass,
                isCelebrating && "scale-[1.02] ring-2 ring-yellow-500/50"
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-semibold">Time {teamIndex + 1}</h3>
                {teamVictories > 0 && (
                  <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                    {teamVictories} vitória{teamVictories !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {teamPlayers.map((player) => (
                  <div
                    key={player.participantId}
                    className="flex items-center gap-1.5 rounded-full bg-background/60 px-2 py-1"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={player.avatarUrl ?? undefined}
                        alt={player.displayName}
                      />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(player.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[80px] truncate text-xs">
                      {player.displayName}
                    </span>
                    {player.participantType === "member" &&
                      (localVictoryCounts[player.participantId] ?? 0) > 0 && (
                        <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400">
                          {localVictoryCounts[player.participantId]}
                        </span>
                      )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                className="h-12 w-full text-base font-semibold"
                variant="default"
                disabled={pending || memberCount === 0}
                onClick={() => handleTeamVictory(teamIndex)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Crown className="mr-2 h-5 w-5" />
                    Time {teamIndex + 1} venceu!
                  </>
                )}
              </Button>

              {memberCount > 0 && (
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  +{memberCount * VICTORY_PDL} PDL ({memberCount} jogador
                  {memberCount !== 1 ? "es" : ""})
                </p>
              )}
            </div>
          );
        })}
      </div>

      {onIndividualVictory && (
        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onIndividualVictory}
          >
            Marcar vitória individual
          </Button>
        </div>
      )}
    </div>
  );
}
