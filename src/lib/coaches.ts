import type { CoachId, Result } from "./types";

export const COACH_IDS: CoachId[] = ["N", "T"];

export function otherCoach(coach: CoachId): CoachId {
  return coach === "N" ? "T" : "N";
}

export function isCoachId(value: unknown): value is CoachId {
  return value === "N" || value === "T";
}

/** Gives who played with the home team or the away team, or null for an old result. */
export function coachOf(result: Result, side: "home" | "away"): CoachId | null {
  if (!result.homeCoach) return null;
  return side === "home" ? result.homeCoach : otherCoach(result.homeCoach);
}
