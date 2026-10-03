"use client";

import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { useMemo } from "react";
import TeamBadge from "@/components/TeamBadge";
import { useResults } from "@/contexts/ResultsContext";
import { schedule } from "@/data/schedule";
import { squads } from "@/data/squads";
import { teams } from "@/data/teams";
import { computeTopScorers, type ScorerRow } from "@/lib/topScorers";
import tableStyles from "../table.module.css";
import styles from "./TopScorersTable.module.css";

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, ScorerRow>();

const columns = helper.columns([
  helper.accessor("rank", { header: () => <abbr title="positie">#</abbr> }),
  helper.accessor((row) => row.player.name, {
    id: "player",
    header: "Speler",
    cell: ({ row }) => (
      <span className={styles.scorer}>
        <span className={styles.player}>{row.original.player.name}</span>
        <span className={styles.club}>
          <TeamBadge team={row.original.team} />
          {row.original.team.name}
        </span>
      </span>
    ),
  }),
  helper.accessor("goals", { header: "Doelpunten" }),
]);

const columnClass = (id: string) => {
  if (id === "rank") return tableStyles.rank;
  if (id === "player") return tableStyles.main;
  return `${tableStyles.num} ${tableStyles.strong}`;
};

export default function TopScorersTable() {
  const { results } = useResults();
  const data = useMemo(() => computeTopScorers(teams, squads, schedule, results), [results]);
  const table = useTable({ features, columns, data });

  if (data.length === 0) {
    return <p className={tableStyles.empty}>Er zijn nog geen doelpunten. Voer een uitslag in om de lijst te vullen.</p>;
  }

  return (
    <table className={tableStyles.table}>
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
            {row.getAllCells().map((cell) =>
              cell.column.id === "player" ? (
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
  );
}
