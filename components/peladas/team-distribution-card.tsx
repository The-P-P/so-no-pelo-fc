"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TeamDistributionBoard } from "@/components/peladas/team-distribution-board";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TeamDistribution } from "@/types";

interface TeamDistributionCardProps {
  peladaId: string;
  distribution: TeamDistribution;
  canManage: boolean;
}

export function TeamDistributionCard({
  peladaId,
  distribution,
  canManage,
}: TeamDistributionCardProps) {
  const [expanded, setExpanded] = useState(
    distribution.teams.length > 0 || distribution.presentCount >= 2
  );

  const teamCount = distribution.teams.length;
  const summary =
    teamCount > 0
      ? `${teamCount} time${teamCount !== 1 ? "s" : ""} · ${distribution.presentCount} jogador${distribution.presentCount !== 1 ? "es" : ""}`
      : `${distribution.presentCount} jogador${distribution.presentCount !== 1 ? "es" : ""} confirmado${distribution.presentCount !== 1 ? "s" : ""}`;

  return (
    <Card>
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded((open) => !open)}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">Times</CardTitle>
            <CardDescription className="mt-1">
              {expanded
                ? "Distribuição equilibrada pelo score médio por pelada"
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
      </button>

      <CardContent className={cn(!expanded && "hidden")}>
        <TeamDistributionBoard
          peladaId={peladaId}
          distribution={distribution}
          canManage={canManage}
        />
      </CardContent>
    </Card>
  );
}
