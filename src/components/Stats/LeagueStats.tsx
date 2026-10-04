import type { LeagueStats as LeagueData } from "@/lib/stats";
import BarList from "./BarList";
import { decimal, matchText } from "./format";
import SplitBar from "./SplitBar";
import StatTile, { StatTiles } from "./StatTile";
import styles from "./Stats.module.css";

export default function LeagueStats({ league }: { league: LeagueData }) {
  return (
    <div className={styles.group}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Voortgang en doelpunten</h2>
        <StatTiles>
          <StatTile label="Gespeeld" value={league.played} note={`van ${league.total} wedstrijden`} />
          <StatTile label="Doelpunten" value={league.goals} />
          <StatTile label="Doelpunten per wedstrijd" value={decimal(league.goalsPerMatch)} />
        </StatTiles>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Uitslagen</h2>
        <SplitBar
          segments={[
            { label: "Thuiswinst", value: league.homeWins, color: "var(--chart-ramp-1)" },
            { label: "Gelijk", value: league.draws, color: "var(--chart-ramp-2)" },
            { label: "Uitwinst", value: league.awayWins, color: "var(--chart-ramp-3)" },
          ]}
        />
        <StatTiles>
          <StatTile
            kind="text"
            label="Grootste zege"
            value={league.biggestWin ? matchText(league.biggestWin) : "Nog geen zege"}
            note={league.biggestWin && `Speelronde ${league.biggestWin.match.round}`}
          />
          <StatTile
            kind="text"
            label="Meeste doelpunten in een wedstrijd"
            value={league.highestScoring ? matchText(league.highestScoring) : "–"}
            note={league.highestScoring && `Speelronde ${league.highestScoring.match.round}`}
          />
        </StatTiles>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Meest voorkomende uitslag</h2>
        <p className={styles.note}>De uitslag is thuis–uit. Het getal is het aantal wedstrijden.</p>
        <BarList
          items={league.commonScores.map((entry) => ({ key: entry.score, label: entry.score, value: entry.count }))}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Doelpunten per speelronde</h2>
        <BarList
          items={league.goalsPerRound.map((entry) => ({
            key: String(entry.round),
            label: `Speelronde ${entry.round}`,
            value: entry.goals,
          }))}
        />
      </section>
    </div>
  );
}
