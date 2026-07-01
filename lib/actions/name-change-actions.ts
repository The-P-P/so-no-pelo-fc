"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDashboardContext, requireUser } from "@/lib/auth";
import { getTeamPermissions } from "@/types";
import type { ProfileChangeType } from "@/types/database";

export type NameChangeActionResult = {
  error?: string;
  success?: string;
};

export type ProfileChangeRequest = {
  id: string;
  team_id: string;
  user_id: string;
  change_type: ProfileChangeType;
  requested_value: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  };
  current_nickname: string | null;
};

function revalidateNameChangePaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard/membros");
  revalidatePath("/dashboard/ranking");
  revalidatePath("/dashboard/peladas");
}

export async function getPendingProfileChangeRequests(
  teamId: string
): Promise<ProfileChangeRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_change_requests")
    .select(
      "id, team_id, user_id, change_type, requested_value, status, created_at, profile:profiles(full_name, avatar_url)"
    )
    .eq("team_id", teamId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!data) return [];

  const userIds = data.map((r) => r.user_id);
  const { data: memberships } = await supabase
    .from("team_members")
    .select("user_id, nickname")
    .eq("team_id", teamId)
    .in("user_id", userIds);

  const nicknameByUser = new Map(
    (memberships ?? []).map((m) => [m.user_id, m.nickname])
  );

  return data.map((row) => ({
    id: row.id,
    team_id: row.team_id,
    user_id: row.user_id,
    change_type: row.change_type as ProfileChangeType,
    requested_value: row.requested_value,
    status: row.status as ProfileChangeRequest["status"],
    created_at: row.created_at,
    profile: row.profile as ProfileChangeRequest["profile"],
    current_nickname: nicknameByUser.get(row.user_id) ?? null,
  }));
}

export async function getUserPendingChangeRequests(
  teamId: string,
  userId: string
): Promise<{
  fullName?: string;
  nickname?: string;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_change_requests")
    .select("change_type, requested_value")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .eq("status", "pending");

  const result: { fullName?: string; nickname?: string } = {};
  for (const row of data ?? []) {
    if (row.change_type === "full_name") result.fullName = row.requested_value;
    if (row.change_type === "nickname") result.nickname = row.requested_value;
  }
  return result;
}

async function upsertChangeRequest(
  teamId: string,
  userId: string,
  changeType: ProfileChangeType,
  requestedValue: string
): Promise<NameChangeActionResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("profile_change_requests")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .eq("change_type", changeType)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("profile_change_requests")
      .update({ requested_value: requestedValue })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("profile_change_requests").insert({
      team_id: teamId,
      user_id: userId,
      change_type: changeType,
      requested_value: requestedValue,
      status: "pending",
    });
    if (error) return { error: error.message };
  }

  revalidateNameChangePaths();
  return {
    success:
      changeType === "full_name"
        ? "Solicitação de nome enviada! Aguardando aprovação do admin."
        : "Solicitação de apelido enviada! Aguardando aprovação do admin.",
  };
}

export async function submitProfileNameChange(
  fullName: string
): Promise<NameChangeActionResult> {
  const user = await requireUser();
  const { team, role } = await getDashboardContext();
  const permissions = getTeamPermissions(role);

  if (!team) {
    return applyProfileNameDirect(user.id, fullName);
  }

  if (permissions.canManageTeam) {
    return applyProfileNameDirect(user.id, fullName);
  }

  return upsertChangeRequest(team.id, user.id, "full_name", fullName);
}

export async function submitTeamNicknameChange(
  nickname: string
): Promise<NameChangeActionResult> {
  const user = await requireUser();
  const { team, role } = await getDashboardContext();

  if (!team) {
    return { error: "Entre em um grupo para definir apelido." };
  }

  const permissions = getTeamPermissions(role);
  const value = nickname.trim();

  if (permissions.canManageTeam) {
    return applyNicknameDirect(team.id, user.id, value, team.name);
  }

  return upsertChangeRequest(team.id, user.id, "nickname", value);
}

async function applyProfileNameDirect(
  userId: string,
  fullName: string
): Promise<NameChangeActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidateNameChangePaths();
  return { success: "Nome atualizado!" };
}

async function applyNicknameDirect(
  teamId: string,
  userId: string,
  nickname: string,
  teamName: string
): Promise<NameChangeActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .update({ nickname: nickname || null })
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidateNameChangePaths();
  return {
    success: nickname
      ? `Apelido "${nickname}" salvo no grupo ${teamName}!`
      : "Apelido removido.",
  };
}

export async function approveProfileChangeRequest(
  requestId: string
): Promise<NameChangeActionResult> {
  const user = await requireUser();
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canManageMembers) {
    return { error: "Apenas admins podem aprovar alterações de nome." };
  }

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("profile_change_requests")
    .select("*")
    .eq("id", requestId)
    .eq("team_id", team.id)
    .eq("status", "pending")
    .maybeSingle();

  if (!request) return { error: "Solicitação não encontrada." };

  if (request.change_type === "full_name") {
    const result = await applyProfileNameDirect(
      request.user_id,
      request.requested_value
    );
    if (result.error) return result;
  } else {
    const result = await applyNicknameDirect(
      team.id,
      request.user_id,
      request.requested_value,
      team.name
    );
    if (result.error) return result;
  }

  const { error } = await supabase
    .from("profile_change_requests")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  revalidateNameChangePaths();
  return { success: "Alteração aprovada!" };
}

export async function rejectProfileChangeRequest(
  requestId: string
): Promise<NameChangeActionResult> {
  const user = await requireUser();
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canManageMembers) {
    return { error: "Apenas admins podem rejeitar alterações de nome." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profile_change_requests")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("team_id", team.id)
    .eq("status", "pending");

  if (error) return { error: error.message };

  revalidateNameChangePaths();
  return { success: "Solicitação rejeitada." };
}
