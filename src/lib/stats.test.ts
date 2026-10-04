import { describe, expect, it } from "vitest";
import { computeStandings } from "./standings";
import {
  computeClubRows,
  computeDuelStats,
  computeLeagueStats,
  computeScorerStats,
  leaders,
  streaks,
} from "./stats";
import { parseResultsFile } from "./store/resultsFile";
import type { Match, Player, Position, Results, Team } from "./types";

const team = (id: string, name: string): Team => ({
  id,
  name,
  shortName: id.toUpperCase(),
  primary: "#000000",
  secondary: "#ffffff",
});
const player = (id: number, name: string, position: Position): Player => ({ id, name, number: id, position });

const alfa = team("a", "Alfa");
const bravo = team("b", "Bravo");
const charlie = team("c", "Charlie");
const delta = team("d", "Delta");
const teams = [alfa, bravo, charlie, delta];

const squads = {
  a: [player(1, "Anna", "SP"), player(2, "Bert", "CM")],
  b: [player(1, "Bas", "CV")],
  c: [player(1, "Cor", "SP")],
  d: [player(1, "Dirk", "GK")],
};

const match = (round: number, home: Team, away: Team): Match => ({
  id: `${home.id}-${away.id}`,
  round,
  home: home.id,
  away: away.id,
});

const schedule = [
  match(1, alfa, bravo),
  match(1, charlie, delta),
  match(2, alfa, charlie),
  match(2, bravo, delta),
  match(3, alfa, delta),
  match(3, bravo, charlie),
];

// Niels wins 3 matches and draws 1. One match has no coach. One match is not played.
const results: Results = {
  "a-b": {
    home: 3,
    away: 0,
    homeCoach: "N",
    goals: [
      { team: "a", playerId: 1 },
      { team: "a", playerId: 1 },
      { team: "a", playerId: 1 },
    ],
  },
  "c-d": {
    home: 1,
    away: 1,
    homeCoach: "T",
    goals: [
      { team: "c", playerId: 1 },
      { team: "d", ownGoal: true },
    ],
  },
  "a-c": {
    home: 0,
    away: 2,
    homeCoach: "T",
    goals: [
      { team: "c", playerId: 1 },
      { team: "c", playerId: 1 },
    ],
  },
  "b-d": {
    home: 2,
    away: 1,
    goals: [
      { team: "b", playerId: 1 },
      { team: "b", playerId: 1 },
      { team: "d", playerId: 1 },
    ],
  },
  "a-d": { home: 1, away: 0, homeCoach: "N", goals: [{ team: "a", playerId: 2 }] },
};

describe("streaks", () => {
  it("gives the current streak and the longest runs", () => {
    expect(streaks(["W", "W", "G", "V", "W", "W", "W"])).toEqual({
      current: { outcome: "W", length: 3 },
      longestWin: 3,
      longestUnbeaten: 3,
    });
    expect(streaks(["W", "G", "G", "V"])).toEqual({
      current: { outcome: "V", length: 1 },
      longestWin: 1,
      longestUnbeaten: 3,
    });
  });

  it("gives no current streak without matches", () => {
    expect(streaks([])).toEqual({ current: null, longestWin: 0, longestUnbeaten: 0 });
  });
});

describe("computeDuelStats", () => {
  const duel = computeDuelStats(teams, squads, schedule, results);
  const niels = duel.coaches.N;
  const tim = duel.coaches.T;

  it("counts only the matches with a coach", () => {
    expect(duel.counted).toBe(4);
    expect(duel.missing).toBe(1);
  });

  it("gives the record, the points and the goals of each person", () => {
    expect(niels).toMatchObject({
      played: 4,
      won: 3,
      drawn: 1,
      lost: 0,
      points: 10,
      goalsFor: 7,
      goalsAgainst: 1,
      cleanSheets: 3,
    });
    expect(tim).toMatchObject({
      played: 4,
      won: 0,
      drawn: 1,
      lost: 3,
      points: 1,
      goalsFor: 1,
      goalsAgainst: 7,
      cleanSheets: 0,
    });
  });

  it("splits the record in home and away", () => {
    expect(niels.home).toEqual({ played: 2, won: 2, drawn: 0, lost: 0 });
    expect(niels.away).toEqual({ played: 2, won: 1, drawn: 1, lost: 0 });
    expect(tim.home).toEqual({ played: 2, won: 0, drawn: 1, lost: 1 });
    expect(tim.away).toEqual({ played: 2, won: 0, drawn: 0, lost: 2 });
  });

  it("gives the form and the streaks in schedule order", () => {
    expect(niels.form).toEqual(["W", "G", "W", "W"]);
    expect(niels.currentStreak).toEqual({ outcome: "W", length: 2 });
    expect(niels.longestWinStreak).toBe(2);
    expect(niels.longestUnbeaten).toBe(4);

    expect(tim.form).toEqual(["V", "G", "V", "V"]);
    expect(tim.currentStreak).toEqual({ outcome: "V", length: 2 });
    expect(tim.longestWinStreak).toBe(0);
    expect(tim.longestUnbeaten).toBe(1);
  });

  it("gives the biggest win of each person", () => {
    expect(niels.biggestWin?.match.id).toBe("a-b");
    expect(tim.biggestWin).toBeNull();
  });

  it("gives the record of each person with each club", () => {
    const byId = Object.fromEntries(duel.byTeam.map((entry) => [entry.team.id, entry.records]));
    expect(byId.a.N).toEqual({ played: 2, won: 2, drawn: 0, lost: 0 });
    expect(byId.a.T).toEqual({ played: 1, won: 0, drawn: 0, lost: 1 });
    expect(byId.c.N).toEqual({ played: 1, won: 1, drawn: 0, lost: 0 });
    expect(byId.c.T).toEqual({ played: 1, won: 0, drawn: 1, lost: 0 });
    expect(byId.b.N).toEqual({ played: 0, won: 0, drawn: 0, lost: 0 });
  });

  it("gives the top scorers of each person, without own goals", () => {
    expect(niels.topScorers.map((scorer) => [scorer.player.name, scorer.goals])).toEqual([
      ["Anna", 3],
      ["Cor", 2],
      ["Bert", 1],
    ]);
    expect(tim.topScorers.map((scorer) => [scorer.player.name, scorer.goals])).toEqual([["Cor", 1]]);
  });
});

describe("computeLeagueStats", () => {
  const league = computeLeagueStats(schedule, results);

  it("counts the matches, the goals and the outcomes", () => {
    expect(league).toMatchObject({ played: 5, total: 6, goals: 11, homeWins: 3, draws: 1, awayWins: 1 });
    expect(league.goalsPerMatch).toBeCloseTo(2.2);
  });

  it("gives the biggest win and the match with the most goals", () => {
    expect(league.biggestWin?.match.id).toBe("a-b");
    // "a-b" and "b-d" have 3 goals. The first match in the schedule wins.
    expect(league.highestScoring?.match.id).toBe("a-b");
  });

  it("gives the goals of each round", () => {
    expect(league.goalsPerRound).toEqual([
      { round: 1, goals: 5, played: 2 },
      { round: 2, goals: 5, played: 2 },
      { round: 3, goals: 1, played: 1 },
    ]);
  });

  it("gives the most common scores", () => {
    const twice: Results = { ...results, "b-c": { home: 1, away: 1, goals: [] } };
    expect(computeLeagueStats(schedule, twice).commonScores[0]).toEqual({ score: "1–1", count: 2 });
    expect(league.commonScores).toHaveLength(3);
  });

  it("gives empty values without results", () => {
    expect(computeLeagueStats(schedule, {})).toMatchObject({
      played: 0,
      goals: 0,
      goalsPerMatch: 0,
      biggestWin: null,
      highestScoring: null,
      commonScores: [],
    });
  });
});

describe("computeClubRows and leaders", () => {
  const rows = computeClubRows(teams, schedule, results);
  const byId = Object.fromEntries(rows.map((row) => [row.team.id, row]));

  it("gives the goals, the clean sheets and the streaks of each club", () => {
    expect(byId.a).toMatchObject({ played: 3, goalsFor: 4, goalsAgainst: 2, cleanSheets: 2, longestWinStreak: 1 });
    expect(byId.c).toMatchObject({ played: 2, goalsFor: 3, goalsAgainst: 1, cleanSheets: 1, longestUnbeaten: 2 });
    expect(byId.d).toMatchObject({ played: 3, goalsFor: 2, goalsAgainst: 4, cleanSheets: 0, longestWinStreak: 0 });
  });

  it("finds the best attack and the best defence", () => {
    expect(leaders(rows, (row) => row.goalsFor, "max")).toMatchObject({ value: 4, rows: [{ team: alfa }] });
    expect(leaders(rows, (row) => row.goalsAgainst, "min")).toMatchObject({ value: 1, rows: [{ team: charlie }] });
  });

  it("gives all rows with the best value, and nothing for a best value of 0", () => {
    expect(leaders(rows, (row) => row.longestWinStreak, "max")?.rows.map((row) => row.team.id)).toEqual(["a", "b", "c"]);
    expect(leaders([byId.d], (row) => row.longestWinStreak, "max")).toBeNull();
    expect(leaders([], () => 1, "max")).toBeNull();
  });
});

describe("computeScorerStats", () => {
  const scorers = computeScorerStats(teams, squads, schedule, results);

  it("finds a hat-trick and the most goals in one match", () => {
    expect(scorers.hatTricks.map((haul) => [haul.player.name, haul.played.match.id, haul.goals])).toEqual([
      ["Anna", "a-b", 3],
    ]);
    expect(scorers.bestHauls.map((haul) => haul.player.name)).toEqual(["Anna"]);
  });

  it("counts the goals of each line and the own goals", () => {
    expect(scorers.byLine).toEqual([
      { label: "Aanval", goals: 6 },
      { label: "Middenveld", goals: 1 },
      { label: "Verdediging", goals: 2 },
      { label: "Keeper", goals: 1 },
      { label: "Eigen doelpunt", goals: 1 },
    ]);
    expect(scorers.ownGoals).toBe(1);
  });

  it("counts the different scorers of each club", () => {
    expect(scorers.scorersPerTeam.map((entry) => [entry.team.id, entry.scorers])).toEqual([
      ["a", 2],
      ["b", 1],
      ["c", 1],
      ["d", 1],
    ]);
  });
});

describe("home and away standings", () => {
  it("counts only the home matches or only the away matches", () => {
    const home = Object.fromEntries(computeStandings(teams, schedule, results, "home").map((row) => [row.team.id, row]));
    const away = Object.fromEntries(computeStandings(teams, schedule, results, "away").map((row) => [row.team.id, row]));

    expect(home.a).toMatchObject({ played: 3, won: 2, lost: 1, points: 6 });
    expect(away.a).toMatchObject({ played: 0, points: 0 });
    expect(away.c).toMatchObject({ played: 1, won: 1, points: 3 });
    expect(home.c).toMatchObject({ played: 1, drawn: 1, points: 1 });
  });
});

describe("homeCoach in the results file", () => {
  it("keeps N and T and drops another value", () => {
    const text = JSON.stringify({
      version: 1,
      results: {
        "a-b": { home: 1, away: 0, goals: [], homeCoach: "T" },
        "c-d": { home: 1, away: 0, goals: [], homeCoach: "X" },
      },
    });
    const parsed = parseResultsFile(text);
    expect(parsed["a-b"].homeCoach).toBe("T");
    expect(parsed["c-d"]).toEqual({ home: 1, away: 0, goals: [] });
  });
});
