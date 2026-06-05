"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  ensureProfile,
  getUserTeamMemberships,
  requireUser,
} from "@/lib/auth";
import { getTeamByInviteToken } from "@/lib/teams";
import { slugify, withUniqueSuffix } from "@/lib/slug";
import { ACTIVE_TEAM_COOKIE } from "@/lib/team-cookie";

export type TeamActionResult = {
  error?: string;
  success?: string;
};

function normalizeInviteToken(rawToken: string | null | undefined): string {
  const value = (rawToken ?? "").trim();
  if (!value) return "";

  // Aceita token puro ou link completo do convite.
  if (!value.includes("://") && !value.includes("?")) {
    return value.replace(/\s+/g, "");
  }

  try {
    const url = new URL(value);
    const tokenFromQuery = url.searchParams.get("token");
    if (tokenFromQuery) {
      return tokenFromQuery.trim().replace(/\s+/g, "");
    }
  } catch {
    // Se não for URL válida, tenta limpar como texto comum.
  }

  const match = value.match(/[?&]token=([^&#]+)/i);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]).trim().replace(/\s+/g, "");
    } catch {
      return match[1].trim().replace(/\s+/g, "");
    }
  }

  return value.replace(/\s+/g, "");
}

async function setActiveTeamCookie(teamId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TEAM_COOKIE, teamId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/** Cria um novo grupo — usuário vira owner automaticamente (trigger no banco) */
export async function createTeam(
  _prev: TeamActionResult,
  formData: FormData
): Promise<TeamActionResult> {
  const user = await requireUser();
  await ensureProfile();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  if (!name || name.length < 2) {
    return { error: "Nome do grupo precisa ter pelo menos 2 caracteres." };
  }

  const supabase = await createClient();
  let slug = slugify(name);

  const { data: slugConflict } = await supabase
    .from("teams")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (slugConflict) {
    slug = withUniqueSuffix(slug);
  }

  const { data: created, error } = await supabase
    .from("teams")
    .insert({
      name,
      slug,
      description: description || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  if (created) {
    await setActiveTeamCookie(created.id);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard/perfil");
}

/** Entra em um grupo via token de convite (participante ou admin) */
export async function joinTeam(
  _prev: TeamActionResult,
  formData: FormData
): Promise<TeamActionResult> {
  await requireUser();
  await ensureProfile();

  const token = normalizeInviteToken(formData.get("token") as string | null);
  const nickname = (formData.get("nickname") as string)?.trim();

  if (!token) {
    return { error: "Código/link de convite inválido." };
  }

  const invite = await getTeamByInviteToken(token);
  if (!invite) {
    return { error: "Convite não encontrado. Pede um link novo pro dono do grupo." };
  }

  const supabase = await createClient();
  const { data: teamId, error } = await supabase.rpc("join_team_via_invite", {
    p_token: token,
    p_nickname: nickname || null,
  });

  if (error) {
    const msg = error.message;
    if (msg.includes("já faz parte")) {
      if (invite) {
        await setActiveTeamCookie(invite.id);
        revalidatePath("/dashboard");
        redirect("/dashboard/perfil");
      }
      return { error: "Você já faz parte deste grupo." };
    }
    return { error: msg };
  }

  if (teamId) {
    await setActiveTeamCookie(teamId as string);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard/perfil");
}

/** Troca o grupo ativo (peladas, ranking e membros passam a ser deste grupo) */
export async function switchActiveTeam(teamId: string): Promise<TeamActionResult> {
  await requireUser();

  const memberships = await getUserTeamMemberships();
  const belongs = memberships.some((m) => m.team.id === teamId);

  if (!belongs) {
    return { error: "Você não faz parte deste grupo." };
  }

  await setActiveTeamCookie(teamId);
  revalidatePath("/dashboard");
  return { success: "Grupo alterado." };
}

