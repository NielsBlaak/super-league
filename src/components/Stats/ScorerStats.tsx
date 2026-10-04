import TeamBadge from "@/components/TeamBadge";
import type { MatchHaul, ScorerStats as ScorerData } from "@/lib/stats";
import BarList from "./BarList";
import { matchText } from "./format";
import StatTile, { StatTiles } from "./StatTile";
import styles from "./Stats.module.css";

const haulKey = (haul: MatchHaul) => `${haul.played.match.id}:${haul.team.id}:${haul.player.id}`;

export default function ScorerStats({ scorers }: { scorers: ScorerData }) {
  const best = scorers.bestHauls[0];
  // One goal in a match is not a record. The tile needs 2 goals or more.
  const hasRecord = best !== undefined && best.goals >= 2;

  return (
    <div className={styles.group}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Hattricks</h2>
        {scorers.hatTricks.length === 0 ? (
          <p className={styles.note}>Er is nog geen hattrick. Een hattrick is 3 of meer doelpunten in een wedstrijd.</p>
        ) : (
          <ul className={styles.plainList}>
            {scorers.hatTricks.map((haul) => (
              <li key={haulKey(haul)}>
                <strong>{haul.player.name}</strong> ({haul.team.name}): {haul.goals} doelpunten in{" "}
                {matchText(haul.played)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Meeste doelpunten in een wedstrijd</h2>
        {hasRecord ? (
          <StatTiles>
            <StatTile
              label="Doelpunten van een speler"
              value={best.goals}
              note={scorers.bestHauls.map((haul) => `${haul.player.name} (${haul.team.name})`).join(", ")}
            />
          </StatTiles>
        ) : (
          <p className={styles.note}>Er is nog geen speler met 2 of meer doelpunten in een wedstrijd.</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Doelpunten per linie</h2>
        <BarList items={scorers.byLine.map((line) => ({ key: line.label, label: line.label, value: line.goals }))} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Doelpuntenmakers per club</h2>
        <p className={styles.note}>Het aantal verschillende spelers met een doelpunt.</p>
        <BarList
          items={scorers.scorersPerTeam.map((entry) => ({
            key: entry.team.id,
            label: (
              <>
                <TeamBadge team={entry.team} size="xs" />
                {entry.team.name}
              </>
            ),
            value: entry.scorers,
          }))}
        />
      </section>
    </div>
  );
}
