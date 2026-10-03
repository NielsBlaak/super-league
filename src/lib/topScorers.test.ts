import { describe, expect, it } from "vitest";
import { computeTopScorers } from "./topScorers";
import type { Match, Player, Results, Team } from "./types";

const team = (id: string, name: string): Team => ({
  id,
  name,
  shortName: id.toUpperCase(),
  primary: "#000000",
  secondary: "#ffffff",
});
const player = (id: number, name: string): Player => ({ id, name, number: id, position: "SP" });

const teams = [team("a", "Alfa"), team("b", "Bravo")];
const squads = {
  a: [player(1, "Anna"), player(2, "Bert")],
  b: [player(1, "Cor"), player(3, "Dirk")],
};
const schedule: Match[] = [
  { id: "a-b", round: 1, home: "a", away: "b" },
  { id: "b-a", round: 2, home: "b", away: "a" },
];

describe("computeTopScorers", () => {
  const results: Results = {
    "a-b": {
      home: 3,
      away: 1,
      goals: [
        { team: "a", playerId: 2 },
        { team: "a", playerId: 2 },
        { team: "a", ownGoal: true },
        { team: "b", playerId: 3 },
      ],
    },
    "b-a": {
      home: 1,
      away: 1,
      goals: [
        { team: "b", playerId: 1 },
        { team: "a", playerId: 1 },
      ],
    },
  };

  it("counts the goals of each player over all matches", () => {
    const rows = computeTopScorers(teams, squads, schedule, results);
    expect(rows.map((row) => [row.player.name, row.team.name, row.goals])).toEqual([
      ["Bert", "Alfa", 2],
      ["Anna", "Alfa", 1],
      ["Cor", "Bravo", 1],
      ["Dirk", "Bravo", 1],
    ]);
  });

  it("gives the same rank to players with equal goals", () => {
    const rows = computeTopScorers(teams, squads, schedule, results);
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 2, 2]);
  });

  it("does not count an own goal", () => {
    const rows = computeTopScorers(teams, squads, schedule, results);
    expect(rows.reduce((total, row) => total + row.goals, 0)).toBe(5);
  });

  it("keeps players with the same ID in different teams apart", () => {
    const rows = computeTopScorers(teams, squads, schedule, results);
    expect(rows.find((row) => row.player.name === "Anna")?.goals).toBe(1);
    expect(rows.find((row) => row.player.name === "Cor")?.goals).toBe(1);
  });

  it("ignores a goal of a player that is not in the squad", () => {
    const rows = computeTopScorers(teams, squads, schedule, {
      "a-b": { home: 1, away: 0, goals: [{ team: "a", playerId: 99 }] },
    });
    expect(rows).toEqual([]);
  });
});
