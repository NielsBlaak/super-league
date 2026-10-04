import type { CSSProperties } from "react";
import styles from "./Stats.module.css";

export type Segment = {
  label: string;
  value: number;
  /** A CSS colour, for example `var(--coach-n)`. */
  color: string;
};

/**
 * One bar that shows the parts of a total. The list below the bar gives each part
 * with its name and its number, so the colour is never the only cue.
 */
export default function SplitBar({ segments }: { segments: Segment[] }) {
  const visible = segments.filter((segment) => segment.value > 0);

  return (
    <div className={styles.split}>
      <div className={styles.splitBar} aria-hidden="true">
        {visible.map((segment) => (
          <span
            key={segment.label}
            className={styles.splitSegment}
            style={{ flexGrow: segment.value, background: segment.color }}
            title={`${segment.label}: ${segment.value}`}
          />
        ))}
      </div>
      <ul className={styles.splitLegend}>
        {segments.map((segment) => (
          <li key={segment.label} className={styles.splitItem}>
            <span className={styles.swatch} style={{ "--swatch": segment.color } as CSSProperties} aria-hidden="true" />
            {segment.label}
            <strong className={styles.splitValue}>{segment.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
