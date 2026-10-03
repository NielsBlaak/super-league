"use client";

import { useState } from "react";
import ResultDialog from "@/components/ResultDialog";
import { useResults } from "@/contexts/ResultsContext";
import { roundCount, schedule } from "@/data/schedule";
import { teams, teamsById } from "@/data/teams";
import { getNextMatch } from "@/lib/schedule";
import { computeStandings } from "@/lib/standings";
import { teamStyle } from "@/lib/teamStyle";
import type { Match, Team } from "@/lib/types";
import styles from "./NextMatchCard.module.css";

/** A scarf in the colours of one club or, for a match, of two clubs. */
function Scarf({ clubs }: { clubs: Team[] }) {
  return (
    <span className={styles.scarf} data-clubs={clubs.length}>
      {clubs.map((club) => (
        <span key={club.id} className={styles.half} style={teamStyle(club)}>
          <span className={styles.name}>{club.name}</span>
        </span>
      ))}
    </span>
  );
}

export default function NextMatchCard() {
  const { results } = useResults();
  const [open, setOpen] = useState<Match | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const next = getNextMatch(schedule, results);
  const played = schedule.filter((match) => results[match.id]).length;

  if (!next) {
    const champion = computeStandings(teams, schedule, results)[0].team;
    return (
      <section className={styles.section}>
        <h1>De competitie is afgelopen</h1>
        <Scarf clubs={[champion]} />
        <p>
          {champion.name} is kampioen. Alle {schedule.length} wedstrijden hebben een uitslag.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h1>Eerstvolgende wedstrijd</h1>
      <button type="button" className={styles.card} onClick={() => setOpen(next)}>
        {/* The key starts the animation again for a new match. */}
        <Scarf key={next.id} clubs={[teamsById[next.home], teamsById[next.away]]} />
        <span className={styles.meta}>
          <span className={styles.round}>
            Speelronde {next.round} van {roundCount}, wedstrijd {played + 1} van {schedule.length}
          </span>
          <span className={styles.cta}>Uitslag invoeren</span>
        </span>
      </button>
      <p className={styles.message} role="status">
        {message}
      </p>
      <ResultDialog match={open} onClose={() => setOpen(null)} onSaved={setMessage} />
    </section>
  );
}
