import type { CSSProperties } from "react";
import { readableTextColor } from "./contrast";
import type { Team } from "./types";

/** Gives the club colours to a component as CSS custom properties. */
export function teamStyle(team: Team): CSSProperties {
  return {
    "--team-primary": team.primary,
    "--team-secondary": team.secondary,
    "--team-text": readableTextColor(team.primary),
  } as CSSProperties;
}
