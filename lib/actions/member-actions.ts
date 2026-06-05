"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDashboardContext, requireUser } from "@/lib/auth";
import { getTeamPermissions } from "@/types";
import type { FictionalPlayer, TeamMemberWithProfile } from "@/types";

export type MemberActionResult = {
  error?: string;
  success?: string;
};

export async function getTeamMembers(
  teamId: string
): Promise<TeamMemberWithProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select(
      "*, profile:profiles(id, full_name, email, phone, avatar_url)"
    )
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true });

  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    team_id: row.team_id,
    user_id: row.user_id,
    role: row.role,
    nickname: row.nickname,
    joined_at: row.joined_at,
    profile: row.profile as TeamMemberWithProfile["profile"],
  }));
}

export async function getFictionalPlayers(
  teamId: string
): Promise<FictionalPlayer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fictional_players")
    .select("*")
    .eq("team_id", teamId)
    .order("display_name", { ascending: true });

  return data ?? [];
}

export async function addFictionalPlayer(
  _prev: MemberActionResult,
  formData: FormData
): Promise<MemberActionResult> {
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canManageMembers) {
    return { error: "Apenas admins podem adicionar jogadores fictícios." };
  }

  const displayName = (formData.get("displayName") as string)?.trim();
  const nickname = (formData.get("nickname") as string)?.trim();

  if (!displayName || displayName.length < 2) {
    return { error: "Nome precisa ter pelo menos 2 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("fictional_players").insert({
    team_id: team.id,
    display_name: displayName,
    nickname: nickname || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um jogador fictício com esse nome." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/membros");
  revalidatePath("/dashboard/peladas");
  return { success: `${displayName} adicionado ao elenco fictício!` };
}

export async function removeFictionalPlayer(
  playerId: string
): Promise<MemberActionResult> {
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canManageMembers) {
    return { error: "Apenas admins podem remover jogadores fictícios." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("fictional_players")
    .delete()
    .eq("id", playerId)
    .eq("team_id", team.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/membros");
  revalidatePath("/dashboard/peladas");
  return { success: "Jogador fictício removido." };
}

export async function promoteMember(
  memberUserId: string
): Promise<MemberActionResult> {
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canManageMembers) {
    return { error: "Apenas admins podem gerenciar membros." };
  }

  return updateMemberRole(memberUserId, "admin", {
    expectedRole: "player",
    alreadyMessage: "Este membro já é admin.",
    successMessage: "Membro promovido a admin.",
  });
}

export async function demoteMember(
  memberUserId: string
): Promise<MemberActionResult> {
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canManageMembers) {
    return { error: "Apenas admins podem gerenciar membros." };
  }

  if (role !== "owner") {
    return { error: "Apenas o dono pode rebaixar admins." };
  }

  return updateMemberRole(memberUserId, "player", {
    expectedRole: "admin",
    alreadyMessage: "Este membro já é jogador.",
    successMessage: "Admin rebaixado para jogador.",
  });
}

async function updateMemberRole(
  memberUserId: string,
  newRole: "admin" | "player",
  options: {
    expectedRole: "admin" | "player";
    alreadyMessage: string;
    successMessage: string;
  }
): Promise<MemberActionResult> {
  const user = await requireUser();
  const { team } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  if (memberUserId === user.id) {
    return { error: "Você não pode alterar seu próprio cargo." };
  }

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", team.id)
    .eq("user_id", memberUserId)
    .maybeSingle();

  if (!member) return { error: "Membro não encontrado." };
  if (member.role === "owner") {
    return { error: "Não é possível alterar o dono do grupo." };
  }
  if (member.role !== options.expectedRole) {
    return { error: options.alreadyMessage };
  }

  const { error } = await supabase
    .from("team_members")
    .update({ role: newRole })
    .eq("team_id", team.id)
    .eq("user_id", memberUserId);

  if (error) return { error: error.message };

  revalidateMemberPaths();
  return { success: options.successMessage };
}

export async function removeMember(
  memberUserId: string
): Promise<MemberActionResult> {
  const user = await requireUser();
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canManageMembers) {
    return { error: "Apenas admins podem remover membros." };
  }

  if (memberUserId === user.id) {
    return { error: "Use a opção de sair do grupo no perfil." };
  }

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", team.id)
    .eq("user_id", memberUserId)
    .maybeSingle();

  if (!member) return { error: "Membro não encontrado." };
  if (member.role === "owner") {
    return { error: "Não é possível remover o dono do grupo." };
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", team.id)
    .eq("user_id", memberUserId);

  if (error) return { error: error.message };

  revalidateMemberPaths();
  return { success: "Membro removido do grupo." };
}

function revalidateMemberPaths() {
  revalidatePath("/dashboard/membros");
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard/peladas");
  revalidatePath("/dashboard/ranking");
}
