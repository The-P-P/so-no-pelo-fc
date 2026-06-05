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

export async function deletePelada(
  _prev: PeladaActionResult,
  formData: FormData
): Promise<PeladaActionResult> {
  const peladaId = (formData.get("peladaId") as string | null)?.trim();
  const confirmText = (formData.get("confirmText") as string | null)?.trim();

  if (!peladaId) return { error: "Partida inválida." };
  if (confirmText !== "DELETAR") {
    return { error: 'Digite "DELETAR" para confirmar.' };
  }

  const user = await requireUser();
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canCreatePelada) {
    return { error: "Apenas admins podem deletar partidas." };
  }

  const pelada = await getPeladaById(peladaId);
  if (!pelada || pelada.team_id !== team.id) {
    return { error: "Partida não encontrada." };
  }

  if (pelada.created_by !== user.id) {
    return { error: "Só o admin que criou a partida pode deletar." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("peladas")
    .delete()
    .eq("id", peladaId)
    .eq("team_id", team.id)
    .eq("created_by", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/peladas");
  redirect("/dashboard/peladas");
}

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
  const location = (formData.get("location") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  if (!date) return { error: "Informe a data da pelada." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("peladas")
    .insert({
      team_id: team.id,
      date,
      opponent: "Pelada",
      location: location || null,
      notes: description || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/peladas");
  redirect(`/dashboard/peladas/${data.id}`);
}

export async function updatePelada(
  _prev: PeladaActionResult,
  formData: FormData
): Promise<PeladaActionResult> {
  const peladaId = (formData.get("peladaId") as string | null)?.trim();
  if (!peladaId) return { error: "Partida inválida." };

  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canCreatePelada) {
    return { error: "Apenas admins podem editar peladas." };
  }

  const pelada = await getPeladaById(peladaId);
  if (!pelada || pelada.team_id !== team.id) {
    return { error: "Pelada não encontrada." };
  }

  const date = formData.get("date") as string;
  const location = (formData.get("location") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  if (!date) return { error: "Informe a data da pelada." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("peladas")
    .update({
      date,
      location: location || null,
      notes: description || null,
    })
    .eq("id", peladaId)
    .eq("team_id", team.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/peladas");
  revalidatePath(`/dashboard/peladas/${peladaId}`);
  revalidatePath("/dashboard");
  return { success: "Pelada atualizada!" };
}

function emptyBaseStats() {
  return {
    goals: 0,
    assists: 0,
    god_saves: 0,
    vacilos: 0,
    own_goals: 0,
  };
}

function revalidatePeladaPaths(peladaId: string) {
  revalidatePath(`/dashboard/peladas/${peladaId}`);
  revalidatePath("/dashboard/peladas");
  revalidatePath("/dashboard/ranking");
  revalidatePath("/dashboard");
}

async function adjustStatAsAdmin(
  peladaId: string,
  participantId: string,
  participantType: "member" | "fictional",
  statField: StatField,
  delta: 1 | -1
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

  if (delta === 1 && isMember) {
    const { data: attendance } = await supabase
      .from("pelada_attendance")
      .select("present")
      .eq("pelada_id", peladaId)
      .eq("user_id", participantId)
      .maybeSingle();

    if (!attendance?.present) {
      return { error: "Jogador precisa confirmar presença antes das stats." };
    }
  }

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

  if (delta === -1 && baseStats[statField] <= 0) {
    return { error: "Não há o que remover nessa estatística." };
  }

  baseStats[statField] += delta;

  if (existing) {
    const { error } = await supabase
      .from("player_stats")
      .update({
        ...baseStats,
        status: "approved",
      })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else if (delta === 1) {
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

  revalidatePeladaPaths(peladaId);
  return {
    success: delta === 1 ? "+1 registrado!" : "Correção aplicada.",
  };
}

async function adjustStatAsPlayer(
  peladaId: string,
  statField: StatField,
  delta: 1 | -1
): Promise<PeladaActionResult> {
  const user = await requireUser();
  const { team } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const supabase = await createClient();
  const pelada = await getPeladaById(peladaId);
  if (!pelada || pelada.team_id !== team.id) {
    return { error: "Pelada não encontrada." };
  }

  const { data: attendance } = await supabase
    .from("pelada_attendance")
    .select("present")
    .eq("pelada_id", peladaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!attendance?.present) {
    return { error: "Confirme sua presença antes de lançar stats." };
  }

  const { data: existing } = await supabase
    .from("player_stats")
    .select("*")
    .eq("pelada_id", peladaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.status === "approved") {
    return {
      error: "Suas stats já foram aprovadas. Peça ao admin para corrigir.",
    };
  }

  const baseStats = existing
    ? {
        goals: existing.goals,
        assists: existing.assists,
        god_saves: existing.god_saves,
        vacilos: existing.vacilos,
        own_goals: existing.own_goals,
      }
    : emptyBaseStats();

  if (delta === -1 && baseStats[statField] <= 0) {
    return { error: "Não há o que remover nessa estatística." };
  }

  baseStats[statField] += delta;

  if (existing) {
    const { error } = await supabase
      .from("player_stats")
      .update({
        ...baseStats,
        status: "pending",
      })
      .eq("id", existing.id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
  } else if (delta === 1) {
    const { error } = await supabase.from("player_stats").insert({
      pelada_id: peladaId,
      ...baseStats,
      status: "pending",
      user_id: user.id,
      fictional_player_id: null,
    });

    if (error) return { error: error.message };
  }

  revalidatePeladaPaths(peladaId);
  return {
    success:
      delta === 1
        ? "Stat enviada para aprovação!"
        : "Correção salva (aguardando aprovação).",
  };
}

export async function incrementStat(
  peladaId: string,
  participantId: string,
  participantType: "member" | "fictional",
  statField: StatField
): Promise<PeladaActionResult> {
  return adjustStatAsAdmin(
    peladaId,
    participantId,
    participantType,
    statField,
    1
  );
}

export async function decrementStat(
  peladaId: string,
  participantId: string,
  participantType: "member" | "fictional",
  statField: StatField
): Promise<PeladaActionResult> {
  return adjustStatAsAdmin(
    peladaId,
    participantId,
    participantType,
    statField,
    -1
  );
}

export async function incrementOwnStat(
  peladaId: string,
  statField: StatField
): Promise<PeladaActionResult> {
  return adjustStatAsPlayer(peladaId, statField, 1);
}

export async function decrementOwnStat(
  peladaId: string,
  statField: StatField
): Promise<PeladaActionResult> {
  return adjustStatAsPlayer(peladaId, statField, -1);
}

export async function approvePlayerStat(
  statId: string
): Promise<PeladaActionResult> {
  const user = await requireUser();
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canApproveStats) {
    return { error: "Apenas admins podem aprovar estatísticas." };
  }

  const supabase = await createClient();
  const { data: stat } = await supabase
    .from("player_stats")
    .select("*, pelada:peladas(team_id)")
    .eq("id", statId)
    .maybeSingle();

  if (!stat) return { error: "Estatística não encontrada." };

  const pelada = stat.pelada as { team_id: string } | null;
  if (!pelada || pelada.team_id !== team.id) {
    return { error: "Estatística não encontrada." };
  }

  const { error } = await supabase
    .from("player_stats")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", statId);

  if (error) return { error: error.message };

  revalidatePeladaPaths(stat.pelada_id);
  return { success: "Estatísticas aprovadas!" };
}

export async function rejectPlayerStat(
  statId: string
): Promise<PeladaActionResult> {
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canApproveStats) {
    return { error: "Apenas admins podem rejeitar estatísticas." };
  }

  const supabase = await createClient();
  const { data: stat } = await supabase
    .from("player_stats")
    .select("*, pelada:peladas(team_id)")
    .eq("id", statId)
    .maybeSingle();

  if (!stat) return { error: "Estatística não encontrada." };

  const pelada = stat.pelada as { team_id: string } | null;
  if (!pelada || pelada.team_id !== team.id) {
    return { error: "Estatística não encontrada." };
  }

  const { error } = await supabase
    .from("player_stats")
    .delete()
    .eq("id", statId);

  if (error) return { error: error.message };

  revalidatePeladaPaths(stat.pelada_id);
  return { success: "Envio rejeitado. O jogador pode lançar de novo." };
}
