import { teamStyle } from "@/lib/teamStyle";
import type { Team } from "@/lib/types";
import styles from "./TeamBadge.module.css";

/** A small scarf swatch in the two club colours. The site has no club logos. */
export default function TeamBadge({ team }: { team: Team }) {
  return <span className={styles.badge} style={teamStyle(team)} aria-hidden="true" />;
}
