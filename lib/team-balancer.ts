export type BalancerPlayer = {
  id: string;
  skill: number;
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

/**
 * Greedy min-sum: assigns each player (sorted by skill desc) to the team
 * with the lowest accumulated skill total.
 */
export function balanceTeams(
  players: BalancerPlayer[],
  playersPerTeam: number
): Map<number, string[]> {
  if (players.length < 2) {
    throw new Error("É necessário pelo menos 2 jogadores para formar times.");
  }

  const numTeams = countTeams(players.length, playersPerTeam);
  const teams = Array.from({ length: numTeams }, () => ({
    ids: [] as string[],
    totalSkill: 0,
  }));

  const sorted = [...players].sort((a, b) => b.skill - a.skill);

  for (const player of sorted) {
    let minIdx = 0;
    for (let i = 1; i < teams.length; i++) {
      const current = teams[i];
      const best = teams[minIdx];
      if (
        current.totalSkill < best.totalSkill ||
        (current.totalSkill === best.totalSkill &&
          current.ids.length < best.ids.length)
      ) {
        minIdx = i;
      }
    }

    teams[minIdx].ids.push(player.id);
    teams[minIdx].totalSkill += player.skill;
  }

  const result = new Map<number, string[]>();
  teams.forEach((team, index) => {
    result.set(index, team.ids);
  });
  return result;
}
