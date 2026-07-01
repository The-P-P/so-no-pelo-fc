export type BalancerPlayer = {
  id: string;
  skill: number;
};

export type BalanceTeamsOptions = {
  /** Embaralha empates para redistribuições gerarem times diferentes */
  randomize?: boolean;
};

export function calculateAvgSkill(
  score: number,
  peladasJogadas: number
): number {
  return peladasJogadas > 0 ? score / peladasJogadas : 0;
}

export function countTeams(
  playerCount: number,
  playersPerTeam: number
): number {
  return Math.max(2, Math.round(playerCount / playersPerTeam));
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function orderPlayersForBalance(
  players: BalancerPlayer[],
  randomize: boolean
): BalancerPlayer[] {
  const sorted = [...players].sort((a, b) => b.skill - a.skill);
  if (!randomize) return sorted;

  const buckets: BalancerPlayer[][] = [];
  for (const player of sorted) {
    const last = buckets[buckets.length - 1];
    if (!last || last[0].skill !== player.skill) {
      buckets.push([player]);
    } else {
      last.push(player);
    }
  }

  return buckets.flatMap((bucket) => shuffleInPlace(bucket));
}

function pickTeamIndex(
  teams: { ids: string[]; totalSkill: number }[],
  randomize: boolean
): number {
  let minSkill = teams[0].totalSkill;
  let minSize = teams[0].ids.length;
  const candidates = [0];

  for (let i = 1; i < teams.length; i++) {
    const team = teams[i];
    if (team.totalSkill < minSkill) {
      minSkill = team.totalSkill;
      minSize = team.ids.length;
      candidates.length = 0;
      candidates.push(i);
      continue;
    }

    if (team.totalSkill === minSkill) {
      if (team.ids.length < minSize) {
        minSize = team.ids.length;
        candidates.length = 0;
        candidates.push(i);
      } else if (team.ids.length === minSize) {
        candidates.push(i);
      }
    }
  }

  if (randomize && candidates.length > 1) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  return candidates[0];
}

/**
 * Greedy min-sum: assigns each player (sorted by skill desc) to the team
 * with the lowest accumulated skill total.
 */
export function balanceTeams(
  players: BalancerPlayer[],
  playersPerTeam: number,
  options: BalanceTeamsOptions = {}
): Map<number, string[]> {
  if (players.length < 2) {
    throw new Error("É necessário pelo menos 2 jogadores para formar times.");
  }

  const randomize = options.randomize ?? false;
  const numTeams = countTeams(players.length, playersPerTeam);
  const teams = Array.from({ length: numTeams }, () => ({
    ids: [] as string[],
    totalSkill: 0,
  }));

  const ordered = orderPlayersForBalance(players, randomize);

  for (const player of ordered) {
    const minIdx = pickTeamIndex(teams, randomize);
    teams[minIdx].ids.push(player.id);
    teams[minIdx].totalSkill += player.skill;
  }

  const result = new Map<number, string[]>();
  teams.forEach((team, index) => {
    result.set(index, team.ids);
  });
  return result;
}
