import { createClient } from "@/lib/supabase/server";
import type { TeamRole } from "@/types";

/** Conta membros do grupo */
export async function getTeamMemberCount(teamId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  return count ?? 0;
}

/** Conta jogadores fictícios do grupo */
export async function getFictionalPlayerCount(teamId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("fictional_players")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  return count ?? 0;
}

/** Conta peladas do grupo */
export async function getTeamPeladaCount(teamId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("peladas")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  return count ?? 0;
}

/** Busca grupo pelo slug (legado) */
export async function getTeamBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("id, name, slug, description")
    .eq("slug", slug.trim().toLowerCase())
    .maybeSingle();

  return data;
}

/** Busca grupo pelo token de convite */
export async function getTeamByInviteToken(token: string): Promise<{
  id: string;
  name: string;
  inviteRole: TeamRole;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_team_by_invite_token", {
    p_token: token.trim(),
  });

  if (error || !data || data.length === 0) return null;

  const row = data[0];
  return {
    id: row.id,
    name: row.name,
    inviteRole: row.invite_role,
  };
}
