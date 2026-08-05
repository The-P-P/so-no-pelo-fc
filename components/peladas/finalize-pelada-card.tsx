"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, Loader2, RotateCcw } from "lucide-react";
import {
  finalizePelada,
  reopenPelada,
} from "@/lib/actions/pelada-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PELADA_STATUS_LABELS, type PeladaStatus } from "@/types";
import { useState } from "react";

interface FinalizePeladaCardProps {
  peladaId: string;
  status: PeladaStatus;
  pendingCount: number;
}

export function FinalizePeladaCard({
  peladaId,
  status,
  pendingCount,
}: FinalizePeladaCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isFinished = status === "finished";
  const canFinalize = !isFinished && pendingCount === 0;

  function handleFinalize() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await finalizePelada(peladaId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(result.success ?? "Pelada finalizada!");
      router.refresh();
    });
  }

  function handleReopen() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await reopenPelada(peladaId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(result.success ?? "Pelada reaberta!");
      router.refresh();
    });
  }

  return (
    <Card className={isFinished ? "border-primary/30" : undefined}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">Status da pelada</CardTitle>
          <span
            className={
              isFinished
                ? "rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
                : "rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
            }
          >
            {PELADA_STATUS_LABELS[status]}
          </span>
        </div>
        <CardDescription>
          {isFinished
            ? "Stats travadas e já contam no ranking. Reabra para corrigir."
            : "Quando terminar de lançar tudo, finalize para as stats entrarem no ranking."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            {success}
          </p>
        )}

        {!isFinished && pendingCount > 0 && (
          <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            Ainda há {pendingCount} estatística(s) pendente(s). Aprove ou
            rejeite antes de finalizar.
          </p>
        )}

        {isFinished ? (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={pending}
            onClick={handleReopen}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Reabrir pelada
          </Button>
        ) : (
          <Button
            type="button"
            className="w-full gap-2"
            disabled={pending || !canFinalize}
            onClick={handleFinalize}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Finalizar pelada
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
