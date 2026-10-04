import { coachNames } from "@/data/coaches";
import type { CoachId } from "@/lib/types";
import styles from "./CoachChip.module.css";

type CoachChipProps = {
  coach: CoachId;
  size?: "sm" | "md";
};

/** The letter N or T. A screen reader reads the full name. */
export default function CoachChip({ coach, size = "md" }: CoachChipProps) {
  return (
    <span className={`${styles.chip} ${styles[size]}`} data-coach={coach} title={coachNames[coach]}>
      <span aria-hidden="true">{coach}</span>
      <span className="visuallyHidden">{coachNames[coach]}</span>
    </span>
  );
}
