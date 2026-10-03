import type { Match, Results, Team } from "./types";

/**
 * Makes a single round-robin schedule with the circle method.
 * The last team stays in place and the other teams rotate.
 * The output depends only on the order of `teams`.
 * Each team gets 4 or 5 home matches when there are 10 teams.
 */
export function generateSchedule(teams: Team[]): Match[] {
  const count = teams.length;
  if (count < 2 || count % 2 !== 0) {
    throw new Error("generateSchedule needs an even number of teams");
  }

  const ids = teams.map((team) => team.id);
  const rotating = count - 1;
  const fixed = ids[rotating];
  const matches: Match[] = [];
  const add = (round: number, home: string, away: string) => {
    matches.push({ id: `${home}-${away}`, round, home, away });
  };

  for (let r = 0; r < rotating; r++) {
    const round = r + 1;
    if (r % 2 === 0) add(round, fixed, ids[r]);
    else add(round, ids[r], fixed);

    for (let i = 1; i < count / 2; i++) {
      const a = ids[(r + i) % rotating];
      const b = ids[(r - i + rotating) % rotating];
      if (i % 2 === 1) add(round, a, b);
      else add(round, b, a);
    }
  }

  return matches;
}

/** The next match is the first match in schedule order without a result. */
export function getNextMatch(schedule: Match[], results: Results): Match | null {
  return schedule.find((match) => !results[match.id]) ?? null;
}
