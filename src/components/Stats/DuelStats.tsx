"use client";

import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo } from "react";
import CoachChip from "@/components/CoachChip";
import TeamBadge from "@/components/TeamBadge";
import { coachNames } from "@/data/coaches";
import { COACH_IDS } from "@/lib/coaches";
import type { CoachStats, DuelStats as DuelData, WinRecord } from "@/lib/stats";
import type { CoachId, Team } from "@/lib/types";
import tableStyles from "../table.module.css";
import { decimal, matchText, OUTCOME_NAMES, recordText, streakText } from "./format";
import SplitBar from "./SplitBar";
import StatTile, { StatTiles } from "./StatTile";
import styles from "./Stats.module.css";
import StatsTable, { statsFeatures } from "./StatsTable";

// The name is the text. The letter next to it is decoration here.
const coachHeader = (coach: CoachId, suffix = "") => {
  const CoachHeader = () => (
    <span className={styles.coachHead}>
      <span aria-hidden="true">
        <CoachChip coach={coach} size="sm" />
      </span>
      {coachNames[coach]}
      {suffix}
    </span>
  );
  return CoachHeader;
};

type CompareRow = { label: string; N: string; T: string };
const compareHelper = createColumnHelper<typeof statsFeatures, CompareRow>();
const compareColumns = compareHelper.columns([
  compareHelper.accessor("label", { header: () => <span className="visuallyHidden">Statistiek</span> }),
  compareHelper.accessor("N", { header: coachHeader("N") }),
  compareHelper.accessor("T", { header: coachHeader("T") }),
]);

type TeamRow = { team: Team; records: Record<CoachId, WinRecord> };
const teamHelper = createColumnHelper<typeof statsFeatures, TeamRow>();
const teamColumns = teamHelper.columns([
  teamHelper.accessor((row) => row.team.name, {
    id: "team",
    header: "Club",
    cell: ({ row }) => (
      <span className={tableStyles.team}>
        <TeamBadge team={row.original.team} />
        {row.original.team.name}
      </span>
    ),
  }),
  teamHelper.accessor((row) => recordText(row.records.N), { id: "N", header: coachHeader("N") }),
  teamHelper.accessor((row) => recordText(row.records.T), { id: "T", header: coachHeader("T") }),
]);

function compareRows(niels: CoachStats, tim: CoachStats): CompareRow[] {
  const row = (label: string, value: (stats: CoachStats) => string | number): CompareRow => ({
    label,
    N: String(value(niels)),
    T: String(value(tim)),
  });

  return [
    row("Gespeeld", (stats) => stats.played),
    row("Winst", (stats) => stats.won),
    row("Gelijk", (stats) => stats.drawn),
    row("Verlies", (stats) => stats.lost),
    row("Doelpunten voor", (stats) => stats.goalsFor),
    row("Doelpunten tegen", (stats) => stats.goalsAgainst),
    row("Doelpunten per wedstrijd", (stats) => (stats.played ? decimal(stats.goalsFor / stats.played) : "–")),
    row("De nul gehouden", (stats) => stats.cleanSheets),
    row("Thuis gespeeld", (stats) => stats.home.played),
    row("Thuis (W-G-V)", (stats) => recordText(stats.home)),
    row("Uit (W-G-V)", (stats) => recordText(stats.away)),
    row("Huidige reeks", (stats) => streakText(stats.currentStreak)),
    row("Langste zegereeks", (stats) => stats.longestWinStreak),
    row("Langste reeks ongeslagen", (stats) => stats.longestUnbeaten),
  ];
}

/** The name and the points of one person. Niels is at the left and Tim is at the right. */
function DuelSide({ coach, points }: { coach: CoachId; points: number }) {
  return (
    <div className={styles.duelSide} data-coach={coach}>
      <span className={styles.duelName}>
        <span aria-hidden="true">
          <CoachChip coach={coach} />
        </span>
        {coachNames[coach]}
      </span>
      <span className={styles.duelPoints}>{points}</span>
    </div>
  );
}

export default function DuelStats({ duel }: { duel: DuelData }) {
  const { N: niels, T: tim } = duel.coaches;
  const rows = useMemo(() => compareRows(niels, tim), [niels, tim]);

  const missingNote = duel.missing > 0 && (
    <p className={styles.note}>
      {duel.missing === 1 ? "1 wedstrijd telt niet mee" : `${duel.missing} wedstrijden tellen niet mee`}. Daar is niet
      ingevuld wie er speelde. <Link href="/speelschema">Vul dit aan in het speelschema</Link>.
    </p>
  );

  if (duel.counted === 0) {
    return (
      <div className={styles.group}>
        <p className={styles.note}>
          Er zijn nog geen wedstrijden waarvan bekend is wie er speelde. Kies bij een uitslag wie thuis speelt.
        </p>
        {missingNote}
      </div>
    );
  }

  return (
    <div className={styles.group}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Onderlinge stand</h2>
        <div className={styles.duelHead}>
          <DuelSide coach="N" points={niels.points} />
          <span className={styles.duelUnit}>punten</span>
          <DuelSide coach="T" points={tim.points} />
        </div>
        <SplitBar
          segments={[
            { label: `${coachNames.N} wint`, value: niels.won, color: "var(--coach-n)" },
            { label: "Gelijk", value: niels.drawn, color: "var(--chart-neutral)" },
            { label: `${coachNames.T} wint`, value: tim.won, color: "var(--coach-t)" },
          ]}
        />
        {missingNote}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Vorm</h2>
        <p className={styles.note}>De laatste 5 wedstrijden. De nieuwste staat rechts.</p>
        <div className={styles.form}>
          {COACH_IDS.map((coach) => (
            <div key={coach} className={styles.formRow}>
              <span className={styles.formName}>{coachNames[coach]}</span>
              <ol className={styles.formList}>
                {duel.coaches[coach].form.map((outcome, index) => (
                  <li key={index} className={styles.formItem} data-outcome={outcome} title={OUTCOME_NAMES[outcome]}>
                    <span aria-hidden="true">{outcome}</span>
                    <span className="visuallyHidden">{OUTCOME_NAMES[outcome]}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cijfers</h2>
        <StatsTable columns={compareColumns} data={rows} mainColumn="label" />
        <p className={tableStyles.legend}>W-G-V = winst, gelijk, verlies</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Grootste zege</h2>
        <StatTiles>
          {COACH_IDS.map((coach) => {
            const win = duel.coaches[coach].biggestWin;
            return (
              <StatTile
                key={coach}
                kind="text"
                label={coachNames[coach]}
                value={win ? matchText(win) : "Nog geen zege"}
                note={win && `Speelronde ${win.match.round}`}
              />
            );
          })}
        </StatTiles>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Resultaat per club</h2>
        <StatsTable columns={teamColumns} data={duel.byTeam} mainColumn="team" />
        <p className={tableStyles.legend}>De cijfers zijn winst, gelijk en verlies met die club.</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Topscorers per persoon</h2>
        <div className={styles.scorerColumns}>
          {COACH_IDS.map((coach) => (
            <div key={coach}>
              <h3 className={styles.scorerTitle}>
                <span aria-hidden="true">
                  <CoachChip coach={coach} size="sm" />
                </span>
                {coachNames[coach]}
              </h3>
              {duel.coaches[coach].topScorers.length === 0 ? (
                <p className={styles.note}>Nog geen doelpunten.</p>
              ) : (
                <ol className={styles.scorerList}>
                  {duel.coaches[coach].topScorers.map((scorer) => (
                    <li key={`${scorer.team.id}:${scorer.player.id}`} className={styles.scorerRow}>
                      <span className={styles.scorerWho}>
                        <TeamBadge team={scorer.team} size="xs" />
                        <span>
                          {scorer.player.name} <span className={styles.scorerClub}>{scorer.team.name}</span>
                        </span>
                      </span>
                      <span className={styles.scorerGoals}>{scorer.goals}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
