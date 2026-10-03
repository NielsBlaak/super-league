import { describe, expect, it } from "vitest";
import { teams } from "@/data/teams";
import { generateSchedule, getNextMatch } from "./schedule";
import type { Results } from "./types";

const schedule = generateSchedule(teams);

describe("generateSchedule", () => {
  it("makes 9 rounds of 5 matches for 10 teams", () => {
    expect(schedule).toHaveLength(45);
    for (let round = 1; round <= 9; round++) {
      expect(schedule.filter((match) => match.round === round)).toHaveLength(5);
    }
  });

  it("lets each pair of teams play exactly one time", () => {
    const pairs = schedule.map((match) => [match.home, match.away].sort().join("|"));
    expect(new Set(pairs).size).toBe(45);
    expect(schedule.every((match) => match.home !== match.away)).toBe(true);
  });

  it("lets each team play one time in each round", () => {
    for (let round = 1; round <= 9; round++) {
      const playing = schedule
        .filter((match) => match.round === round)
        .flatMap((match) => [match.home, match.away]);
      expect(new Set(playing).size).toBe(10);
    }
  });

  it("gives each team 4 or 5 home matches", () => {
    for (const team of teams) {
      const homeMatches = schedule.filter((match) => match.home === team.id).length;
      expect([4, 5]).toContain(homeMatches);
    }
  });

  it("gives unique match IDs and the same schedule each time", () => {
    expect(new Set(schedule.map((match) => match.id)).size).toBe(45);
    expect(generateSchedule(teams)).toEqual(schedule);
  });

  it("refuses an odd number of teams", () => {
    expect(() => generateSchedule(teams.slice(0, 9))).toThrow();
  });
});

describe("getNextMatch", () => {
  const played = { home: 1, away: 0, goals: [] };

  it("gives the first match without a result", () => {
    expect(getNextMatch(schedule, {})).toBe(schedule[0]);

    const results: Results = { [schedule[0].id]: played, [schedule[2].id]: played };
    expect(getNextMatch(schedule, results)).toBe(schedule[1]);
  });

  it("gives null when all matches have a result", () => {
    const results: Results = Object.fromEntries(schedule.map((match) => [match.id, played]));
    expect(getNextMatch(schedule, results)).toBeNull();
  });
});
