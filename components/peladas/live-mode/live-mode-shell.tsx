"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Radio, Undo2 } from "lucide-react";
import { QuickStatBar } from "@/components/peladas/live-mode/quick-stat-bar";
import { TeamVictoryBoard } from "@/components/peladas/live-mode/team-victory-board";
import {
  PlayerPickerSheet,
} from "@/components/peladas/live-mode/player-picker-sheet";
import { revokeLastVictoryBatch } from "@/lib/actions/ranked-actions";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import type { Participant, TeamDistribution } from "@/types";

interface LiveModeShellProps {
  peladaId: string;
  peladaTitle: string;
  peladaSubtitle: string;
  isAdmin: boolean;
  participants: Participant[];
  teamDistribution: TeamDistribution | null;
  victoryCounts: Record<string, number>;
}

export function LiveModeShell({
  peladaId,
  peladaTitle,
  peladaSubtitle,
  isAdmin,
  participants,
  teamDistribution,
  victoryCounts,
}: LiveModeShellProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [victoryPickerOpen, setVictoryPickerOpen] = useState(false);
  const [removeVictoryPickerOpen, setRemoveVictoryPickerOpen] = useState(false);

  const totalVictories = Object.values(victoryCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  function handleRevokeLastVictory() {
    startTransition(async () => {
      const result = await revokeLastVictoryBatch(peladaId);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(result.success ?? "Vitória desfeita!");
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-dvh flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-24">
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild>
            <Link href={`/dashboard/peladas/${peladaId}`}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Sair do modo ao vivo</span>
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 shrink-0 animate-pulse text-red-500" />
              <p className="truncate font-semibold">{peladaTitle}</p>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {peladaSubtitle}
              {isAdmin && totalVictories > 0 && (
                <> · {totalVictories} vitória{totalVictories !== 1 ? "s" : ""}</>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 p-4">
        {isAdmin ? (
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Vitórias por time
              </h2>
              {totalVictories > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={handleRevokeLastVictory}
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  Desfazer última
                </Button>
              )}
            </div>
            <TeamVictoryBoard
              peladaId={peladaId}
              distribution={teamDistribution}
              victoryCounts={victoryCounts}
              onIndividualVictory={() => setVictoryPickerOpen(true)}
              onRemoveIndividualVictory={() => setRemoveVictoryPickerOpen(true)}
            />
          </section>
        ) : (
          <section className="rounded-xl border border-border bg-muted/30 p-6 text-center">
            <p className="font-medium">Modo ao vivo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use os botões abaixo para registrar suas estatísticas durante a
              partida.
            </p>
          </section>
        )}
      </div>

      <QuickStatBar
        peladaId={peladaId}
        participants={isAdmin ? participants : participants.slice(0, 1)}
        isAdmin={isAdmin}
        onSuccess={(message) => showToast(message)}
        onError={(message) => showToast(message, "error")}
      />

      {isAdmin && (
        <>
          <PlayerPickerSheet
            open={victoryPickerOpen}
            onOpenChange={setVictoryPickerOpen}
            peladaId={peladaId}
            participants={participants}
            mode="victory"
            isAdmin
            onSuccess={(message) => showToast(message)}
            onError={(message) => showToast(message, "error")}
          />
          <PlayerPickerSheet
            open={removeVictoryPickerOpen}
            onOpenChange={setRemoveVictoryPickerOpen}
            peladaId={peladaId}
            participants={participants}
            mode="remove_victory"
            isAdmin
            onSuccess={(message) => showToast(message)}
            onError={(message) => showToast(message, "error")}
          />
        </>
      )}
    </div>
  );
}
