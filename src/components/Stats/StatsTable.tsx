"use client";

import { tableFeatures, useTable, type RowData, type TableOptions } from "@tanstack/react-table";
import styles from "../table.module.css";

/** The tables on the statistics page have no extra table features. */
export const statsFeatures = tableFeatures({});

type StatsTableProps<TData extends RowData> = {
  columns: TableOptions<typeof statsFeatures, TData>["columns"];
  data: TData[];
  /** The ID of the column with the name of the row. It takes the free width. */
  mainColumn: string;
};

/** A plain table in the style of the standings table. */
export default function StatsTable<TData extends RowData>({ columns, data, mainColumn }: StatsTableProps<TData>) {
  const table = useTable({ features: statsFeatures, columns, data });
  const columnClass = (id: string) => (id === mainColumn ? styles.main : styles.num);

  return (
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
            {row.getAllCells().map((cell) =>
              cell.column.id === mainColumn ? (
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
