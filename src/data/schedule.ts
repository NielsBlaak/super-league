import { generateSchedule } from "@/lib/schedule";
import { teams } from "./teams";

export const schedule = generateSchedule(teams);

export const roundCount = teams.length - 1;
