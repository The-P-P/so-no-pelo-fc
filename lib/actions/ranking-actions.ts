"use server";

import { createClient } from "@/lib/supabase/server";
import {
  calculateStatScore,
  DEFAULT_STAT_WEIGHTS,
  type StatWeightKey,
} from "@/lib/stats";
import type { RankingEntry, TeamStatWeights } from "@/types";

export async function getTeamStatWeights(
  teamId: string
): Promise<TeamStatWeights> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_stat_weights")
    .select("*")
    .eq("team_id", teamId)
    .maybeSingle();

  return (
    data ?? {
      team_id: teamId,
      goals: DEFAULT_STAT_WEIGHTS.goals,
      assists: DEFAULT_STAT_WEIGHTS.assists,
      god_saves: DEFAULT_STAT_WEIGHTS.god_saves,
      vacilos: DEFAULT_STAT_WEIGHTS.vacilos,
      own_goals: DEFAULT_STAT_WEIGHTS.own_goals,
      updated_at: new Date().toISOString(),
    }
  );
}

function toWeights(
  weights: TeamStatWeights
): Record<StatWeightKey, number> {
  return {
    goals: weights.goals,
    assists: weights.assists,
    god_saves: weights.god_saves,
    vacilos: weights.vacilos,
    own_goals: weights.own_goals,
  };
}

export async function getRankingGeral(teamId: string): Promise<RankingEntry[]> {
  const supabase = await createClient();

  const [{ data: rows }, weights, { count: totalPeladas }] = await Promise.all([
    supabase.from("ranking_geral").select("*").eq("team_id", teamId),
    getTeamStatWeights(teamId),
    supabase
      .from("peladas")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId),
  ]);

  const w = toWeights(weights);

  const entries: RankingEntry[] = (rows ?? []).map((row) => {
    const totalGoals = Number(row.total_goals);
    const totalAssists = Number(row.total_assists);
    const totalGodSaves = Number(row.total_god_saves);
    const totalVacilos = Number(row.total_vacilos);
    const totalOwnGoals = Number(row.total_own_goals);
    const peladasJogadas = Number(row.peladas_jogadas);

    return {
      team_id: row.team_id,
      participant_id: row.participant_id,
      participant_type: row.participant_type,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      nickname: row.nickname,
      total_goals: totalGoals,
      total_assists: totalAssists,
      total_god_saves: totalGodSaves,
      total_own_goals: totalOwnGoals,
      total_vacilos: totalVacilos,
      peladas_jogadas: peladasJogadas,
      displayName: row.nickname ?? row.full_name ?? "Jogador",
      score: calculateStatScore(
        {
          goals: totalGoals,
          assists: totalAssists,
          god_saves: totalGodSaves,
          vacilos: totalVacilos,
          own_goals: totalOwnGoals,
        },
        w
      ),
      total_peladas: totalPeladas ?? 0,
    };
  });

  return entries.sort((a, b) => b.score - a.score);
}

export async function getTopScorer(
  teamId: string
): Promise<RankingEntry | null> {
  const ranking = await getRankingGeral(teamId);
  const members = ranking.filter((r) => r.participant_type === "member");
  if (members.length === 0) return null;

  return members.reduce((top, curr) =>
    curr.score > top.score ? curr : top
  );
}
