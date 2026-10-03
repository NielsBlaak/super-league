"use client";

import { columnVisibilityFeature, createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { useMemo } from "react";
import TeamBadge from "@/components/TeamBadge";
import { useResults } from "@/contexts/ResultsContext";
import { schedule } from "@/data/schedule";
import { teams } from "@/data/teams";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { computeStandings, type StandingRow } from "@/lib/standings";
import styles from "../table.module.css";

type StatKey = "played" | "won" | "drawn" | "lost" | "goalsFor" | "goalsAgainst" | "goalDifference" | "points";

const STATS: Record<StatKey, { short: string; long: string }> = {
  played: { short: "GS", long: "gespeeld" },
  won: { short: "W", long: "winst" },
  drawn: { short: "G", long: "gelijk" },
  lost: { short: "V", long: "verlies" },
  goalsFor: { short: "DV", long: "doelpunten voor" },
  goalsAgainst: { short: "DT", long: "doelpunten tegen" },
  goalDifference: { short: "DS", long: "doelsaldo" },
  points: { short: "Ptn", long: "punten" },
};

const statHeader = (key: StatKey) => {
  const StatHeader = () => <abbr title={STATS[key].long}>{STATS[key].short}</abbr>;
  return StatHeader;
};

const formatDifference = (value: number) => (value > 0 ? `+${value}` : value < 0 ? `−${-value}` : "0");

const features = tableFeatures({ columnVisibilityFeature });
const helper = createColumnHelper<typeof features, StandingRow>();

const columns = helper.columns([
  helper.accessor("rank", { header: () => <abbr title="positie">#</abbr> }),
  helper.accessor((row) => row.team.name, {
    id: "team",
    header: "Club",
    cell: ({ row }) => (
      <span className={styles.team}>
        <TeamBadge team={row.original.team} />
        {row.original.team.name}
      </span>
    ),
  }),
  helper.accessor("played", { header: statHeader("played") }),
  helper.accessor("won", { header: statHeader("won") }),
  helper.accessor("drawn", { header: statHeader("drawn") }),
  helper.accessor("lost", { header: statHeader("lost") }),
  helper.accessor("goalsFor", { header: statHeader("goalsFor") }),
  helper.accessor("goalsAgainst", { header: statHeader("goalsAgainst") }),
  helper.accessor("goalDifference", {
    header: statHeader("goalDifference"),
    cell: ({ getValue }) => formatDifference(getValue()),
  }),
  helper.accessor("points", { header: statHeader("points") }),
]);

// A phone shows the short table. Larger screens show all columns.
const PHONE_COLUMNS = { won: false, drawn: false, lost: false, goalsFor: false, goalsAgainst: false };
const ALL_COLUMNS = {};

const columnClass = (id: string) => {
  if (id === "rank") return styles.rank;
  if (id === "team") return styles.main;
  if (id === "points") return `${styles.num} ${styles.strong}`;
  return styles.num;
};

export default function StandingsTable() {
  const { results } = useResults();
  const isWide = useMediaQuery("(min-width: 600px)");
  const data = useMemo(() => computeStandings(teams, schedule, results), [results]);

  const table = useTable({
    features,
    columns,
    data,
    state: { columnVisibility: isWide ? ALL_COLUMNS : PHONE_COLUMNS },
  });

  const legend = table
    .getVisibleLeafColumns()
    .filter((column) => column.id in STATS)
    .map((column) => `${STATS[column.id as StatKey].short} = ${STATS[column.id as StatKey].long}`)
    .join(", ");

  return (
    <>
      <table className={styles.table}>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id} scope="col" className={columnClass(header.column.id)}>
                  <table.FlexRender header={header} />
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) =>
                cell.column.id === "team" ? (
                  <th key={cell.id} scope="row" className={columnClass(cell.column.id)}>
                    <table.FlexRender cell={cell} />
                  </th>
                ) : (
                  <td key={cell.id} className={columnClass(cell.column.id)}>
                    <table.FlexRender cell={cell} />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.legend}>{legend}</p>
    </>
  );
}
