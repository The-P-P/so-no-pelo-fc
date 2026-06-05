"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile, getCurrentTeamMembership, requireUser } from "@/lib/auth";
import { getTeamByInviteToken } from "@/lib/teams";
import { slugify, withUniqueSuffix } from "@/lib/slug";

export type TeamActionResult = {
  error?: string;
  success?: string;
};

async function assertNoTeam(): Promise<TeamActionResult | null> {
  const existing = await getCurrentTeamMembership();
  if (existing) {
    return { error: "Você já está em um grupo. Sai do grupo atual antes de criar ou entrar em outro." };
  }
  return null;
}

/** Cria um novo grupo — usuário vira owner automaticamente (trigger no banco) */
export async function createTeam(
  _prev: TeamActionResult,
  formData: FormData
): Promise<TeamActionResult> {
  const blocked = await assertNoTeam();
  if (blocked) return blocked;

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

  const { error } = await supabase.from("teams").insert({
    name,
    slug,
    description: description || null,
    created_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** Entra em um grupo via token de convite (participante ou admin) */
export async function joinTeam(
  _prev: TeamActionResult,
  formData: FormData
): Promise<TeamActionResult> {
  const blocked = await assertNoTeam();
  if (blocked) return blocked;

  await requireUser();
  await ensureProfile();

  const token = (formData.get("token") as string)?.trim();
  const nickname = (formData.get("nickname") as string)?.trim();

  if (!token) {
    return { error: "Link de convite inválido." };
  }

  const invite = await getTeamByInviteToken(token);
  if (!invite) {
    return { error: "Convite não encontrado. Pede um link novo pro dono do grupo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_team_via_invite", {
    p_token: token,
    p_nickname: nickname || null,
  });

  if (error) {
    const msg = error.message;
    if (msg.includes("já faz parte")) {
      return { error: "Você já faz parte deste grupo." };
    }
    return { error: msg };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
