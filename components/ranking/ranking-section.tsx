"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RankingBoard } from "@/components/ranking/ranking-board";
import { StatWeightsForm } from "@/components/ranking/stat-weights-form";
import { RankedBoard } from "@/components/ranked/ranked-board";
import {
  RankedEloLadder,
  RankedSeasonActions,
} from "@/components/ranked/ranked-settings";
import {
  getRankingGeral,
  getTeamStatWeights,
} from "@/lib/actions/ranking-actions";
import type { RankedEntry, RankedSeason } from "@/lib/actions/ranked-actions";
import { VICTORY_PDL } from "@/lib/ranked";
import { formatWeightsDescription } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RankingEntry, TeamStatWeights } from "@/types";

type MainTab = "performance" | "pdl";

const MAIN_TABS: { id: MainTab; label: string; emoji: string }[] = [
  { id: "performance", label: "Performance", emoji: "📊" },
  { id: "pdl", label: "Liga PDL", emoji: "🏅" },
];

export type RankedData = {
  season: RankedSeason;
  entries: RankedEntry[];
  customTopName: string;
};

interface RankingSectionProps {
  teamId: string;
  initialEntries: RankingEntry[];
  initialWeights: TeamStatWeights;
  ranked: RankedData | null;
  canManageTeam: boolean;
  isOwner: boolean;
  initialTab?: MainTab;
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

function parseMainTab(value: string | null | undefined): MainTab {
  return value === "pdl" ? "pdl" : "performance";
}

export function RankingSection({
  teamId,
  initialEntries,
  initialWeights,
  ranked,
  canManageTeam,
  isOwner,
  initialTab = "performance",
}: RankingSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mainTab, setMainTab] = useState<MainTab>(() =>
    parseMainTab(searchParams.get("tab") ?? initialTab)
  );
  const [entries, setEntries] = useState(initialEntries);
  const [weights, setWeights] = useState(initialWeights);
  const [weightsDescription, setWeightsDescription] = useState(() =>
    formatWeightsDescription(toWeightRecord(initialWeights))
  );

  useEffect(() => {
    setEntries(initialEntries);
    setWeights(initialWeights);
    setWeightsDescription(
      formatWeightsDescription(toWeightRecord(initialWeights))
    );
  }, [initialEntries, initialWeights]);

  useEffect(() => {
    setMainTab(parseMainTab(searchParams.get("tab") ?? initialTab));
  }, [searchParams, initialTab]);

  const refreshRanking = useCallback(async () => {
    const [newEntries, newWeights] = await Promise.all([
      getRankingGeral(teamId),
      getTeamStatWeights(teamId),
    ]);
    setEntries(newEntries);
    setWeights(newWeights);
    setWeightsDescription(formatWeightsDescription(toWeightRecord(newWeights)));
  }, [teamId]);

  function handleTabChange(tab: MainTab) {
    setMainTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "performance") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    router.replace(query ? `/dashboard/ranking?${query}` : "/dashboard/ranking", {
      scroll: false,
    });
  }

  const cardDescription =
    mainTab === "performance"
      ? `Pontuação ponderada: ${weightsDescription}`
      : ranked
        ? `${ranked.season.name} · vitória = +${VICTORY_PDL} PDL · só membros`
        : "Liga PDL indisponível";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ranking do grupo</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {MAIN_TABS.map((tab) => (
            <Button
              key={tab.id}
              variant={mainTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleTabChange(tab.id)}
              className="h-8"
              disabled={tab.id === "pdl" && !ranked}
            >
              <span className="mr-1">{tab.emoji}</span>
              {tab.label}
            </Button>
          ))}
        </div>

        {mainTab === "performance" ? (
          <>
            <RankingBoard entries={entries} />
            {canManageTeam && (
              <StatWeightsForm
                key={weights.updated_at}
                weights={weights}
                onSaved={refreshRanking}
                embedded
              />
            )}
          </>
        ) : ranked ? (
          <>
            <RankedBoard entries={ranked.entries} />
            <RankedSeasonActions canManageTeam={canManageTeam} />
            <RankedEloLadder
              customTopName={ranked.customTopName}
              isOwner={isOwner}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Liga PDL ainda não está disponível para este grupo.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
