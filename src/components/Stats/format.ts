import { teamsById } from "@/data/teams";
import type { Outcome, PlayedMatch, Streak, WinRecord } from "@/lib/stats";
import type { Team } from "@/lib/types";

/** "Inter Milan 2–1 Arsenal" */
export function matchText({ match, result }: PlayedMatch): string {
  return `${teamsById[match.home].name} ${result.home}–${result.away} ${teamsById[match.away].name}`;
}

/** One decimal with a Dutch comma: 2,2 */
export function decimal(value: number): string {
  return value.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Wins, draws and losses as "2-1-0". A dash for no matches. */
export function recordText(record: WinRecord): string {
  return record.played === 0 ? "–" : `${record.won}-${record.drawn}-${record.lost}`;
}

export const OUTCOME_NAMES: Record<Outcome, string> = { W: "winst", G: "gelijk", V: "verlies" };

/** "3× winst" */
export function streakText(streak: Streak | null): string {
  return streak ? `${streak.length}× ${OUTCOME_NAMES[streak.outcome]}` : "–";
}

/** The names of the clubs. A long list ends with the number of other clubs. */
export function teamNames(teams: Team[], limit = 3): string {
  const names = teams.slice(0, limit).map((team) => team.name);
  const rest = teams.length - names.length;
  if (rest === 0) return names.join(", ");
  return `${names.join(", ")} en ${rest} ${rest === 1 ? "andere club" : "andere clubs"}`;
}
