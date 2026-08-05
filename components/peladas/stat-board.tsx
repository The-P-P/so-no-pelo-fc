"use client";

import { useEffect, useState, useTransition } from "react";
import {
  decrementOwnStat,
  decrementStat,
  incrementOwnStat,
  incrementStat,
} from "@/lib/actions/pelada-actions";
import {
  ADMIN_BOARD_FIELDS,
  PLAYER_BOARD_FIELDS,
  STAT_EMOJIS,
  STAT_LABELS,
  type BoardField,
  type StatField,
} from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { STAT_STATUS_LABELS, type Participant, type PlayerStat } from "@/types";
import { cn } from "@/lib/utils";

interface StatBoardProps {
  peladaId: string;
  participants: Participant[];
  stats: PlayerStat[];
  mode: "admin" | "player";
  readOnly?: boolean;
}

function getPlayerStat(
  stats: PlayerStat[],
  participant: Participant
): PlayerStat | undefined {
  return stats.find((s) =>
    participant.type === "member"
      ? s.user_id === participant.id
      : s.fictional_player_id === participant.id
  );
}

function getStatValue(
  stats: PlayerStat[],
  participant: Participant,
  field: StatField
): number {
  const stat = getPlayerStat(stats, participant);
  return stat ? (stat[field] as number) : 0;
}

function StatButton({
  peladaId,
  participant,
  field,
  value,
  mode,
  readOnly,
  onError,
}: {
  peladaId: string;
  participant: Participant;
  field: StatField;
  value: number;
  mode: "admin" | "player";
  readOnly?: boolean;
  onError: (message: string) => void;
}) {
  const [, startTransition] = useTransition();
  const [localValue, setLocalValue] = useState(value);
  const [inFlight, setInFlight] = useState(0);

  useEffect(() => {
    // Keep server value when no optimistic edits are in flight
    if (inFlight === 0) {
      setLocalValue(value);
    }
  }, [value, inFlight]);

  function handleAdjust(delta: 1 | -1) {
    if (readOnly) return;
    if (delta === -1 && localValue <= 0) return;

    setLocalValue((current) => current + delta);
    setInFlight((n) => n + 1);

    startTransition(async () => {
      let result;
      if (mode === "player") {
        const action = delta === 1 ? incrementOwnStat : decrementOwnStat;
        result = await action(peladaId, field);
      } else {
        const action = delta === 1 ? incrementStat : decrementStat;
        result = await action(
          peladaId,
          participant.id,
          participant.type,
          field
        );
      }
      setInFlight((n) => n - 1);
      if (result.error) {
        setLocalValue((current) => current - delta);
        onError(result.error);
      }
    });
  }

  if (readOnly) {
    return (
      <div className="flex flex-col items-center gap-0.5 rounded-lg border border-border p-1.5">
        <span className="text-xs">{STAT_EMOJIS[field]}</span>
        <span className="text-center text-[10px] leading-tight text-muted-foreground">
          {STAT_LABELS[field]}
        </span>
        <span className="text-sm font-bold">{localValue}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-1.5">
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs">{STAT_EMOJIS[field]}</span>
        <span className="text-center text-[10px] leading-tight text-muted-foreground">
          {STAT_LABELS[field]}
        </span>
        <span className="text-sm font-bold">{localValue}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-1 text-xs"
          onClick={() => handleAdjust(-1)}
          disabled={localValue <= 0}
        >
          −1
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-1 text-xs text-primary"
          onClick={() => handleAdjust(1)}
        >
          +1
        </Button>
      </div>
    </div>
  );
}

export function StatBoard({
  peladaId,
  participants,
  stats,
  mode,
  readOnly = false,
}: StatBoardProps) {
  const [error, setError] = useState<string | null>(null);
  const fields: (BoardField | StatField)[] =
    mode === "admin" ? ADMIN_BOARD_FIELDS : PLAYER_BOARD_FIELDS;

  if (participants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {mode === "player"
          ? "Você não faz parte do elenco deste grupo."
          : "Nenhum participante no elenco. Adicione membros ou jogadores fictícios em Membros."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {participants.map((participant) => {
        const displayName = participant.displayName ?? "Jogador";
        const playerStat = getPlayerStat(stats, participant);
        const isPending = playerStat?.status === "pending";
        const isApproved = playerStat?.status === "approved";

        return (
          <div
            key={`${participant.type}-${participant.id}`}
            className={cn(
              "rounded-lg border p-4",
              isPending && mode === "player" && "border-amber-500/40 bg-amber-500/5"
            )}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="font-medium">{displayName}</p>
              {participant.type === "fictional" && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Fictício
                </span>
              )}
              {mode === "player" && isPending && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  {STAT_STATUS_LABELS.pending}
                </span>
              )}
              {mode === "player" && isApproved && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  {STAT_STATUS_LABELS.approved}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {fields.map((field) => (
                <StatButton
                  key={field}
                  peladaId={peladaId}
                  participant={participant}
                  field={field}
                  value={getStatValue(stats, participant, field)}
                  mode={mode}
                  readOnly={readOnly}
                  onError={setError}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
