import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile, Team, TeamMember, TeamRole } from "@/types";

/** Busca usuário autenticado ou redireciona para login */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/** Busca perfil do usuário logado */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

/**
 * Garante que o perfil existe após login (especialmente auth por telefone).
 * Evita loop login ↔ dashboard quando o trigger do banco não rodou.
 */
export async function ensureProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const existing = await getCurrentProfile();
  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      phone: user.phone ?? null,
      full_name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    })
    .select()
    .single();

  if (!error && created) return created;

  // Concorrência ou trigger tardio — tenta ler de novo
  return getCurrentProfile();
}

/** Busca o primeiro time do usuário (fase inicial — depois teremos seletor) */
export async function getCurrentTeamMembership(): Promise<{
  team: Team;
  membership: TeamMember;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("team_members")
    .select("*, team:teams(*)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .single();

  if (!data || !data.team) return null;

  const team = data.team as unknown as Team;
  const membership = {
    id: data.id,
    team_id: data.team_id,
    user_id: data.user_id,
    role: data.role,
    nickname: data.nickname,
    joined_at: data.joined_at,
  } as TeamMember;

  return { team, membership };
}

/** Dados completos para o layout do dashboard */
export async function getDashboardContext() {
  const profile = await ensureProfile();
  const teamData = await getCurrentTeamMembership();

  return {
    profile,
    team: teamData?.team ?? null,
    role: (teamData?.membership.role ?? "player") as TeamRole,
  };
}
