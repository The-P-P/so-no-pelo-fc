"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardContext, requireUser } from "@/lib/auth";
import { getTeamPermissions } from "@/types";
import type { StatField } from "@/lib/stats";
import type { Pelada, PlayerStat, Participant } from "@/types";

export type PeladaActionResult = {
  error?: string;
  success?: string;
};

export async function getTeamPeladas(teamId: string): Promise<Pelada[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("peladas")
    .select("*")
    .eq("team_id", teamId)
    .order("date", { ascending: false });

  return data ?? [];
}

export async function getPeladaById(peladaId: string): Promise<Pelada | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("peladas")
    .select("*")
    .eq("id", peladaId)
    .maybeSingle();

  return data;
}

export async function getPeladaStats(peladaId: string): Promise<PlayerStat[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("player_stats")
    .select("*")
    .eq("pelada_id", peladaId);

  return data ?? [];
}

export async function getParticipants(teamId: string): Promise<Participant[]> {
  const supabase = await createClient();

  const [{ data: members }, { data: fictional }] = await Promise.all([
    supabase
      .from("team_members")
      .select("user_id, nickname, profile:profiles(full_name)")
      .eq("team_id", teamId),
    supabase
      .from("fictional_players")
      .select("id, display_name, nickname")
      .eq("team_id", teamId)
      .order("display_name"),
  ]);

  const result: Participant[] = [];

  for (const m of members ?? []) {
    const profile = m.profile as { full_name: string | null } | null;
    result.push({
      id: m.user_id,
      type: "member",
      displayName: profile?.full_name ?? "Jogador",
      nickname: m.nickname,
    });
  }

  for (const f of fictional ?? []) {
    result.push({
      id: f.id,
      type: "fictional",
      displayName: f.display_name,
      nickname: f.nickname,
    });
  }

  return result;
}

export async function createPelada(
  _prev: PeladaActionResult,
  formData: FormData
): Promise<PeladaActionResult> {
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canCreatePelada) {
    return { error: "Apenas admins podem criar peladas." };
  }

  const user = await requireUser();
  const date = formData.get("date") as string;
  const opponent = (formData.get("opponent") as string)?.trim();
  const location = (formData.get("location") as string)?.trim();

  if (!date) return { error: "Informe a data da pelada." };
  if (!opponent || opponent.length < 2) {
    return { error: "Informe o adversário (ou 'Treino')." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("peladas")
    .insert({
      team_id: team.id,
      date,
      opponent,
      location: location || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/peladas");
  redirect(`/dashboard/peladas/${data.id}`);
}

export async function incrementStat(
  peladaId: string,
  participantId: string,
  participantType: "member" | "fictional",
  statField: StatField
): Promise<PeladaActionResult> {
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canApproveStats) {
    return { error: "Apenas admins podem lançar estatísticas." };
  }

  const supabase = await createClient();
  const pelada = await getPeladaById(peladaId);
  if (!pelada || pelada.team_id !== team.id) {
    return { error: "Pelada não encontrada." };
  }

  const isMember = participantType === "member";
  const filterCol = isMember ? "user_id" : "fictional_player_id";

  const { data: existing } = await supabase
    .from("player_stats")
    .select("*")
    .eq("pelada_id", peladaId)
    .eq(filterCol, participantId)
    .maybeSingle();

  const baseStats = {
    goals: existing?.goals ?? 0,
    assists: existing?.assists ?? 0,
    god_saves: existing?.god_saves ?? 0,
    vacilos: existing?.vacilos ?? 0,
    own_goals: existing?.own_goals ?? 0,
  };
  baseStats[statField] += 1;

  if (existing) {
    const { error } = await supabase
      .from("player_stats")
      .update({
        ...baseStats,
        status: "approved",
      })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    const insertData = {
      pelada_id: peladaId,
      ...baseStats,
      status: "approved" as const,
      user_id: isMember ? participantId : null,
      fictional_player_id: isMember ? null : participantId,
    };

    const { error } = await supabase.from("player_stats").insert(insertData);
    if (error) return { error: error.message };
  }

  revalidatePath(`/dashboard/peladas/${peladaId}`);
  return { success: "+1 registrado!" };
}
