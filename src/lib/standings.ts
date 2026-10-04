import type { Match, Results, Team } from "./types";

export type StandingRow = {
  rank: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

type Tally = Omit<StandingRow, "rank">;

const POINTS_WIN = 3;
const POINTS_DRAW = 1;

/** "home" counts only home matches of a team, "away" only away matches. */
export type Side = "home" | "away";

function tally(teams: Team[], matches: Match[], results: Results, side?: Side): Map<string, Tally> {
  const table = new Map<string, Tally>(
    teams.map((team) => [
      team.id,
      {
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      },
    ]),
  );

  const record = (row: Tally, scored: number, conceded: number) => {
    row.played += 1;
    row.goalsFor += scored;
    row.goalsAgainst += conceded;
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    if (scored > conceded) {
      row.won += 1;
      row.points += POINTS_WIN;
    } else if (scored === conceded) {
      row.drawn += 1;
      row.points += POINTS_DRAW;
    } else {
      row.lost += 1;
    }
  };

  for (const match of matches) {
    const result = results[match.id];
    const home = table.get(match.home);
    const away = table.get(match.away);
    if (!result || !home || !away) continue;
    if (side !== "away") record(home, result.home, result.away);
    if (side !== "home") record(away, result.away, result.home);
  }

  return table;
}

// Steps 1 to 3: points, goal difference, goals scored.
function compareOverall(a: Tally, b: Tally): number {
  return (
    b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor
  );
}

// Steps 4 and 5: the matches between the tied teams, then the club name.
function breakTie(group: Tally[], schedule: Match[], results: Results): Tally[] {
  const ids = new Set(group.map((row) => row.team.id));
  const mutual = schedule.filter((match) => ids.has(match.home) && ids.has(match.away));
  const headToHead = tally(
    group.map((row) => row.team),
    mutual,
    results,
  );

  return [...group].sort((a, b) => {
    const h2hA = headToHead.get(a.team.id)!;
    const h2hB = headToHead.get(b.team.id)!;
    return (
      h2hB.points - h2hA.points ||
      h2hB.goalDifference - h2hA.goalDifference ||
      a.team.name.localeCompare(b.team.name, "nl")
    );
  });
}

/**
 * Eredivisie order: points, goal difference, goals scored,
 * head-to-head result, club name.
 * With `side`, the table counts only the home matches or only the away matches.
 */
export function computeStandings(
  teams: Team[],
  schedule: Match[],
  results: Results,
  side?: Side,
): StandingRow[] {
  const rows = [...tally(teams, schedule, results, side).values()].sort(compareOverall);
  const ordered: Tally[] = [];

  for (let start = 0; start < rows.length; ) {
    let end = start + 1;
    while (end < rows.length && compareOverall(rows[start], rows[end]) === 0) end++;
    const group = rows.slice(start, end);
    ordered.push(...(group.length > 1 ? breakTie(group, schedule, results) : group));
    start = end;
  }

  return ordered.map((row, index) => ({ rank: index + 1, ...row }));
}
