"use server";

import { getDashboardContext, requireUser } from "@/lib/auth";
import {
  submitProfileNameChange,
  submitTeamNicknameChange,
} from "@/lib/actions/name-change-actions";

export type ProfileActionResult = {
  error?: string;
  success?: string;
};

/** Atualiza o nome exibido no perfil (direto para admin; solicitação para jogadores) */
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
