import type { CSSProperties, ReactNode } from "react";
import styles from "./Stats.module.css";

export type BarItem = {
  key: string;
  label: ReactNode;
  value: number;
};

/** A list of bars with one colour. Each bar has its value at the tip. */
export default function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(0, ...items.map((item) => item.value));

  return (
    <ol className={styles.bars}>
      {items.map((item) => (
        <li key={item.key} className={styles.barRow}>
          <span className={styles.barLabel}>{item.label}</span>
          <span className={styles.barTrack}>
            <span
              className={styles.bar}
              style={{ "--share": max ? item.value / max : 0 } as CSSProperties}
              aria-hidden="true"
            />
            <span className={styles.barValue}>{item.value}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
