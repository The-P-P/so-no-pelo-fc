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

export type TeamMembershipWithTeam = {
  team: Team;
  membership: TeamMember;
};

function mapMembershipRow(data: {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  nickname: string | null;
  joined_at: string;
  team: Team | null;
}): TeamMembershipWithTeam | null {
  if (!data.team) return null;

  return {
    team: data.team,
    membership: {
      id: data.id,
      team_id: data.team_id,
      user_id: data.user_id,
      role: data.role,
      nickname: data.nickname,
      joined_at: data.joined_at,
    } as TeamMember,
  };
}

/** Lista todos os grupos do usuário */
export async function getUserTeamMemberships(): Promise<
  TeamMembershipWithTeam[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("team_members")
    .select("*, team:teams(*)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (!data) return [];

  return data
    .map((row) =>
      mapMembershipRow({
        ...row,
        team: row.team as unknown as Team | null,
      })
    )
    .filter((item): item is TeamMembershipWithTeam => item !== null);
}

/** Busca o grupo ativo (cookie) ou o primeiro do usuário */
export async function getCurrentTeamMembership(): Promise<TeamMembershipWithTeam | null> {
  const { getActiveTeamIdFromCookie } = await import("@/lib/team-cookie");
  const activeTeamId = await getActiveTeamIdFromCookie();
  const memberships = await getUserTeamMemberships();

  if (memberships.length === 0) return null;

  if (activeTeamId) {
    const active = memberships.find((m) => m.team.id === activeTeamId);
    if (active) return active;
  }

  return memberships[0];
}

/** Dados completos para o layout do dashboard */
export async function getDashboardContext() {
  const profile = await ensureProfile();
  const memberships = await getUserTeamMemberships();
  const teamData = await getCurrentTeamMembership();

  return {
    profile,
    team: teamData?.team ?? null,
    role: (teamData?.membership.role ?? "player") as TeamRole,
    nickname: teamData?.membership.nickname ?? null,
    teams: memberships.map((m) => ({
      team: m.team,
      role: m.membership.role as TeamRole,
    })),
  };
}
