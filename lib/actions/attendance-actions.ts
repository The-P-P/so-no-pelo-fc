"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDashboardContext, requireUser } from "@/lib/auth";
import { getPeladaById } from "@/lib/actions/pelada-actions";
import { getTeamPermissions } from "@/types";
import type { PeladaAttendance, AttendanceMember } from "@/types";

export type AttendanceActionResult = {
  error?: string;
  success?: string;
};

export async function getPeladaAttendance(
  peladaId: string
): Promise<PeladaAttendance[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pelada_attendance")
    .select("*")
    .eq("pelada_id", peladaId);

  return data ?? [];
}

export async function getAttendanceMembers(
  teamId: string,
  peladaId: string
): Promise<AttendanceMember[]> {
  const supabase = await createClient();

  const [{ data: members }, { data: attendance }] = await Promise.all([
    supabase
      .from("team_members")
      .select("user_id, nickname, profile:profiles(full_name, avatar_url)")
      .eq("team_id", teamId)
      .order("joined_at"),
    supabase
      .from("pelada_attendance")
      .select("user_id, present")
      .eq("pelada_id", peladaId),
  ]);

  const attendanceMap = new Map(
    (attendance ?? []).map((a) => [a.user_id, a.present])
  );

  return (members ?? []).map((m) => {
    const profile = m.profile as {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
    const present = attendanceMap.get(m.user_id);

    return {
      userId: m.user_id,
      displayName: profile?.full_name ?? "Jogador",
      nickname: m.nickname,
      avatarUrl: profile?.avatar_url ?? null,
      present: present ?? false,
      hasMarked: present !== undefined,
    };
  });
}

export async function toggleAttendance(
  peladaId: string,
  userId: string,
  present: boolean
): Promise<AttendanceActionResult> {
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const user = await requireUser();
  const permissions = getTeamPermissions(role);
  const isSelf = userId === user.id;

  if (!isSelf && !permissions.canApproveStats) {
    return { error: "Apenas admins podem marcar presença de outros." };
  }

  const pelada = await getPeladaById(peladaId);
  if (!pelada || pelada.team_id !== team.id) {
    return { error: "Pelada não encontrada." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("pelada_attendance")
    .select("id")
    .eq("pelada_id", peladaId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("pelada_attendance")
      .update({
        present,
        marked_by: user.id,
        marked_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("pelada_attendance").insert({
      pelada_id: peladaId,
      user_id: userId,
      present,
      marked_by: user.id,
    });

    if (error) return { error: error.message };
  }

  revalidatePath(`/dashboard/peladas/${peladaId}`);
  revalidatePath("/dashboard/ranking");
  return { success: present ? "Presença confirmada!" : "Presença removida." };
}

export async function getPresentUserIds(peladaId: string): Promise<string[]> {
  const attendance = await getPeladaAttendance(peladaId);
  return attendance.filter((a) => a.present).map((a) => a.user_id);
}

export async function confirmAllAttendance(
  peladaId: string
): Promise<AttendanceActionResult> {
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." };

  const permissions = getTeamPermissions(role);
  if (!permissions.canApproveStats) {
    return { error: "Apenas admins podem confirmar todos." };
  }

  const pelada = await getPeladaById(peladaId);
  if (!pelada || pelada.team_id !== team.id) {
    return { error: "Pelada não encontrada." };
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", team.id);

  if (membersError) return { error: membersError.message };
  if (!members?.length) return { error: "Nenhum membro no grupo." };

  const now = new Date().toISOString();
  const records = members.map((m) => ({
    pelada_id: peladaId,
    user_id: m.user_id,
    present: true,
    marked_by: user.id,
    marked_at: now,
  }));

  const { error } = await supabase
    .from("pelada_attendance")
    .upsert(records, { onConflict: "pelada_id,user_id" });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/peladas/${peladaId}`);
  revalidatePath("/dashboard/ranking");
  return { success: "Todos confirmados!" };
}
