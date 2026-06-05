"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDashboardContext, requireUser } from "@/lib/auth";

export type ProfileActionResult = {
  error?: string;
  success?: string;
};

/** Atualiza o nome exibido no perfil */
export async function updateProfileName(
  _prev: ProfileActionResult,
  formData: FormData
): Promise<ProfileActionResult> {
  const user = await requireUser();
  const fullName = (formData.get("fullName") as string)?.trim();

  if (!fullName || fullName.length < 2) {
    return { error: "Nome precisa ter pelo menos 2 caracteres." };
  }

  if (fullName.length > 60) {
    return { error: "Nome muito longo (máx. 60 caracteres)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard/membros");
  return { success: "Nome atualizado!" };
}

/** Atualiza apelido no grupo ativo */
export async function updateTeamNickname(
  _prev: ProfileActionResult,
  formData: FormData
): Promise<ProfileActionResult> {
  const user = await requireUser();
  const { team } = await getDashboardContext();

  if (!team) {
    return { error: "Entre em um grupo para definir apelido." };
  }

  const nickname = (formData.get("nickname") as string)?.trim();

  if (nickname.length > 40) {
    return { error: "Apelido muito longo (máx. 40 caracteres)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .update({ nickname: nickname || null })
    .eq("team_id", team.id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard/membros");
  revalidatePath("/dashboard/ranking");
  revalidatePath("/dashboard/peladas");
  return {
    success: nickname
      ? `Apelido "${nickname}" salvo no grupo ${team.name}!`
      : "Apelido removido.",
  };
}
