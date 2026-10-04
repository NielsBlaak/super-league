"use client";

import { useMemo, useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { useResults } from "@/contexts/ResultsContext";
import { coachNames } from "@/data/coaches";
import { schedule } from "@/data/schedule";
import { squads } from "@/data/squads";
import { teams } from "@/data/teams";
import { computeClubRows, computeDuelStats, computeLeagueStats, computeScorerStats } from "@/lib/stats";
import ClubStats from "./ClubStats";
import DuelStats from "./DuelStats";
import LeagueStats from "./LeagueStats";
import ScorerStats from "./ScorerStats";
import styles from "./Stats.module.css";

type Group = "duel" | "league" | "clubs" | "scorers";

// The page shows one group at a time. This keeps the page short on a phone.
const GROUPS: { value: Group; label: string }[] = [
  { value: "duel", label: `${coachNames.N}–${coachNames.T}` },
  { value: "league", label: "Competitie" },
  { value: "clubs", label: "Clubs" },
  { value: "scorers", label: "Doelpunten" },
];

export default function Stats() {
  const { results } = useResults();
  const [group, setGroup] = useState<Group>("duel");

  const stats = useMemo(
    () => ({
      duel: computeDuelStats(teams, squads, schedule, results),
      league: computeLeagueStats(schedule, results),
      clubs: computeClubRows(teams, schedule, results),
      scorers: computeScorerStats(teams, squads, schedule, results),
    }),
    [results],
  );

  if (stats.league.played === 0) {
    return (
      <p className={styles.note}>
        Er zijn nog geen uitslagen. De statistieken verschijnen na de eerste wedstrijd.
      </p>
    );
  }

  return (
    <>
      <SegmentedControl
        className={styles.groups}
        label="Groep statistieken"
        hideLabel
        options={GROUPS}
        value={group}
        onChange={setGroup}
      />
      {group === "duel" && <DuelStats duel={stats.duel} />}
      {group === "league" && <LeagueStats league={stats.league} />}
      {group === "clubs" && <ClubStats clubs={stats.clubs} />}
      {group === "scorers" && <ScorerStats scorers={stats.scorers} />}
    </>
  );
}
