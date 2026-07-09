"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  decrementOwnStat,
  decrementStat,
  incrementOwnStat,
  incrementStat,
} from "@/lib/actions/pelada-actions";
import {
  decrementVictory,
  incrementVictory,
} from "@/lib/actions/ranked-actions";
import {
  ADMIN_BOARD_FIELDS,
  BOARD_EMOJIS,
  BOARD_LABELS,
  PLAYER_BOARD_FIELDS,
  STAT_EMOJIS,
  STAT_LABELS,
  type BoardField,
  type StatField,
} from "@/lib/stats";
import { VICTORY_PDL } from "@/lib/ranked";
import { Button } from "@/components/ui/button";
import { STAT_STATUS_LABELS, type Participant, type PlayerStat } from "@/types";
import { cn } from "@/lib/utils";

interface StatBoardProps {
  peladaId: string;
  participants: Participant[];
  stats: PlayerStat[];
  victoryCounts?: Record<string, number>;
  mode: "admin" | "player";
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
  onError,
}: {
  peladaId: string;
  participant: Participant;
  field: StatField;
  value: number;
  mode: "admin" | "player";
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function handleAdjust(delta: 1 | -1) {
    setLocalValue((current) => current + delta);

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
      if (result.error) {
        setLocalValue((current) => current - delta);
        onError(result.error);
      } else {
        router.refresh();
      }
    });
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
          disabled={pending || localValue <= 0}
        >
          −1
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-1 text-xs text-primary"
          onClick={() => handleAdjust(1)}
          disabled={pending}
        >
          +1
        </Button>
      </div>
    </div>
  );
}

function VictoryButton({
  peladaId,
  participant,
  value,
  onError,
}: {
  peladaId: string;
  participant: Participant;
  value: number;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localValue, setLocalValue] = useState(value);
  const disabled = participant.type === "fictional";

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function handleAdjust(delta: 1 | -1) {
    if (disabled) return;

    setLocalValue((current) => current + delta);

    startTransition(async () => {
      const action = delta === 1 ? incrementVictory : decrementVictory;
      const result = await action(peladaId, participant.id);
      if (result.error) {
        setLocalValue((current) => current - delta);
        onError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-1.5">
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs">{BOARD_EMOJIS.victories}</span>
        <span className="text-center text-[10px] leading-tight text-muted-foreground">
          {BOARD_LABELS.victories}
        </span>
        <span className="text-sm font-bold">{localValue}</span>
        {localValue > 0 && (
          <span className="text-[9px] text-yellow-700 dark:text-yellow-400">
            +{localValue * VICTORY_PDL} PDL
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-1 text-xs"
          onClick={() => handleAdjust(-1)}
          disabled={pending || disabled || localValue <= 0}
        >
          −1
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-1 text-xs text-yellow-700 dark:text-yellow-400"
          onClick={() => handleAdjust(1)}
          disabled={pending || disabled}
        >
          +1
        </Button>
      </div>
    </div>
  );
}

function BoardCell({
  peladaId,
  participant,
  field,
  stats,
  victoryCounts,
  mode,
  onError,
}: {
  peladaId: string;
  participant: Participant;
  field: BoardField | StatField;
  stats: PlayerStat[];
  victoryCounts: Record<string, number>;
  mode: "admin" | "player";
  onError: (message: string) => void;
}) {
  if (field === "victories") {
    const value =
      participant.type === "member"
        ? (victoryCounts[participant.id] ?? 0)
        : 0;
    return (
      <VictoryButton
        peladaId={peladaId}
        participant={participant}
        value={value}
        onError={onError}
      />
    );
  }

  return (
    <StatButton
      peladaId={peladaId}
      participant={participant}
      field={field}
      value={getStatValue(stats, participant, field)}
      mode={mode}
      onError={onError}
    />
  );
}

export function StatBoard({
  peladaId,
  participants,
  stats,
  victoryCounts = {},
  mode,
}: StatBoardProps) {
  const [error, setError] = useState<string | null>(null);
  const fields: (BoardField | StatField)[] =
    mode === "admin" ? ADMIN_BOARD_FIELDS : PLAYER_BOARD_FIELDS;

  if (participants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {mode === "player"
          ? "Confirme sua presença para lançar suas estatísticas."
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
        const displayName = participant.nickname ?? participant.displayName;
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {fields.map((field) => (
                <BoardCell
                  key={field}
                  peladaId={peladaId}
                  participant={participant}
                  field={field}
                  stats={stats}
                  victoryCounts={victoryCounts}
                  mode={mode}
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
