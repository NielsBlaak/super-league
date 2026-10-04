"use client";

import { useState } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import StandingsTable from "@/components/StandingsTable";
import type { Side } from "@/lib/standings";
import { leaders, type ClubRow } from "@/lib/stats";
import { teamNames } from "./format";
import StatTile, { StatTiles } from "./StatTile";
import styles from "./Stats.module.css";

const SIDE_OPTIONS: { value: Side; label: string }[] = [
  { value: "home", label: "Thuis" },
  { value: "away", label: "Uit" },
];

type Leader = {
  label: string;
  value: (row: ClubRow) => number;
  best: "max" | "min";
  unit: (value: number) => string;
};

const LEADERS: Leader[] = [
  { label: "Beste aanval", value: (row) => row.goalsFor, best: "max", unit: (n) => `${n} doelpunten voor` },
  { label: "Beste verdediging", value: (row) => row.goalsAgainst, best: "min", unit: (n) => `${n} doelpunten tegen` },
  { label: "Vaakst de nul gehouden", value: (row) => row.cleanSheets, best: "max", unit: (n) => `${n} keer` },
  { label: "Langste zegereeks", value: (row) => row.longestWinStreak, best: "max", unit: (n) => `${n} op rij` },
  {
    label: "Langste reeks ongeslagen",
    value: (row) => row.longestUnbeaten,
    best: "max",
    unit: (n) => `${n} op rij`,
  },
];

export default function ClubStats({ clubs }: { clubs: ClubRow[] }) {
  const [side, setSide] = useState<Side>("home");
  // A club without a match has no goals against. It is not the best defence.
  const active = clubs.filter((row) => row.played > 0);

  return (
    <div className={styles.group}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Beste clubs</h2>
        <StatTiles>
          {LEADERS.map(({ label, value, best, unit }) => {
            const leader = leaders(active, value, best);
            return (
              <StatTile
                key={label}
                kind="text"
                label={label}
                value={leader ? teamNames(leader.rows.map((row) => row.team)) : "–"}
                note={leader && unit(leader.value)}
              />
            );
          })}
        </StatTiles>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Thuisstand en uitstand</h2>
        <SegmentedControl
          label="Thuisstand of uitstand"
          hideLabel
          options={SIDE_OPTIONS}
          value={side}
          onChange={setSide}
        />
        <StandingsTable side={side} />
      </section>
    </div>
  );
}
