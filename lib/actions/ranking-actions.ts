"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDashboardContext } from "@/lib/auth";
import {
  calculateStatScore,
  DEFAULT_STAT_WEIGHTS,
  STAT_FIELDS,
  type StatWeightKey,
} from "@/lib/stats";
import { getTeamPermissions } from "@/types";
import type { RankingEntry, TeamStatWeights } from "@/types";

export type RankingActionResult = {
  error?: string;
  success?: string;
  savedAt?: number;
};

export async function getTeamStatWeights(
  teamId: string
): Promise<TeamStatWeights> {
  noStore();
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
  noStore();
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

function parseWeight(formData: FormData, key: StatWeightKey): number | null {
  const raw = (formData.get(key) as string | null)?.trim();
  if (raw === "" || raw == null) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.trunc(value);
}

export async function updateTeamStatWeights(
  _prev: RankingActionResult,
  formData: FormData
): Promise<RankingActionResult> {
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canManageTeam) {
    return { error: "Apenas admins podem alterar os pesos do ranking." };
  }

  const weights: Record<StatWeightKey, number> = {
    goals: 0,
    assists: 0,
    god_saves: 0,
    vacilos: 0,
    own_goals: 0,
  };

  for (const key of STAT_FIELDS) {
    const value = parseWeight(formData, key);
    if (value === null) {
      return { error: `Peso inválido para ${key}.` };
    }
    weights[key] = value;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_stat_weights")
    .upsert({
      team_id: team.id,
      ...weights,
      updated_at: new Date().toISOString(),
    });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/ranking");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/peladas");
  return {
    success: "Pesos do ranking atualizados!",
    savedAt: Date.now(),
  };
}
