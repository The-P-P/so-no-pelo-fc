"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDashboardContext } from "@/lib/auth";
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
