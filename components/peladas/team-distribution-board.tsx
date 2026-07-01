"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Shuffle, Trash2, Users } from "lucide-react";
import {
  clearTeamDistribution,
  generateTeamDistribution,
  movePlayer,
  restoreOriginalDistribution,
} from "@/lib/actions/team-distribution-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TeamDistribution } from "@/types";
import { cn } from "@/lib/utils";

interface TeamDistributionBoardProps {
  peladaId: string;
  distribution: TeamDistribution;
  canManage: boolean;
}

type FeedbackMessage = {
  type: "error" | "success";
  text: string;
};

function feedbackStorageKey(peladaId: string) {
  return `team-dist-feedback-${peladaId}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatSkill(skill: number) {
  return skill.toFixed(1);
}

export function TeamDistributionBoard({
  peladaId,
  distribution,
  canManage,
}: TeamDistributionBoardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [playersPerTeam, setPlayersPerTeam] = useState(
    distribution.playersPerTeam
  );
  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  const hasTeams = distribution.teams.length > 0;
  const teamCount = distribution.teams.length;

  useEffect(() => {
    const raw = sessionStorage.getItem(feedbackStorageKey(peladaId));
    if (!raw) return;

    sessionStorage.removeItem(feedbackStorageKey(peladaId));
    try {
      setMessage(JSON.parse(raw) as FeedbackMessage);
    } catch {
      // ignore invalid feedback payload
    }
  }, [peladaId]);

  function persistFeedback(result: { error?: string; success?: string }) {
    if (result.error) {
      sessionStorage.setItem(
        feedbackStorageKey(peladaId),
        JSON.stringify({ type: "error", text: result.error })
      );
      return;
    }

    if (result.success) {
      sessionStorage.setItem(
        feedbackStorageKey(peladaId),
        JSON.stringify({ type: "success", text: result.success })
      );
    }
  }

  function handleGenerate(isRedistribute: boolean) {
    setMessage(null);
    startTransition(async () => {
      const result = await generateTeamDistribution(
        peladaId,
        playersPerTeam,
        isRedistribute
      );
      persistFeedback(result);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      router.refresh();
    });
  }

  function handleRestoreOriginal() {
    setMessage(null);
    startTransition(async () => {
      const result = await restoreOriginalDistribution(peladaId);
      persistFeedback(result);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      router.refresh();
    });
  }

  function handleClear() {
    setMessage(null);
    startTransition(async () => {
      const result = await clearTeamDistribution(peladaId);
      persistFeedback(result);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      router.refresh();
    });
  }

  function handleMove(
    participantId: string,
    participantType: "member" | "fictional",
    toTeamIndex: number,
    currentTeamIndex: number
  ) {
    if (toTeamIndex === currentTeamIndex) return;

    setMessage(null);
    startTransition(async () => {
      const result = await movePlayer(
        peladaId,
        participantId,
        participantType,
        toTeamIndex
      );
      if (result.error) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="playersPerTeam">Jogadores por time</Label>
            <Input
              id="playersPerTeam"
              type="number"
              min={2}
              max={20}
              value={playersPerTeam}
              onChange={(e) =>
                setPlayersPerTeam(Number(e.target.value) || 5)
              }
              className="h-10 w-32"
              disabled={pending}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => handleGenerate(hasTeams)}
              disabled={pending || distribution.presentCount < 2}
            >
              {pending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shuffle className="mr-2 h-4 w-4" />
              )}
              {hasTeams ? "Redistribuir" : "Distribuir"}
            </Button>
            {hasTeams && distribution.hasOriginalSnapshot && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRestoreOriginal}
                disabled={pending || !distribution.hasManualChanges}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restaurar original
              </Button>
            )}
            {hasTeams && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={pending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      )}

      {message && (
        <div
          className={cn(
            "rounded-md border px-4 py-3 text-sm",
            message.type === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-primary/40 bg-primary/10 text-primary"
          )}
        >
          {message.text}
        </div>
      )}

      {distribution.presentCount < 2 && (
        <p className="text-sm text-muted-foreground">
          Confirme a presença de pelo menos 2 jogadores para formar times.
        </p>
      )}

      {distribution.unassignedPlayers.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          {distribution.unassignedPlayers.length} jogador
          {distribution.unassignedPlayers.length !== 1 ? "es" : ""} confirmado
          {distribution.unassignedPlayers.length !== 1 ? "s" : ""} sem time —
          {canManage ? " redistribua para incluí-los." : " aguarde o admin."}
        </div>
      )}

      {!hasTeams && distribution.presentCount >= 2 && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
          <Users className="h-5 w-5 shrink-0" />
          <span>
            {distribution.presentCount} jogadores confirmados —{" "}
            {canManage
              ? "clique em Distribuir para equilibrar os times pelo score médio."
              : "o admin ainda não formou os times."}
          </span>
        </div>
      )}

      {hasTeams && (
        <div
          className={cn(
            "grid gap-4",
            teamCount <= 2
              ? "sm:grid-cols-2"
              : teamCount === 3
                ? "sm:grid-cols-2 lg:grid-cols-3"
                : "sm:grid-cols-2 lg:grid-cols-4"
          )}
        >
          {distribution.teams.map((teamPlayers, teamIndex) => (
            <div
              key={teamIndex}
              className="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-semibold">Time {teamIndex + 1}</h3>
                <span className="text-xs text-muted-foreground">
                  {teamPlayers.length} jog.
                  {distribution.teamTotals[teamIndex] !== undefined && (
                    <> · {formatSkill(distribution.teamTotals[teamIndex])} pts</>
                  )}
                </span>
              </div>

              <ul className="space-y-2">
                {teamPlayers.map((player) => (
                  <li
                    key={player.participantId}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={player.avatarUrl ?? undefined}
                          alt={player.displayName}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(player.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {player.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatSkill(player.skill)} pts/pelada
                          {player.peladasJogadas === 0 && " · novato"}
                        </p>
                      </div>
                    </div>

                    {canManage && teamCount > 1 && (
                      <select
                        aria-label={`Mover ${player.displayName}`}
                        className="h-8 max-w-[7rem] shrink-0 rounded-md border border-input bg-background px-2 text-xs"
                        value={teamIndex}
                        disabled={pending}
                        onChange={(e) =>
                          handleMove(
                            player.participantId,
                            player.participantType,
                            Number(e.target.value),
                            teamIndex
                          )
                        }
                      >
                        {distribution.teams.map((_, index) => (
                          <option key={index} value={index}>
                            Time {index + 1}
                          </option>
                        ))}
                      </select>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
