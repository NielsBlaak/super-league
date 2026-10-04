import type { ReactNode } from "react";
import styles from "./Stats.module.css";

type StatTileProps = {
  label: string;
  value: ReactNode;
  /** A short line below the value, for example the unit or the club. */
  note?: ReactNode;
  /** "text": the value is a name or a match and not a number. */
  kind?: "number" | "text";
};

/** One number with its label. Put the tiles in a `StatTiles` list. */
export default function StatTile({ label, value, note, kind = "number" }: StatTileProps) {
  return (
    <div className={styles.tile}>
      <dt className={styles.tileLabel}>{label}</dt>
      <dd className={kind === "number" ? styles.tileValue : styles.tileText}>{value}</dd>
      {note && <dd className={styles.tileNote}>{note}</dd>}
    </div>
  );
}

export function StatTiles({ children }: { children: ReactNode }) {
  return <dl className={styles.tiles}>{children}</dl>;
}
