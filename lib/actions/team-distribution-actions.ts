"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDashboardContext, requireUser } from "@/lib/auth";
import { getPeladaById, getParticipants } from "@/lib/actions/pelada-actions";
import { getPresentUserIds } from "@/lib/actions/attendance-actions";
import { getRankingGeral } from "@/lib/actions/ranking-actions";
import {
  balanceTeams,
  calculateAvgSkill,
  countTeams,
} from "@/lib/team-balancer";
import { getTeamPermissions } from "@/types";
import type {
  Participant,
  ParticipantType,
  TeamDistribution,
  TeamDistributionPlayer,
} from "@/types";

export type TeamDistributionActionResult = {
  error?: string;
  success?: string;
};

const DEFAULT_PLAYERS_PER_TEAM = 5;

type AssignableParticipant = Participant & {
  avatarUrl: string | null;
};

async function requireAdminPelada(peladaId: string) {
  const { team, role } = await getDashboardContext();
  if (!team) return { error: "Você não está em um grupo." as const };

  const permissions = getTeamPermissions(role);
  if (!permissions.canApproveStats) {
    return { error: "Apenas admins podem gerenciar a distribuição de times." as const };
  }

  const pelada = await getPeladaById(peladaId);
  if (!pelada || pelada.team_id !== team.id) {
    return { error: "Pelada não encontrada." as const };
  }

  return { team, pelada };
}

async function getAssignableParticipants(
  teamId: string,
  peladaId: string
): Promise<AssignableParticipant[]> {
  const [participants, presentUserIds] = await Promise.all([
    getParticipants(teamId),
    getPresentUserIds(peladaId),
  ]);
  const presentSet = new Set(presentUserIds);

  const supabase = await createClient();
  const memberIds = participants
    .filter((p) => p.type === "member" && presentSet.has(p.id))
    .map((p) => p.id);

  let avatarMap = new Map<string, string | null>();
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, avatar_url")
      .in("id", memberIds);

    avatarMap = new Map(
      (profiles ?? []).map((p) => [p.id, p.avatar_url])
    );
  }

  return participants
    .filter(
      (p) => p.type === "fictional" || presentSet.has(p.id)
    )
    .map((p) => ({
      ...p,
      avatarUrl: p.type === "member" ? avatarMap.get(p.id) ?? null : null,
    }));
}

function buildPlayerFromRanking(
  participant: AssignableParticipant,
  rankingMap: Map<
    string,
    { score: number; peladasJogadas: number; displayName: string }
  >
): TeamDistributionPlayer {
  const ranking = rankingMap.get(participant.id);
  const peladasJogadas = ranking?.peladasJogadas ?? 0;
  const score = ranking?.score ?? 0;

  return {
    participantId: participant.id,
    participantType: participant.type,
    displayName:
      participant.nickname ??
      ranking?.displayName ??
      participant.displayName,
    avatarUrl: participant.avatarUrl,
    skill: calculateAvgSkill(score, peladasJogadas),
    peladasJogadas,
  };
}

function buildRankingMap(
  ranking: Awaited<ReturnType<typeof getRankingGeral>>
) {
  return new Map(
    ranking.map((entry) => [
      entry.participant_id,
      {
        score: entry.score,
        peladasJogadas: Number(entry.peladas_jogadas),
        displayName: entry.displayName,
      },
    ])
  );
}

function groupAssignments(
  assignments: {
    team_index: number;
    user_id: string | null;
    fictional_player_id: string | null;
    sort_order: number;
  }[],
  playerMap: Map<string, TeamDistributionPlayer>
): TeamDistributionPlayer[][] {
  if (assignments.length === 0) return [];

  const maxIndex = Math.max(...assignments.map((a) => a.team_index));
  const teams: TeamDistributionPlayer[][] = Array.from(
    { length: maxIndex + 1 },
    () => []
  );

  const sorted = [...assignments].sort((a, b) => {
    if (a.team_index !== b.team_index) return a.team_index - b.team_index;
    return a.sort_order - b.sort_order;
  });

  for (const assignment of sorted) {
    const participantId =
      assignment.user_id ?? assignment.fictional_player_id;
    if (!participantId) continue;

    const player = playerMap.get(participantId);
    if (!player) continue;

    teams[assignment.team_index].push(player);
  }

  return teams;
}

export async function getTeamDistribution(
  peladaId: string
): Promise<TeamDistribution | null> {
  const { team } = await getDashboardContext();
  if (!team) return null;

  const pelada = await getPeladaById(peladaId);
  if (!pelada || pelada.team_id !== team.id) return null;

  const supabase = await createClient();

  const [
    assignable,
    ranking,
    { data: draft },
    { data: assignments },
  ] = await Promise.all([
    getAssignableParticipants(team.id, peladaId),
    getRankingGeral(team.id),
    supabase
      .from("pelada_team_drafts")
      .select("*")
      .eq("pelada_id", peladaId)
      .maybeSingle(),
    supabase
      .from("pelada_team_assignments")
      .select("team_index, user_id, fictional_player_id, sort_order")
      .eq("pelada_id", peladaId)
      .order("team_index")
      .order("sort_order"),
  ]);

  const rankingMap = buildRankingMap(ranking);
  const playerMap = new Map(
    assignable.map((p) => [
      p.id,
      buildPlayerFromRanking(p, rankingMap),
    ])
  );

  const assignedIds = new Set(
    (assignments ?? []).map(
      (a) => a.user_id ?? a.fictional_player_id
    )
  );

  const unassignedPlayers = assignable
    .filter((p) => !assignedIds.has(p.id))
    .map((p) => buildPlayerFromRanking(p, rankingMap));

  const teams = groupAssignments(assignments ?? [], playerMap);
  const teamTotals = teams.map((teamPlayers) =>
    teamPlayers.reduce((sum, player) => sum + player.skill, 0)
  );

  return {
    playersPerTeam: draft?.players_per_team ?? DEFAULT_PLAYERS_PER_TEAM,
    teams,
    teamTotals,
    unassignedPlayers,
    presentCount: assignable.length,
  };
}

export async function generateTeamDistribution(
  peladaId: string,
  playersPerTeam: number = DEFAULT_PLAYERS_PER_TEAM
): Promise<TeamDistributionActionResult> {
  const auth = await requireAdminPelada(peladaId);
  if ("error" in auth && auth.error) return { error: auth.error };

  const { team } = auth;
  const user = await requireUser();

  if (playersPerTeam < 2) {
    return { error: "Informe pelo menos 2 jogadores por time." };
  }

  const [assignable, ranking] = await Promise.all([
    getAssignableParticipants(team.id, peladaId),
    getRankingGeral(team.id),
  ]);

  if (assignable.length < 2) {
    return {
      error: "É necessário pelo menos 2 jogadores confirmados para formar times.",
    };
  }

  const rankingMap = buildRankingMap(ranking);
  const players = assignable.map((p) => {
    const info = buildPlayerFromRanking(p, rankingMap);
    return { id: p.id, skill: info.skill };
  });

  let balanced: Map<number, string[]>;
  try {
    balanced = balanceTeams(players, playersPerTeam);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível distribuir os times.",
    };
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("pelada_team_assignments")
    .delete()
    .eq("pelada_id", peladaId);

  if (deleteError) return { error: deleteError.message };

  const participantTypeMap = new Map(
    assignable.map((p) => [p.id, p.type])
  );

  const rows: {
    pelada_id: string;
    team_index: number;
    user_id: string | null;
    fictional_player_id: string | null;
    sort_order: number;
  }[] = [];

  for (const [teamIndex, playerIds] of balanced.entries()) {
    playerIds.forEach((playerId, sortOrder) => {
      const type = participantTypeMap.get(playerId);
      rows.push({
        pelada_id: peladaId,
        team_index: teamIndex,
        user_id: type === "member" ? playerId : null,
        fictional_player_id: type === "fictional" ? playerId : null,
        sort_order: sortOrder,
      });
    });
  }

  const { error: insertError } = await supabase
    .from("pelada_team_assignments")
    .insert(rows);

  if (insertError) return { error: insertError.message };

  const { error: draftError } = await supabase
    .from("pelada_team_drafts")
    .upsert(
      {
        pelada_id: peladaId,
        players_per_team: playersPerTeam,
        skill_metric: "avg_score",
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
      { onConflict: "pelada_id" }
    );

  if (draftError) return { error: draftError.message };

  revalidatePath(`/dashboard/peladas/${peladaId}`);
  const numTeams = countTeams(assignable.length, playersPerTeam);
  return {
    success: `Times formados: ${numTeams} times com ${assignable.length} jogadores.`,
  };
}

export async function movePlayer(
  peladaId: string,
  participantId: string,
  participantType: ParticipantType,
  toTeamIndex: number
): Promise<TeamDistributionActionResult> {
  const auth = await requireAdminPelada(peladaId);
  if ("error" in auth && auth.error) return { error: auth.error };

  if (toTeamIndex < 0) {
    return { error: "Time inválido." };
  }

  const supabase = await createClient();

  let assignmentQuery = supabase
    .from("pelada_team_assignments")
    .select("id, team_index")
    .eq("pelada_id", peladaId);

  if (participantType === "member") {
    assignmentQuery = assignmentQuery
      .eq("user_id", participantId)
      .is("fictional_player_id", null);
  } else {
    assignmentQuery = assignmentQuery
      .eq("fictional_player_id", participantId)
      .is("user_id", null);
  }

  const { data: existing, error: fetchError } =
    await assignmentQuery.maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!existing) return { error: "Jogador não está em nenhum time." };

  const { count, error: countError } = await supabase
    .from("pelada_team_assignments")
    .select("*", { count: "exact", head: true })
    .eq("pelada_id", peladaId)
    .eq("team_index", toTeamIndex);

  if (countError) return { error: countError.message };

  const { error: updateError } = await supabase
    .from("pelada_team_assignments")
    .update({
      team_index: toTeamIndex,
      sort_order: count ?? 0,
    })
    .eq("id", existing.id);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/dashboard/peladas/${peladaId}`);
  return { success: "Jogador movido de time." };
}

export async function clearTeamDistribution(
  peladaId: string
): Promise<TeamDistributionActionResult> {
  const auth = await requireAdminPelada(peladaId);
  if ("error" in auth && auth.error) return { error: auth.error };

  const supabase = await createClient();

  const [{ error: assignmentsError }, { error: draftError }] =
    await Promise.all([
      supabase
        .from("pelada_team_assignments")
        .delete()
        .eq("pelada_id", peladaId),
      supabase.from("pelada_team_drafts").delete().eq("pelada_id", peladaId),
    ]);

  if (assignmentsError) return { error: assignmentsError.message };
  if (draftError) return { error: draftError.message };

  revalidatePath(`/dashboard/peladas/${peladaId}`);
  return { success: "Distribuição de times removida." };
}
