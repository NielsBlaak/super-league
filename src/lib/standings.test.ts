import { describe, expect, it } from "vitest";
import { computeStandings } from "./standings";
import type { Match, Result, Results, Team } from "./types";

const team = (id: string, name: string): Team => ({
  id,
  name,
  shortName: id.toUpperCase(),
  primary: "#000000",
  secondary: "#ffffff",
});

const alfa = team("a", "Alfa");
const bravo = team("b", "Bravo");
const charlie = team("c", "Charlie");
const delta = team("d", "Delta");
const teams = [delta, charlie, bravo, alfa];

const match = (home: Team, away: Team): Match => ({
  id: `${home.id}-${away.id}`,
  round: 1,
  home: home.id,
  away: away.id,
});

const schedule = [
  match(alfa, bravo),
  match(alfa, charlie),
  match(alfa, delta),
  match(bravo, charlie),
  match(bravo, delta),
  match(charlie, delta),
];

const score = (home: number, away: number): Result => ({ home, away, goals: [] });
const order = (results: Results) => computeStandings(teams, schedule, results).map((row) => row.team.name);

describe("computeStandings", () => {
  it("gives 3 points for a win, 1 for a draw and 0 for a loss", () => {
    const rows = computeStandings(teams, schedule, {
      "a-b": score(2, 1),
      "a-c": score(1, 1),
    });
    const byName = Object.fromEntries(rows.map((row) => [row.team.name, row]));

    expect(byName.Alfa).toMatchObject({
      rank: 1,
      played: 2,
      won: 1,
      drawn: 1,
      lost: 0,
      goalsFor: 3,
      goalsAgainst: 2,
      goalDifference: 1,
      points: 4,
    });
    expect(byName.Charlie).toMatchObject({ played: 1, drawn: 1, points: 1 });
    expect(byName.Bravo).toMatchObject({ played: 1, lost: 1, goalDifference: -1, points: 0 });
    expect(byName.Delta).toMatchObject({ played: 0, points: 0 });
  });

  it("sorts on points first", () => {
    // Bravo has fewer goals than Alfa, but more points.
    expect(order({ "b-c": score(1, 0), "b-d": score(1, 0), "a-c": score(5, 0) })).toEqual([
      "Bravo",
      "Alfa",
      "Delta",
      "Charlie",
    ]);
  });

  it("uses goal difference when the points are equal", () => {
    expect(order({ "b-c": score(3, 0), "a-d": score(1, 0) }).slice(0, 2)).toEqual(["Bravo", "Alfa"]);
  });

  it("uses goals scored when points and goal difference are equal", () => {
    expect(order({ "b-c": score(3, 2), "a-d": score(1, 0) }).slice(0, 2)).toEqual(["Bravo", "Alfa"]);
  });

  it("uses the head-to-head result when points, goal difference and goals scored are equal", () => {
    const results = {
      "a-b": score(0, 1),
      "a-c": score(2, 0),
      "a-d": score(1, 0),
      "b-d": score(2, 0),
      "b-c": score(0, 1),
    };
    const rows = computeStandings(teams, schedule, results);

    expect(rows[0]).toMatchObject({ team: bravo, points: 6, goalDifference: 2, goalsFor: 3 });
    expect(rows[1]).toMatchObject({ team: alfa, points: 6, goalDifference: 2, goalsFor: 3 });
  });

  it("uses the club name when all other steps are equal", () => {
    expect(order({})).toEqual(["Alfa", "Bravo", "Charlie", "Delta"]);
  });

  it("ignores a result for a match that is not in the schedule", () => {
    const rows = computeStandings(teams, schedule, { "x-y": score(9, 0) });
    expect(rows.every((row) => row.played === 0)).toBe(true);
  });
});
