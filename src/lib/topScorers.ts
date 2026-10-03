import type { Match, Player, Results, Team } from "./types";

export type ScorerRow = {
  rank: number;
  player: Player;
  team: Team;
  goals: number;
};

/** Counts goals per player. An own goal does not count. Equal goals share a rank. */
export function computeTopScorers(
  teams: Team[],
  squads: Record<string, Player[]>,
  schedule: Match[],
  results: Results,
): ScorerRow[] {
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const rows = new Map<string, Omit<ScorerRow, "rank">>();

  for (const match of schedule) {
    for (const goal of results[match.id]?.goals ?? []) {
      if (goal.ownGoal || goal.playerId === undefined) continue;
      const team = teamsById.get(goal.team);
      const player = squads[goal.team]?.find((candidate) => candidate.id === goal.playerId);
      if (!team || !player) continue;

      const key = `${team.id}:${player.id}`;
      const row = rows.get(key);
      if (row) row.goals += 1;
      else rows.set(key, { player, team, goals: 1 });
    }
  }

  const sorted = [...rows.values()].sort(
    (a, b) => b.goals - a.goals || a.player.name.localeCompare(b.player.name, "nl"),
  );

  let rank = 0;
  return sorted.map((row, index) => {
    if (index === 0 || row.goals !== sorted[index - 1].goals) rank = index + 1;
    return { rank, ...row };
  });
}
