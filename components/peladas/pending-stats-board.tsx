"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import {
  approvePlayerStat,
  rejectPlayerStat,
} from "@/lib/actions/pelada-actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import type { Participant, PlayerStat } from "@/types";

interface PendingStatsBoardProps {
  pendingStats: PlayerStat[];
  participants: Participant[];
}

function formatStatLine(stat: PlayerStat): string {
  const parts: string[] = [];
  if (stat.goals > 0) parts.push(`${stat.goals}G`);
  if (stat.assists > 0) parts.push(`${stat.assists}A`);
  if (stat.god_saves > 0) parts.push(`${stat.god_saves} defesas`);
  if (stat.vacilos > 0) parts.push(`${stat.vacilos} vacilos`);
  if (stat.own_goals > 0) parts.push(`${stat.own_goals} GC`);
  return parts.length > 0 ? parts.join(" · ") : "Sem stats";
}

export function PendingStatsBoard({
  pendingStats,
  participants,
}: PendingStatsBoardProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  if (pendingStats.length === 0) return null;

  function handleAction(statId: string, action: "approve" | "reject") {
    setPendingId(statId);
    startTransition(async () => {
      const result =
        action === "approve"
          ? await approvePlayerStat(statId)
          : await rejectPlayerStat(statId);

      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(result.success ?? "Atualizado.", "success");
        router.refresh();
      }
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-3">
      {pendingStats.map((stat) => {
        const participant = participants.find(
          (p) => p.type === "member" && p.id === stat.user_id
        );
        const name = participant?.nickname ?? participant?.displayName ?? "Jogador";
        const busy = isPending && pendingId === stat.id;

        return (
          <div
            key={stat.id}
            className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">
                {formatStatLine(stat)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9"
                disabled={busy}
                onClick={() => handleAction(stat.id, "reject")}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="mr-1 h-4 w-4" />
                    Rejeitar
                  </>
                )}
              </Button>
              <Button
                size="sm"
                className="h-9"
                disabled={busy}
                onClick={() => handleAction(stat.id, "approve")}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Aprovar
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
