"use client";

import { columnVisibilityFeature, createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { useMemo } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import TeamBadge from "@/components/TeamBadge";
import { useResults } from "@/contexts/ResultsContext";
import { schedule } from "@/data/schedule";
import { teams } from "@/data/teams";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { computeStandings, type Side, type StandingRow } from "@/lib/standings";
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
    // CSS shows the full name or the short name. The view with all columns on a phone uses the short name.
    cell: ({ row }) => (
      <span className={styles.team}>
        <TeamBadge team={row.original.team} className={styles.teamLogo} />
        <span className={styles.teamFull}>{row.original.team.name}</span>
        <abbr className={styles.teamShort} title={row.original.team.name}>
          {row.original.team.shortName}
        </abbr>
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

// The short view on a phone. The view "Alles" and larger screens show all columns.
const SHORT_COLUMNS = { won: false, drawn: false, lost: false, goalsFor: false, goalsAgainst: false };
const ALL_COLUMNS = {};

type View = "short" | "all";

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: "short", label: "Kort" },
  { value: "all", label: "Alles" },
];

const columnClass = (id: string) => {
  if (id === "rank") return styles.rank;
  if (id === "team") return styles.main;
  if (id === "points") return `${styles.num} ${styles.strong}`;
  return styles.num;
};

type StandingsTableProps = {
  /** Counts only the home matches or only the away matches. */
  side?: Side;
};

export default function StandingsTable({ side }: StandingsTableProps) {
  const { results } = useResults();
  const isWide = useMediaQuery("(min-width: 600px)");
  const [view, setView] = useLocalStorage<View>("super-league:standings-view", "short");
  const data = useMemo(() => computeStandings(teams, schedule, results, side), [results, side]);

  // The phone view with all columns uses narrow cells and the short club name.
  const phoneView = isWide ? undefined : view;

  const table = useTable({
    features,
    columns,
    data,
    state: { columnVisibility: phoneView === "short" ? SHORT_COLUMNS : ALL_COLUMNS },
  });

  const legend = table
    .getVisibleLeafColumns()
    .filter((column) => column.id in STATS)
    .map((column) => `${STATS[column.id as StatKey].short} = ${STATS[column.id as StatKey].long}`)
    .join(", ");

  return (
    <>
      <SegmentedControl
        className={styles.viewSwitch}
        label="Kolommen in de stand"
        hideLabel
        options={VIEW_OPTIONS}
        value={view}
        onChange={setView}
      />
      <table className={styles.table} data-view={phoneView}>
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
