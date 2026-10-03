import type { Player, Position } from "./types";

// The position codes are the Dutch codes of sofifa.com.
const LINES: { label: string; positions: Position[] }[] = [
  { label: "Aanval", positions: ["SP", "LVA", "RVA"] },
  { label: "Middenveld", positions: ["CAM", "CM", "CVM", "LM", "RM"] },
  { label: "Verdediging", positions: ["CV", "LA", "RA"] },
  { label: "Keeper", positions: ["GK"] },
];

/** Groups a squad by line, attack first. Players in a line are in shirt number order. */
export function groupByLine(players: Player[]): { label: string; players: Player[] }[] {
  return LINES.map(({ label, positions }) => ({
    label,
    players: players
      .filter((player) => positions.includes(player.position))
      .sort((a, b) => a.number - b.number),
  })).filter((line) => line.players.length > 0);
}
