"use client";

import Link from "next/link";
import { ArrowLeft, Radio } from "lucide-react";
import { QuickStatBar } from "@/components/peladas/live-mode/quick-stat-bar";
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
}

export function LiveModeShell({
  peladaId,
  peladaTitle,
  peladaSubtitle,
  isAdmin,
  participants,
}: LiveModeShellProps) {
  const { showToast } = useToast();

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
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 p-4">
        <section className="rounded-xl border border-border bg-muted/30 p-6 text-center">
          <p className="font-medium">Modo ao vivo</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use os botões abaixo para registrar estatísticas durante a partida.
          </p>
        </section>
      </div>

      <QuickStatBar
        peladaId={peladaId}
        participants={isAdmin ? participants : participants.slice(0, 1)}
        isAdmin={isAdmin}
        onSuccess={(message) => showToast(message)}
        onError={(message) => showToast(message, "error")}
      />
    </div>
  );
}
