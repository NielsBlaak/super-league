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

export type Result = {
  home: number;
  away: number;
  goals: Goal[];
};

export type Results = Record<string, Result>;

export type ResultsFile = {
  version: 1;
  results: Results;
};
