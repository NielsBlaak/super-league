export type Team = {
  id: string;
  name: string;
  shortName: string;
  primary: string;
  secondary: string;
};

export type Position =
  | "GK"
  | "CV"
  | "LA"
  | "RA"
  | "CVM"
  | "CM"
  | "CAM"
  | "LM"
  | "RM"
  | "LVA"
  | "RVA"
  | "SP";

export type Player = {
  id: number;
  name: string;
  number: number;
  position: Position;
};

export type Match = {
  id: string;
  round: number;
  home: string;
  away: string;
};

/** `team` is the team that gets the goal. An own goal has no player. */
export type Goal = {
  team: string;
  playerId?: number;
  ownGoal?: true;
};

/** The two people who play the league: Niels (N) and Tim (T). */
export type CoachId = "N" | "T";

export type Result = {
  home: number;
  away: number;
  goals: Goal[];
  /** Who played with the home team. The other person played with the away team. Old results do not have it. */
  homeCoach?: CoachId;
};

export type Results = Record<string, Result>;

export type ResultsFile = {
  version: 1;
  results: Results;
};
