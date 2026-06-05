"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDashboardContext, requireUser } from "@/lib/auth";
import { getEloInfo, VICTORY_PDL } from "@/lib/ranked";
import { getTeamPermissions } from "@/types";

export type RankedActionResult = {
  error?: string;
  success?: string;
};

export type RankedSeason = {
  id: string;
  team_id: string;
  name: string;
  is_active: boolean;
  started_at: string;
};

export type VictoryMember = {
  userId: string;
  displayName: string;
  nickname: string | null;
  avatarUrl: string | null;
  present: boolean;
  won: boolean;
};

export type RankedEntry = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  nickname: string | null;
  total_pdl: number;
  victories: number;
  displayName: string;
  eloName: string;
  eloIndex: number;
  nextEloName: string | null;
  pdlNeededForNext: number | null;
  progressPercent: number;
};

export async function getActiveSeason(
  teamId: string
): Promise<RankedSeason | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ranked_seasons")
    .select("*")
    .eq("team_id", teamId)
    .eq("is_active", true)
    .maybeSingle();

  return data;
}

export async function ensureActiveSeason(
  teamId: string
): Promise<RankedSeason> {
  const existing = await getActiveSeason(teamId);
  if (existing) return existing;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ranked_seasons")
    .insert({ team_id: teamId, name: "Temporada 1", is_active: true })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Não foi possível criar a temporada.");
  }

  return data;
}

export async function getVictoryMembers(
  teamId: string,
  peladaId: string
): Promise<VictoryMember[]> {
  const supabase = await createClient();
  const season = await ensureActiveSeason(teamId);

  const [{ data: members }, { data: attendance }, { data: victories }] =
    await Promise.all([
      supabase
        .from("team_members")
        .select("user_id, nickname, profile:profiles(full_name, avatar_url)")
        .eq("team_id", teamId),
      supabase
        .from("pelada_attendance")
        .select("user_id, present")
        .eq("pelada_id", peladaId),
      supabase
        .from("pelada_victories")
        .select("user_id")
        .eq("pelada_id", peladaId)
        .eq("season_id", season.id),
    ]);

  const attendanceMap = new Map(
    (attendance ?? []).map((a) => [a.user_id, a.present])
  );
  const winnerIds = new Set((victories ?? []).map((v) => v.user_id));

  return (members ?? []).map((m) => {
    const profile = m.profile as {
      full_name: string | null;
      avatar_url: string | null;
    } | null;

    return {
      userId: m.user_id,
      displayName: profile?.full_name ?? "Jogador",
      nickname: m.nickname,
      avatarUrl: profile?.avatar_url ?? null,
      present: attendanceMap.get(m.user_id) ?? false,
      won: winnerIds.has(m.user_id),
    };
  });
}

export async function toggleVictory(
  peladaId: string,
  userId: string
): Promise<RankedActionResult> {
  const user = await requireUser();
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canApproveStats) {
    return { error: "Apenas admins podem marcar vitórias." };
  }

  const supabase = await createClient();
  const season = await ensureActiveSeason(team.id);

  const { data: attendance } = await supabase
    .from("pelada_attendance")
    .select("present")
    .eq("pelada_id", peladaId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!attendance?.present) {
    return { error: "Só é possível marcar vitória para quem confirmou presença." };
  }

  const { data: existing } = await supabase
    .from("pelada_victories")
    .select("id")
    .eq("season_id", season.id)
    .eq("pelada_id", peladaId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("pelada_victories")
      .delete()
      .eq("id", existing.id);

    if (error) return { error: error.message };

    revalidateRankedPaths(peladaId);
    return { success: "Vitória desfeita." };
  }

  const { error } = await supabase.from("pelada_victories").insert({
    season_id: season.id,
    pelada_id: peladaId,
    user_id: userId,
    pdl_points: VICTORY_PDL,
    marked_by: user.id,
  });

  if (error) return { error: error.message };

  revalidateRankedPaths(peladaId);
  return { success: `+${VICTORY_PDL} PDL registrado!` };
}

export async function getRankingPdl(teamId: string): Promise<{
  season: RankedSeason;
  entries: RankedEntry[];
  customTopName: string;
}> {
  const supabase = await createClient();
  const season = await ensureActiveSeason(teamId);

  const [{ data: team }, { data: rows }] = await Promise.all([
    supabase
      .from("teams")
      .select("ranked_top_tier_name")
      .eq("id", teamId)
      .single(),
    supabase
      .from("ranking_pdl")
      .select("*")
      .eq("team_id", teamId)
      .eq("season_id", season.id),
  ]);

  const customTopName = team?.ranked_top_tier_name?.trim() || "FENDA";

  const entries: RankedEntry[] = (rows ?? []).map((row) => {
    const totalPdl = Number(row.total_pdl);
    const elo = getEloInfo(totalPdl, customTopName);

    return {
      user_id: row.user_id,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      nickname: row.nickname,
      total_pdl: totalPdl,
      victories: Number(row.victories),
      displayName: row.nickname ?? row.full_name ?? "Jogador",
      eloName: elo.eloName,
      eloIndex: elo.eloIndex,
      nextEloName: elo.nextEloName,
      pdlNeededForNext: elo.pdlNeededForNext,
      progressPercent: elo.progressPercent,
    };
  });

  return {
    season,
    entries: entries.sort((a, b) => b.total_pdl - a.total_pdl),
    customTopName,
  };
}

export async function startNewSeason(): Promise<RankedActionResult> {
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canManageTeam) {
    return { error: "Apenas admins podem iniciar nova temporada." };
  }

  const supabase = await createClient();
  const current = await getActiveSeason(team.id);

  const { count } = await supabase
    .from("ranked_seasons")
    .select("*", { count: "exact", head: true })
    .eq("team_id", team.id);

  const nextNumber = (count ?? 0) + 1;

  if (current) {
    const { error: closeError } = await supabase
      .from("ranked_seasons")
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq("id", current.id);

    if (closeError) return { error: closeError.message };
  }

  const { error } = await supabase.from("ranked_seasons").insert({
    team_id: team.id,
    name: `Temporada ${nextNumber}`,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/ranking");
  revalidatePath("/dashboard");
  return { success: `Temporada ${nextNumber} iniciada! PDL zerado.` };
}

export async function updateRankedTopTierName(
  _prev: RankedActionResult,
  formData: FormData
): Promise<RankedActionResult> {
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  if (role !== "owner") {
    return { error: "Apenas o dono pode alterar o nome do elo máximo." };
  }

  const name = (formData.get("topTierName") as string | null)?.trim();
  if (!name || name.length < 2) {
    return { error: "Nome precisa ter pelo menos 2 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("teams")
    .update({ ranked_top_tier_name: name })
    .eq("id", team.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/ranking");
  revalidatePath("/dashboard");
  return { success: "Nome do elo máximo atualizado!" };
}

function revalidateRankedPaths(peladaId: string) {
  revalidatePath(`/dashboard/peladas/${peladaId}`);
  revalidatePath("/dashboard/ranking");
  revalidatePath("/dashboard");
}
