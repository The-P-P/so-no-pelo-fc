"use server";

import { revalidatePath } from "next/cache";
import {
  AVATAR_BUCKET,
  getAvatarStoragePath,
  isValidAvatarUrl,
} from "@/lib/avatar";
import { getDashboardContext, requireUser } from "@/lib/auth";
import {
  submitProfileNameChange,
  submitTeamNicknameChange,
} from "@/lib/actions/name-change-actions";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionResult = {
  error?: string;
  success?: string;
};

/** Atualiza o nome exibido no perfil (livre para todos os jogadores) */
export async function updateProfileName(
  _prev: ProfileActionResult,
  formData: FormData
): Promise<ProfileActionResult> {
  await requireUser();
  const fullName = (formData.get("fullName") as string)?.trim();

  if (!fullName || fullName.length < 2) {
    return { error: "Nome precisa ter pelo menos 2 caracteres." };
  }

  if (fullName.length > 60) {
    return { error: "Nome muito longo (máx. 60 caracteres)." };
  }

  return submitProfileNameChange(fullName);
}

/** Atualiza apelido no grupo ativo (direto para admin; solicitação para jogadores) */
export async function updateTeamNickname(
  _prev: ProfileActionResult,
  formData: FormData
): Promise<ProfileActionResult> {
  await requireUser();
  const { team, profile } = await getDashboardContext();

  if (!team) {
    return { error: "Entre em um grupo para definir apelido." };
  }

  const nickname = (formData.get("nickname") as string)?.trim();

  if (nickname.length > 40) {
    return { error: "Apelido muito longo (máx. 40 caracteres)." };
  }

  const currentName = profile?.full_name?.trim();
  if (!currentName || currentName.length < 2) {
    return {
      error: "Defina seu nome antes de solicitar um apelido.",
    };
  }

  return submitTeamNicknameChange(nickname);
}

function revalidateAvatarPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/perfil");
  revalidatePath("/dashboard/membros");
  revalidatePath("/dashboard/ranking");
  revalidatePath("/dashboard/peladas");
}

/** Persiste a URL pública do avatar após upload no Storage */
export async function updateProfileAvatar(
  avatarUrl: string
): Promise<ProfileActionResult> {
  const user = await requireUser();
  const trimmedUrl = avatarUrl.trim();

  if (!trimmedUrl || !isValidAvatarUrl(trimmedUrl, user.id)) {
    return { error: "URL de avatar inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: trimmedUrl })
    .eq("id", user.id);

  if (error) {
    return { error: "Não foi possível salvar a foto." };
  }

  revalidateAvatarPaths();
  return { success: "Foto atualizada!" };
}

/** Remove a foto de perfil do Storage e do perfil */
export async function removeProfileAvatar(): Promise<ProfileActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const storagePath = getAvatarStoragePath(user.id);

  await supabase.storage.from(AVATAR_BUCKET).remove([storagePath]);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) {
    return { error: "Não foi possível remover a foto." };
  }

  revalidateAvatarPaths();
  return { success: "Foto removida." };
}
