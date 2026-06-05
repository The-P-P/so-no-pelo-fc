"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserTeamMemberships } from "@/lib/auth";
import {
  calculateStatScore,
  DEFAULT_STAT_WEIGHTS,
  type StatWeightKey,
} from "@/lib/stats";
import { getRankingGeral, getTeamStatWeights } from "@/lib/actions/ranking-actions";
import { getRankingPdl } from "@/lib/actions/ranked-actions";
import { getEloInfo } from "@/lib/ranked";
import type { TeamStatWeights } from "@/types";

export type PersonalStatTotals = {
  goals: number;
  assists: number;
  god_saves: number;
  own_goals: number;
  vacilos: number;
  peladas_jogadas: number;
  total_peladas: number;
  score: number;
};

export type TeamPersonalStats = PersonalStatTotals & {
  team_id: string;
  team_name: string;
  nickname: string | null;
  rank: number;
  total_players: number;
};

export type PersonalPeladaEntry = {
  pelada_id: string;
  date: string;
  location: string | null;
  team_id: string;
  team_name: string;
  goals: number;
  assists: number;
  god_saves: number;
  own_goals: number;
  vacilos: number;
  score: number;
};

export type TeamRankedSummary = {
  team_id: string;
  team_name: string;
  season_name: string;
  total_pdl: number;
  victories: number;
  eloName: string;
  nextEloName: string | null;
  pdlNeededForNext: number | null;
  progressPercent: number;
};

export type PersonalStatsBundle = {
  teams: { id: string; name: string }[];
  byTeam: TeamPersonalStats[];
  aggregate: PersonalStatTotals;
  recentPeladas: PersonalPeladaEntry[];
  rankedByTeam: TeamRankedSummary[];
};

function toWeights(weights: TeamStatWeights): Record<StatWeightKey, number> {
  return {
    goals: weights.goals,
    assists: weights.assists,
    god_saves: weights.god_saves,
    vacilos: weights.vacilos,
    own_goals: weights.own_goals,
  };
}

function emptyTotals(): PersonalStatTotals {
  return {
    goals: 0,
    assists: 0,
    god_saves: 0,
    own_goals: 0,
    vacilos: 0,
    peladas_jogadas: 0,
    total_peladas: 0,
    score: 0,
  };
}

function sumTotals(items: PersonalStatTotals[]): PersonalStatTotals {
  return items.reduce(
    (acc, item) => ({
      goals: acc.goals + item.goals,
      assists: acc.assists + item.assists,
      god_saves: acc.god_saves + item.god_saves,
      own_goals: acc.own_goals + item.own_goals,
      vacilos: acc.vacilos + item.vacilos,
      peladas_jogadas: acc.peladas_jogadas + item.peladas_jogadas,
      total_peladas: acc.total_peladas + item.total_peladas,
      score: acc.score + item.score,
    }),
    emptyTotals()
  );
}

async function getTeamPersonalStats(
  userId: string,
  teamId: string,
  teamName: string,
  nickname: string | null
): Promise<TeamPersonalStats> {
  const supabase = await createClient();

  const [ranking, weights, { count: totalPeladas }] = await Promise.all([
    getRankingGeral(teamId),
    getTeamStatWeights(teamId),
    supabase
      .from("peladas")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId),
  ]);

  const w = toWeights(weights);
  const myEntry = ranking.find(
    (e) => e.participant_type === "member" && e.participant_id === userId
  );

  const members = ranking.filter((e) => e.participant_type === "member");
  const rankIndex = members.findIndex(
    (e) => e.participant_id === userId
  );

  const goals = Number(myEntry?.total_goals ?? 0);
  const assists = Number(myEntry?.total_assists ?? 0);
  const god_saves = Number(myEntry?.total_god_saves ?? 0);
  const own_goals = Number(myEntry?.total_own_goals ?? 0);
  const vacilos = Number(myEntry?.total_vacilos ?? 0);
  const peladas_jogadas = Number(myEntry?.peladas_jogadas ?? 0);

  return {
    team_id: teamId,
    team_name: teamName,
    nickname,
    goals,
    assists,
    god_saves,
    own_goals,
    vacilos,
    peladas_jogadas,
    total_peladas: totalPeladas ?? 0,
    score: calculateStatScore(
      { goals, assists, god_saves, vacilos, own_goals },
      w
    ),
    rank: rankIndex >= 0 ? rankIndex + 1 : members.length + 1,
    total_players: members.length,
  };
}

async function getRecentPeladas(
  userId: string,
  teamIds: string[]
): Promise<PersonalPeladaEntry[]> {
  if (teamIds.length === 0) return [];

  const supabase = await createClient();

  const { data: peladas } = await supabase
    .from("peladas")
    .select("id, date, location, team_id, team:teams(name)")
    .in("team_id", teamIds);

  if (!peladas?.length) return [];

  const peladaMap = new Map(
    peladas.map((p) => [
      p.id,
      {
        id: p.id,
        date: p.date,
        location: p.location,
        team_id: p.team_id,
        team_name: (p.team as unknown as { name: string } | null)?.name ?? "Grupo",
      },
    ])
  );

  const { data: stats } = await supabase
    .from("player_stats")
    .select("pelada_id, goals, assists, god_saves, own_goals, vacilos")
    .eq("user_id", userId)
    .eq("status", "approved")
    .in(
      "pelada_id",
      peladas.map((p) => p.id)
    );

  if (!stats?.length) return [];

  const weightsByTeam = new Map<string, TeamStatWeights>();
  await Promise.all(
    teamIds.map(async (teamId) => {
      weightsByTeam.set(teamId, await getTeamStatWeights(teamId));
    })
  );

  const entries: PersonalPeladaEntry[] = stats
    .map((row) => {
      const pelada = peladaMap.get(row.pelada_id);
      if (!pelada) return null;

      const weights = weightsByTeam.get(pelada.team_id);
      const w = toWeights(
        weights ?? {
          team_id: pelada.team_id,
          ...DEFAULT_STAT_WEIGHTS,
          updated_at: new Date().toISOString(),
        }
      );

      const { goals, assists, god_saves, own_goals, vacilos } = row;

      return {
        pelada_id: pelada.id,
        date: pelada.date,
        location: pelada.location,
        team_id: pelada.team_id,
        team_name: pelada.team_name,
        goals,
        assists,
        god_saves,
        own_goals,
        vacilos,
        score: calculateStatScore(
          { goals, assists, god_saves, vacilos, own_goals },
          w
        ),
      };
    })
    .filter((entry): entry is PersonalPeladaEntry => entry !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);

  return entries;
}

export async function getPersonalStatsBundle(): Promise<PersonalStatsBundle | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const memberships = await getUserTeamMemberships();
  if (memberships.length === 0) {
    return {
      teams: [],
      byTeam: [],
      aggregate: emptyTotals(),
      recentPeladas: [],
      rankedByTeam: [],
    };
  }

  const byTeam = await Promise.all(
    memberships.map((m) =>
      getTeamPersonalStats(
        user.id,
        m.team.id,
        m.team.name,
        m.membership.nickname
      )
    )
  );

  const teamIds = memberships.map((m) => m.team.id);
  const [recentPeladas, rankedByTeam] = await Promise.all([
    getRecentPeladas(user.id, teamIds),
    Promise.all(
      memberships.map(async (m) => {
        const ranked = await getRankingPdl(m.team.id);
        const me = ranked.entries.find((e) => e.user_id === user.id);
        const totalPdl = me?.total_pdl ?? 0;
        const elo = getEloInfo(totalPdl, ranked.customTopName);

        return {
          team_id: m.team.id,
          team_name: m.team.name,
          season_name: ranked.season.name,
          total_pdl: totalPdl,
          victories: me?.victories ?? 0,
          eloName: elo.eloName,
          nextEloName: elo.nextEloName,
          pdlNeededForNext: elo.pdlNeededForNext,
          progressPercent: elo.progressPercent,
        };
      })
    ),
  ]);

  return {
    teams: memberships.map((m) => ({ id: m.team.id, name: m.team.name })),
    byTeam,
    aggregate: sumTotals(byTeam),
    recentPeladas,
    rankedByTeam,
  };
}
