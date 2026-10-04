import { LINE_LABELS, lineOf } from "./positions";
import type { CoachId, Match, Player, Result, Results, Team } from "./types";

// The results have no date. The order of the schedule is the order of the matches.

export type PlayedMatch = { match: Match; result: Result };

/** W = win, G = draw (gelijk), V = loss (verlies). */
export type Outcome = "W" | "G" | "V";

export type WinRecord = { played: number; won: number; drawn: number; lost: number };

export type Streak = { outcome: Outcome; length: number };

const emptyRecord = (): WinRecord => ({ played: 0, won: 0, drawn: 0, lost: 0 });

function outcomeOf(scored: number, conceded: number): Outcome {
  return scored > conceded ? "W" : scored === conceded ? "G" : "V";
}

function addOutcome(record: WinRecord, outcome: Outcome): void {
  record.played += 1;
  if (outcome === "W") record.won += 1;
  else if (outcome === "G") record.drawn += 1;
  else record.lost += 1;
}

export function playedMatches(schedule: Match[], results: Results): PlayedMatch[] {
  return schedule.flatMap((match) => (results[match.id] ? [{ match, result: results[match.id] }] : []));
}

/** The streak at the end of the list, the longest run of wins and the longest run without a loss. */
export function streaks(outcomes: Outcome[]): { current: Streak | null; longestWin: number; longestUnbeaten: number } {
  let longestWin = 0;
  let longestUnbeaten = 0;
  let win = 0;
  let unbeaten = 0;
  for (const outcome of outcomes) {
    win = outcome === "W" ? win + 1 : 0;
    unbeaten = outcome === "V" ? 0 : unbeaten + 1;
    longestWin = Math.max(longestWin, win);
    longestUnbeaten = Math.max(longestUnbeaten, unbeaten);
  }

  const last = outcomes.at(-1);
  if (!last) return { current: null, longestWin, longestUnbeaten };
  let length = 0;
  for (let i = outcomes.length - 1; i >= 0 && outcomes[i] === last; i--) length++;
  return { current: { outcome: last, length }, longestWin, longestUnbeaten };
}

// A bigger goal difference wins. With an equal difference, more goals win. The first match wins a tie.
function bigger(a: PlayedMatch | null, b: PlayedMatch, margin: (played: PlayedMatch) => number): PlayedMatch {
  if (!a) return b;
  const total = (played: PlayedMatch) => played.result.home + played.result.away;
  return margin(b) > margin(a) || (margin(b) === margin(a) && total(b) > total(a)) ? b : a;
}

function findPlayer(squads: Record<string, Player[]>, teamId: string, playerId: number | undefined) {
  return squads[teamId]?.find((player) => player.id === playerId);
}

/* ------------------------------------------------------------------ */
/* Niels against Tim                                                   */
/* ------------------------------------------------------------------ */

export type CoachScorer = { player: Player; team: Team; goals: number };

export type CoachStats = WinRecord & {
  coach: CoachId;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  /** Matches without a goal against. */
  cleanSheets: number;
  home: WinRecord;
  away: WinRecord;
  /** The last 5 matches, the oldest first. */
  form: Outcome[];
  currentStreak: Streak | null;
  longestWinStreak: number;
  longestUnbeaten: number;
  biggestWin: PlayedMatch | null;
  /** The 3 footballers with the most goals for this person. */
  topScorers: CoachScorer[];
};

export type DuelStats = {
  /** Matches with a known coach. */
  counted: number;
  /** Played matches without a coach. They do not count. */
  missing: number;
  coaches: Record<CoachId, CoachStats>;
  /** The record of each person with each club. */
  byTeam: { team: Team; records: Record<CoachId, WinRecord> }[];
};

export function computeDuelStats(
  teams: Team[],
  squads: Record<string, Player[]>,
  schedule: Match[],
  results: Results,
): DuelStats {
  const played = playedMatches(schedule, results);
  const known = played.filter(({ result }) => result.homeCoach);
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const byTeam = new Map(
    teams.map((team) => [team.id, { team, records: { N: emptyRecord(), T: emptyRecord() } }]),
  );

  const coachStats = (coach: CoachId): CoachStats => {
    const stats: CoachStats = {
      coach,
      ...emptyRecord(),
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      cleanSheets: 0,
      home: emptyRecord(),
      away: emptyRecord(),
      form: [],
      currentStreak: null,
      longestWinStreak: 0,
      longestUnbeaten: 0,
      biggestWin: null,
      topScorers: [],
    };
    const outcomes: Outcome[] = [];
    const scorers = new Map<string, CoachScorer>();

    for (const item of known) {
      const { match, result } = item;
      const side = result.homeCoach === coach ? "home" : "away";
      const teamId = side === "home" ? match.home : match.away;
      const scored = side === "home" ? result.home : result.away;
      const conceded = side === "home" ? result.away : result.home;
      const outcome = outcomeOf(scored, conceded);

      outcomes.push(outcome);
      addOutcome(stats, outcome);
      addOutcome(stats[side], outcome);
      const teamRecord = byTeam.get(teamId);
      if (teamRecord) addOutcome(teamRecord.records[coach], outcome);

      stats.goalsFor += scored;
      stats.goalsAgainst += conceded;
      if (conceded === 0) stats.cleanSheets += 1;
      if (outcome === "W") stats.biggestWin = bigger(stats.biggestWin, item, (p) => Math.abs(p.result.home - p.result.away));

      for (const goal of result.goals) {
        if (goal.team !== teamId || goal.ownGoal) continue;
        const player = findPlayer(squads, teamId, goal.playerId);
        const team = teamsById.get(teamId);
        if (!player || !team) continue;
        const key = `${teamId}:${player.id}`;
        const scorer = scorers.get(key);
        if (scorer) scorer.goals += 1;
        else scorers.set(key, { player, team, goals: 1 });
      }
    }

    const run = streaks(outcomes);
    stats.points = stats.won * 3 + stats.drawn;
    stats.form = outcomes.slice(-5);
    stats.currentStreak = run.current;
    stats.longestWinStreak = run.longestWin;
    stats.longestUnbeaten = run.longestUnbeaten;
    stats.topScorers = [...scorers.values()]
      .sort((a, b) => b.goals - a.goals || a.player.name.localeCompare(b.player.name, "nl"))
      .slice(0, 3);
    return stats;
  };

  return {
    counted: known.length,
    missing: played.length - known.length,
    coaches: { N: coachStats("N"), T: coachStats("T") },
    byTeam: [...byTeam.values()],
  };
}

/* ------------------------------------------------------------------ */
/* League                                                              */
/* ------------------------------------------------------------------ */

export type LeagueStats = {
  played: number;
  total: number;
  goals: number;
  goalsPerMatch: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  /** The match with the biggest goal difference. Null when all matches are draws. */
  biggestWin: PlayedMatch | null;
  highestScoring: PlayedMatch | null;
  /** The 3 most common scores, as "home–away". */
  commonScores: { score: string; count: number }[];
  goalsPerRound: { round: number; goals: number; played: number }[];
};

export function computeLeagueStats(schedule: Match[], results: Results): LeagueStats {
  const played = playedMatches(schedule, results);
  const rounds = [...new Set(schedule.map((match) => match.round))].sort((a, b) => a - b);
  const scores = new Map<string, number>();

  const stats: LeagueStats = {
    played: played.length,
    total: schedule.length,
    goals: 0,
    goalsPerMatch: 0,
    homeWins: 0,
    draws: 0,
    awayWins: 0,
    biggestWin: null,
    highestScoring: null,
    commonScores: [],
    goalsPerRound: rounds.map((round) => ({ round, goals: 0, played: 0 })),
  };

  for (const item of played) {
    const { match, result } = item;
    const total = result.home + result.away;
    stats.goals += total;
    if (result.home > result.away) stats.homeWins += 1;
    else if (result.home === result.away) stats.draws += 1;
    else stats.awayWins += 1;

    if (result.home !== result.away) {
      stats.biggestWin = bigger(stats.biggestWin, item, (p) => Math.abs(p.result.home - p.result.away));
    }
    if (!stats.highestScoring || total > stats.highestScoring.result.home + stats.highestScoring.result.away) {
      stats.highestScoring = item;
    }

    const score = `${result.home}–${result.away}`;
    scores.set(score, (scores.get(score) ?? 0) + 1);

    const round = stats.goalsPerRound.find((entry) => entry.round === match.round);
    if (round) {
      round.goals += total;
      round.played += 1;
    }
  }

  stats.goalsPerMatch = played.length ? stats.goals / played.length : 0;
  stats.commonScores = [...scores]
    .map(([score, count]) => ({ score, count }))
    .sort((a, b) => b.count - a.count || a.score.localeCompare(b.score))
    .slice(0, 3);
  return stats;
}

/* ------------------------------------------------------------------ */
/* Clubs                                                               */
/* ------------------------------------------------------------------ */

export type ClubRow = {
  team: Team;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  longestWinStreak: number;
  longestUnbeaten: number;
};

export function computeClubRows(teams: Team[], schedule: Match[], results: Results): ClubRow[] {
  const played = playedMatches(schedule, results);

  return teams.map((team) => {
    const row: ClubRow = {
      team,
      played: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      cleanSheets: 0,
      longestWinStreak: 0,
      longestUnbeaten: 0,
    };
    const outcomes: Outcome[] = [];

    for (const { match, result } of played) {
      if (match.home !== team.id && match.away !== team.id) continue;
      const isHome = match.home === team.id;
      const scored = isHome ? result.home : result.away;
      const conceded = isHome ? result.away : result.home;
      row.played += 1;
      row.goalsFor += scored;
      row.goalsAgainst += conceded;
      if (conceded === 0) row.cleanSheets += 1;
      outcomes.push(outcomeOf(scored, conceded));
    }

    const run = streaks(outcomes);
    row.longestWinStreak = run.longestWin;
    row.longestUnbeaten = run.longestUnbeaten;
    return row;
  });
}

/** Gives the best value and all rows that have it. Null when there are no rows or the best value is 0 for "max". */
export function leaders<T>(rows: T[], value: (row: T) => number, best: "max" | "min"): { value: number; rows: T[] } | null {
  if (rows.length === 0) return null;
  const values = rows.map(value);
  const top = best === "max" ? Math.max(...values) : Math.min(...values);
  if (best === "max" && top === 0) return null;
  return { value: top, rows: rows.filter((row) => value(row) === top) };
}

/* ------------------------------------------------------------------ */
/* Goal scorers                                                        */
/* ------------------------------------------------------------------ */

/** The goals of one player in one match. */
export type MatchHaul = { player: Player; team: Team; played: PlayedMatch; goals: number };

export const OWN_GOAL_LABEL = "Eigen doelpunt";

export type ScorerStats = {
  /** 3 or more goals of one player in one match. */
  hatTricks: MatchHaul[];
  /** The players with the highest number of goals in one match. */
  bestHauls: MatchHaul[];
  /** Goals by line. The last entry is the own goals. */
  byLine: { label: string; goals: number }[];
  /** The number of different scorers of each club, the most first. */
  scorersPerTeam: { team: Team; scorers: number }[];
  ownGoals: number;
};

export function computeScorerStats(
  teams: Team[],
  squads: Record<string, Player[]>,
  schedule: Match[],
  results: Results,
): ScorerStats {
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const lineGoals = new Map(LINE_LABELS.map((label) => [label, 0]));
  const scorerIds = new Map(teams.map((team) => [team.id, new Set<number>()]));
  const hauls: MatchHaul[] = [];
  let ownGoals = 0;

  for (const item of playedMatches(schedule, results)) {
    const inMatch = new Map<string, MatchHaul>();

    for (const goal of item.result.goals) {
      if (goal.ownGoal) {
        ownGoals += 1;
        continue;
      }
      const team = teamsById.get(goal.team);
      const player = findPlayer(squads, goal.team, goal.playerId);
      if (!team || !player) continue;

      const line = lineOf(player.position);
      lineGoals.set(line, (lineGoals.get(line) ?? 0) + 1);
      scorerIds.get(team.id)?.add(player.id);

      const key = `${team.id}:${player.id}`;
      const haul = inMatch.get(key);
      if (haul) haul.goals += 1;
      else inMatch.set(key, { player, team, played: item, goals: 1 });
    }

    hauls.push(...inMatch.values());
  }

  const most = Math.max(0, ...hauls.map((haul) => haul.goals));
  const byGoals = (a: MatchHaul, b: MatchHaul) => b.goals - a.goals;

  return {
    hatTricks: hauls.filter((haul) => haul.goals >= 3).sort(byGoals),
    bestHauls: most > 0 ? hauls.filter((haul) => haul.goals === most) : [],
    byLine: [
      ...LINE_LABELS.map((label) => ({ label, goals: lineGoals.get(label) ?? 0 })),
      { label: OWN_GOAL_LABEL, goals: ownGoals },
    ],
    scorersPerTeam: teams
      .map((team) => ({ team, scorers: scorerIds.get(team.id)?.size ?? 0 }))
      .sort((a, b) => b.scorers - a.scorers || a.team.name.localeCompare(b.team.name, "nl")),
    ownGoals,
  };
}
