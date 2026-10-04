"use client";

import { useState } from "react";
import CoachChip from "@/components/CoachChip";
import ResultDialog from "@/components/ResultDialog";
import TeamBadge from "@/components/TeamBadge";
import { useResults } from "@/contexts/ResultsContext";
import { roundCount, schedule } from "@/data/schedule";
import { teamsById } from "@/data/teams";
import { otherCoach } from "@/lib/coaches";
import { getNextMatch } from "@/lib/schedule";
import type { Match } from "@/lib/types";
import styles from "./ScheduleList.module.css";

const ROUNDS = Array.from({ length: roundCount }, (_, index) =>
  schedule.filter((match) => match.round === index + 1),
);

export default function ScheduleList() {
  const { results } = useResults();
  const [open, setOpen] = useState<Match | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const next = getNextMatch(schedule, results);

  return (
    <>
      {/* The new score in the row is the visible feedback. */}
      <p className="visuallyHidden" role="status">
        {message}
      </p>

      <div className={styles.rounds}>
        {ROUNDS.map((matches, index) => (
          <section key={index}>
            <h2 className={styles.roundTitle}>Speelronde {index + 1}</h2>
            <ul>
              {matches.map((match) => {
                const result = results[match.id];
                const home = teamsById[match.home];
                const away = teamsById[match.away];
                const isNext = match.id === next?.id;

                return (
                  <li key={match.id}>
                    <button
                      type="button"
                      className={styles.match}
                      data-state={result ? "played" : isNext ? "next" : "open"}
                      onClick={() => setOpen(match)}
                    >
                      <span className={styles.home}>
                        {home.name}
                        <TeamBadge team={home} />
                      </span>
                      <span className={styles.score}>
                        <span className={styles.scoreLine}>
                          {result ? `${result.home}–${result.away}` : "–"}
                        </span>
                        {!result && (
                          <span className="visuallyHidden">
                            {isNext ? " eerstvolgende wedstrijd " : " nog geen uitslag "}
                          </span>
                        )}
                        {/* Who played: the letter of each person is below the goals of that team. */}
                        {result?.homeCoach && (
                          <span className={styles.coaches}>
                            <CoachChip coach={result.homeCoach} size="sm" />
                            <CoachChip coach={otherCoach(result.homeCoach)} size="sm" />
                          </span>
                        )}
                      </span>
                      <span className={styles.away}>
                        <TeamBadge team={away} />
                        {away.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <ResultDialog match={open} onClose={() => setOpen(null)} onSaved={setMessage} />
    </>
  );
}
