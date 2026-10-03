import type { Team } from "@/lib/types";

// The order of this list fixes the match schedule and the match IDs.
// Do not change the order after the first result is saved.
export const teams: Team[] = [
  { id: "ars", name: "Arsenal", shortName: "ARS", primary: "#EF0107", secondary: "#FFFFFF" },
  { id: "psg", name: "PSG", shortName: "PSG", primary: "#004170", secondary: "#DA291C" },
  { id: "bar", name: "FC Barcelona", shortName: "BAR", primary: "#A50044", secondary: "#004D98" },
  { id: "rma", name: "Real Madrid", shortName: "RMA", primary: "#FFFFFF", secondary: "#FEBE10" },
  { id: "mci", name: "Manchester City", shortName: "MCI", primary: "#6CABDD", secondary: "#1C2C5B" },
  { id: "bay", name: "Bayern München", shortName: "BAY", primary: "#DC052D", secondary: "#0066B2" },
  { id: "liv", name: "Liverpool", shortName: "LIV", primary: "#C8102E", secondary: "#00B2A9" },
  { id: "atm", name: "Atlético Madrid", shortName: "ATM", primary: "#CB3524", secondary: "#272E61" },
  { id: "mun", name: "Manchester United", shortName: "MUN", primary: "#DA291C", secondary: "#FBE122" },
  { id: "int", name: "Inter Milan", shortName: "INT", primary: "#010E80", secondary: "#000000" },
];

export const teamsById: Record<string, Team> = Object.fromEntries(
  teams.map((team) => [team.id, team]),
);
