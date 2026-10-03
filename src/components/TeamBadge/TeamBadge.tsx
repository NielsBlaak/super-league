import Image from "next/image";
import { logos } from "@/data/logos";
import type { Team } from "@/lib/types";
import styles from "./TeamBadge.module.css";

type TeamBadgeProps = {
  team: Team;
  size?: "xs" | "sm" | "md" | "lg";
  /** A white disc behind the logo. Use it on a club colour, where a dark logo can disappear. */
  plate?: boolean;
};

/** The club logo. It is decoration: the club name is always next to it. */
export default function TeamBadge({ team, size = "sm", plate = false }: TeamBadgeProps) {
  const classes = [styles.badge, styles[size], plate && styles.plate].filter(Boolean).join(" ");

  return (
    <span className={classes} aria-hidden="true">
      {/* The size comes from CSS. The logos have different proportions, so object-fit keeps them whole. */}
      <Image src={logos[team.id]} alt="" width={96} height={96} className={styles.logo} />
    </span>
  );
}
