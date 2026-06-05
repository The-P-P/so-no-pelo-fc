"use client";

import { useCallback, useEffect, useState } from "react";
import { RankingBoard } from "@/components/ranking/ranking-board";
import { StatWeightsForm } from "@/components/ranking/stat-weights-form";
import {
  getRankingGeral,
  getTeamStatWeights,
} from "@/lib/actions/ranking-actions";
import { formatWeightsDescription } from "@/lib/stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RankingEntry, TeamStatWeights } from "@/types";

interface PerformanceRankingSectionProps {
  teamId: string;
  initialEntries: RankingEntry[];
  initialWeights: TeamStatWeights;
  canManageTeam: boolean;
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

export function PerformanceRankingSection({
  teamId,
  initialEntries,
  initialWeights,
  canManageTeam,
}: PerformanceRankingSectionProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [weights, setWeights] = useState(initialWeights);
  const [weightsDescription, setWeightsDescription] = useState(() =>
    formatWeightsDescription(toWeightRecord(initialWeights))
  );

  useEffect(() => {
    setEntries(initialEntries);
    setWeights(initialWeights);
    setWeightsDescription(formatWeightsDescription(toWeightRecord(initialWeights)));
  }, [initialEntries, initialWeights]);

  const refreshRanking = useCallback(async () => {
    const [newEntries, newWeights] = await Promise.all([
      getRankingGeral(teamId),
      getTeamStatWeights(teamId),
    ]);
    setEntries(newEntries);
    setWeights(newWeights);
    setWeightsDescription(formatWeightsDescription(toWeightRecord(newWeights)));
  }, [teamId]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking de performance</CardTitle>
          <CardDescription>
            Pontuação ponderada: {weightsDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RankingBoard entries={entries} />
        </CardContent>
      </Card>

      {canManageTeam && (
        <StatWeightsForm
          key={weights.updated_at}
          weights={weights}
          onSaved={refreshRanking}
        />
      )}
    </>
  );
}
