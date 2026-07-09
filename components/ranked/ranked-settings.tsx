"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import {
  startNewSeason,
  updateRankedTopTierName,
  type RankedActionResult,
} from "@/lib/actions/ranked-actions";
import { ELO_STEP_POINTS, FIXED_ELO_NAMES, VICTORY_PDL } from "@/lib/ranked";
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

const initialState: RankedActionResult = {};

function formatEloLadderSummary(customTopName: string): string {
  const top = customTopName.trim() || "FENDA";
  const first = ELO_STEP_POINTS[0];
  const last = ELO_STEP_POINTS[ELO_STEP_POINTS.length - 1];
  return `Bronze (${first}) → ${top} (${last})`;
}

function RankedTopTierForm({
  customTopName,
  onSaved,
}: {
  customTopName: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [nameState, nameAction, namePending] = useActionState(
    updateRankedTopTierName,
    initialState
  );

  useEffect(() => {
    if (nameState.success) {
      setExpanded(false);
      onSaved?.();
      router.refresh();
    }
  }, [nameState.success, router, onSaved]);

  return (
    <div className="border-t border-border pt-4">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={() => setExpanded((open) => !open)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 shrink-0" />
            Nome do elo máximo
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {expanded
              ? "O último elo é exclusivo do seu grupo"
              : `Elo atual: ${customTopName || "FENDA"}`}
          </p>
        </div>
        <span className="mt-0.5 shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </span>
      </button>

      <form
        action={nameAction}
        className={cn("space-y-3 pt-3", !expanded && "hidden")}
      >
        {nameState.error && (
          <p className="text-sm text-destructive">{nameState.error}</p>
        )}
        {nameState.success && (
          <p className="text-sm text-primary">{nameState.success}</p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 space-y-2">
            <Label htmlFor="topTierName">Nome customizado</Label>
            <Input
              id="topTierName"
              name="topTierName"
              defaultValue={customTopName}
              placeholder="FENDA"
              className="h-10"
              required
              minLength={2}
              disabled={namePending}
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="sm:self-end"
            disabled={namePending}
          >
            {namePending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

interface RankedSeasonActionsProps {
  canManageTeam: boolean;
  embedded?: boolean;
}

export function RankedSeasonActions({
  canManageTeam,
  embedded = true,
}: RankedSeasonActionsProps) {
  const router = useRouter();
  const [seasonPending, startSeasonTransition] = useTransition();

  if (!canManageTeam) return null;

  function handleNewSeason() {
    if (
      !confirm(
        "Iniciar nova temporada? O PDL de todos será zerado neste grupo."
      )
    ) {
      return;
    }

    startSeasonTransition(async () => {
      const result = await startNewSeason();
      if (!result.error) router.refresh();
    });
  }

  return (
    <div className={cn(embedded && "border-t border-border pt-4")}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleNewSeason}
        disabled={seasonPending}
      >
        {seasonPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Nova temporada
          </>
        )}
      </Button>
    </div>
  );
}

interface RankedEloLadderProps {
  customTopName: string;
  isOwner: boolean;
  embedded?: boolean;
}

export function RankedEloLadder({
  customTopName,
  isOwner,
  embedded = true,
}: RankedEloLadderProps) {
  const [expanded, setExpanded] = useState(false);
  const handleTopTierSaved = useCallback(() => setExpanded(false), []);

  const eloLadder = [...FIXED_ELO_NAMES, customTopName || "FENDA"].map(
    (name, index) => ({
      name,
      points: ELO_STEP_POINTS[index] ?? null,
    })
  );

  const summary = formatEloLadderSummary(customTopName);

  return (
    <div className={cn(embedded && "border-t border-border pt-4")}>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={() => setExpanded((open) => !open)}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Escada de elos</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {expanded
              ? "Bronze precisa de 300 PDL para subir; cada elo seguinte +100"
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
      </button>

      <div className={cn("space-y-4 pt-3", !expanded && "hidden")}>
        <div className="flex flex-wrap gap-2">
          {eloLadder.map((elo, index) => (
            <span
              key={`${elo.name}-${index}`}
              className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium"
            >
              {elo.name}
              {elo.points !== null && (
                <span className="ml-1 text-muted-foreground">
                  ({elo.points})
                </span>
              )}
            </span>
          ))}
        </div>

        {isOwner && (
          <RankedTopTierForm
            customTopName={customTopName}
            onSaved={handleTopTierSaved}
          />
        )}
      </div>
    </div>
  );
}

interface RankedSeasonCardProps {
  seasonName: string;
  canManageTeam: boolean;
}

/** @deprecated Use RankedSeasonActions inside RankingSection */
export function RankedSeasonCard({
  seasonName,
  canManageTeam,
}: RankedSeasonCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Temporada ativa</CardTitle>
        <CardDescription>
          {seasonName} · vitória = +{VICTORY_PDL} PDL · sem penalidade por
          derrota
        </CardDescription>
      </CardHeader>
      {canManageTeam && (
        <CardContent>
          <RankedSeasonActions canManageTeam={canManageTeam} embedded={false} />
        </CardContent>
      )}
    </Card>
  );
}

interface RankedEloLadderCardProps {
  customTopName: string;
  isOwner: boolean;
}

/** @deprecated Use RankedEloLadder inside RankingSection */
export function RankedEloLadderCard({
  customTopName,
  isOwner,
}: RankedEloLadderCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Escada de elos</CardTitle>
        <CardDescription>
          {formatEloLadderSummary(customTopName)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RankedEloLadder
          customTopName={customTopName}
          isOwner={isOwner}
          embedded={false}
        />
      </CardContent>
    </Card>
  );
}
