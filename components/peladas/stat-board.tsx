"use client";

import { useTransition } from "react";
import { incrementStat } from "@/lib/actions/pelada-actions";
import { STAT_EMOJIS, STAT_LABELS, type StatField } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import type { Participant, PlayerStat } from "@/types";

const STAT_FIELDS: StatField[] = ["goals", "assists", "god_saves", "vacilos"];

interface StatBoardProps {
  peladaId: string;
  participants: Participant[];
  stats: PlayerStat[];
}

function getStatValue(
  stats: PlayerStat[],
  participant: Participant,
  field: StatField
): number {
  const stat = stats.find((s) =>
    participant.type === "member"
      ? s.user_id === participant.id
      : s.fictional_player_id === participant.id
  );
  return stat ? (stat[field] as number) : 0;
}

function StatButton({
  peladaId,
  participant,
  field,
  value,
}: {
  peladaId: string;
  participant: Participant;
  field: StatField;
  value: number;
}) {
  const [pending, startTransition] = useTransition();

  function handleIncrement() {
    startTransition(async () => {
      await incrementStat(peladaId, participant.id, participant.type, field);
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-auto flex-col gap-0.5 px-2 py-1.5"
      onClick={handleIncrement}
      disabled={pending}
    >
      <span className="text-xs">{STAT_EMOJIS[field]}</span>
      <span className="text-[10px] leading-tight text-muted-foreground">
        {STAT_LABELS[field]}
      </span>
      <span className="text-sm font-bold">{value}</span>
      <span className="text-[10px] text-primary">+1</span>
    </Button>
  );
}

export function StatBoard({ peladaId, participants, stats }: StatBoardProps) {
  if (participants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum participante no elenco. Adicione membros ou jogadores fictícios em{" "}
        <strong>Membros</strong>.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {participants.map((participant) => {
        const displayName = participant.nickname ?? participant.displayName;

        return (
          <div
            key={`${participant.type}-${participant.id}`}
            className="rounded-lg border border-border p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <p className="font-medium">{displayName}</p>
              {participant.type === "fictional" && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Fictício
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STAT_FIELDS.map((field) => (
                <StatButton
                  key={field}
                  peladaId={peladaId}
                  participant={participant}
                  field={field}
                  value={getStatValue(stats, participant, field)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
