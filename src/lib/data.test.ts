import { describe, expect, it } from "vitest";
import { logos } from "@/data/logos";
import { squads } from "@/data/squads";
import { teams } from "@/data/teams";
import { INK, readableTextColor } from "./contrast";
import { groupByLine } from "./positions";
import { parseResultsFile, serializeResults } from "./store/resultsFile";

describe("teams and squads", () => {
  it("has 10 teams with a squad", () => {
    expect(teams).toHaveLength(10);
    expect(Object.keys(squads).sort()).toEqual(teams.map((team) => team.id).sort());
  });

  it("has the squad sizes of the source", () => {
    const sizes = Object.fromEntries(teams.map((team) => [team.id, squads[team.id].length]));
    expect(sizes).toEqual({
      ars: 23,
      psg: 25,
      bar: 27,
      rma: 32,
      mci: 26,
      bay: 25,
      liv: 29,
      atm: 25,
      mun: 30,
      int: 24,
    });
  });

  it("has unique player IDs and shirt numbers in each squad", () => {
    for (const team of teams) {
      const squad = squads[team.id];
      expect(new Set(squad.map((player) => player.id)).size).toBe(squad.length);
      expect(new Set(squad.map((player) => player.number)).size).toBe(squad.length);
    }
  });

  it("puts each player in one line", () => {
    for (const team of teams) {
      const grouped = groupByLine(squads[team.id]).flatMap((line) => line.players);
      expect(grouped).toHaveLength(squads[team.id].length);
    }
  });

  it("has a logo for each team", () => {
    expect(Object.keys(logos).sort()).toEqual(teams.map((team) => team.id).sort());
    for (const team of teams) expect(logos[team.id]).toBeTruthy();
  });

  it("has valid colour codes", () => {
    for (const team of teams) {
      expect(team.primary).toMatch(/^#[0-9A-F]{6}$/);
      expect(team.secondary).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});

describe("readableTextColor", () => {
  it("gives white on a dark colour", () => {
    expect(readableTextColor("#EF0107")).toBe("#ffffff");
    expect(readableTextColor("#010E80")).toBe("#ffffff");
  });

  it("gives ink on a light colour", () => {
    expect(readableTextColor("#FFFFFF")).toBe(INK);
    expect(readableTextColor("#FBE122")).toBe(INK);
    expect(readableTextColor("#6CABDD")).toBe(INK);
  });
});

describe("results file", () => {
  const results = {
    "int-ars": { home: 2, away: 1, goals: [{ team: "int", playerId: 231478 }] },
  };

  it("reads back what it writes", () => {
    expect(parseResultsFile(serializeResults(results))).toEqual(results);
  });

  it("refuses text that is not a results file", () => {
    expect(() => parseResultsFile("not json")).toThrow();
    expect(() => parseResultsFile("[]")).toThrow();
  });

  it("drops an entry that is not a result", () => {
    const text = JSON.stringify({ version: 1, results: { ...results, "psg-bar": { home: "2" } } });
    expect(parseResultsFile(text)).toEqual(results);
  });
});
