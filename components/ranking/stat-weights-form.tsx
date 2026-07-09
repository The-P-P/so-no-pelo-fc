"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Loader2, Save } from "lucide-react";
import {
  updateTeamStatWeights,
  type RankingActionResult,
} from "@/lib/actions/ranking-actions";
import {
  STAT_FIELDS,
  WEIGHT_LABELS,
  formatWeightsDescription,
} from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TeamStatWeights } from "@/types";

const initialState: RankingActionResult = {};

interface StatWeightsFormProps {
  weights: TeamStatWeights;
  onSaved?: () => void | Promise<void>;
  /** When true, renders without outer Card (for embedding in RankingSection). */
  embedded?: boolean;
}

function toWeightRecord(weights: TeamStatWeights) {
  return {
    goals: weights.goals,
    assists: weights.assists,
    god_saves: weights.god_saves,
    vacilos: weights.vacilos,
    own_goals: weights.own_goals,
  };
}

export function StatWeightsForm({
  weights,
  onSaved,
  embedded = false,
}: StatWeightsFormProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [state, action, pending] = useActionState(
    updateTeamStatWeights,
    initialState
  );

  const summary = formatWeightsDescription(toWeightRecord(weights));

  useEffect(() => {
    if (!state.success) return;

    setExpanded(false);

    void (async () => {
      await onSaved?.();
      router.refresh();
    })();
  }, [state.savedAt, state.success, onSaved, router]);

  const toggleButton = (
    <button
      type="button"
      className={cn("w-full text-left", embedded && "border-t border-border pt-4")}
      onClick={() => setExpanded((open) => !open)}
    >
      {embedded ? (
        <div className="flex flex-row items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Pesos do ranking</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {expanded
                ? "Defina quanto cada stat vale na pontuação do grupo"
                : summary}
            </p>
          </div>
          <span className="mt-0.5 shrink-0 text-muted-foreground">
            {expanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </span>
        </div>
      ) : (
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">Pesos do ranking</CardTitle>
            <CardDescription className="mt-1">
              {expanded
                ? "Defina quanto cada stat vale na pontuação do grupo"
                : summary}
            </CardDescription>
          </div>
          <span className="mt-0.5 shrink-0 text-muted-foreground">
            {expanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </span>
        </CardHeader>
      )}
    </button>
  );

  const formContent = (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
          {state.success}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_FIELDS.map((key) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`weight-${key}`}>{WEIGHT_LABELS[key]}</Label>
            <Input
              id={`weight-${key}`}
              name={key}
              type="number"
              step={1}
              defaultValue={weights[key]}
              disabled={pending}
              className="h-10"
            />
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Use valores negativos para penalidades (ex.: vacilo −1, gol contra
        −2).
      </p>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Salvar pesos
          </>
        )}
      </Button>
    </form>
  );

  if (embedded) {
    return (
      <div>
        {toggleButton}
        <div className={cn("pt-3", !expanded && "hidden")}>{formContent}</div>
      </div>
    );
  }

  return (
    <Card>
      {toggleButton}
      <CardContent className={cn(!expanded && "hidden")}>{formContent}</CardContent>
    </Card>
  );
}
