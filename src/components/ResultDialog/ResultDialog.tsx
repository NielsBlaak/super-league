"use client";

import { useId, useState, type FormEvent } from "react";
import Button from "@/components/Button";
import CoachChip from "@/components/CoachChip";
import Dialog, { DialogBody, DialogFooter, DialogForm } from "@/components/Dialog";
import SegmentedControl from "@/components/SegmentedControl";
import TeamBadge from "@/components/TeamBadge";
import { TokenForm } from "@/components/TokenDialog";
import { errorMessage, useResults } from "@/contexts/ResultsContext";
import { coachNames } from "@/data/coaches";
import { roundCount } from "@/data/schedule";
import { squads } from "@/data/squads";
import { teamsById } from "@/data/teams";
import { COACH_IDS, coachOf, otherCoach } from "@/lib/coaches";
import { groupByLine } from "@/lib/positions";
import { teamStyle } from "@/lib/teamStyle";
import type { CoachId, Goal, Match, Result, Team } from "@/lib/types";
import styles from "./ResultDialog.module.css";

const COACH_OPTIONS = COACH_IDS.map((coach) => ({ value: coach, label: coachNames[coach] }));

const OWN_GOAL = "own";
const MAX_GOALS = 20;

type ResultDialogProps = {
  match: Match | null;
  onClose: () => void;
  /** Gets a message for the user after a save or a delete. */
  onSaved?: (message: string) => void;
};

export default function ResultDialog({ match, onClose, onSaved }: ResultDialogProps) {
  const { results, canEdit } = useResults();
  const hasResult = match !== null && results[match.id] !== undefined;
  const title = !canEdit ? "Wedstrijd" : hasResult ? "Uitslag wijzigen" : "Uitslag invoeren";

  return (
    <Dialog open={match !== null} onClose={onClose} title={title}>
      {match &&
        (canEdit ? (
          <ResultForm key={match.id} match={match} onClose={onClose} onSaved={onSaved} />
        ) : (
          <ReadOnlyResult match={match} />
        ))}
    </Dialog>
  );
}

// One slot for each goal. The value is "", a player ID or OWN_GOAL.
function initialSlots(result: Result | undefined, teamId: string, count: number): string[] {
  const makers = (result?.goals ?? [])
    .filter((goal) => goal.team === teamId)
    .map((goal) => (goal.ownGoal ? OWN_GOAL : String(goal.playerId ?? "")));
  return Array.from({ length: count }, (_, index) => makers[index] ?? "");
}

function toGoals(teamId: string, slots: string[]): Goal[] {
  return slots.map((slot) =>
    slot === OWN_GOAL ? { team: teamId, ownGoal: true } : { team: teamId, playerId: Number(slot) },
  );
}

type ResultFormProps = {
  match: Match;
  onClose: () => void;
  onSaved?: (message: string) => void;
};

function ResultForm({ match, onClose, onSaved }: ResultFormProps) {
  const { results, saveResult, deleteResult } = useResults();
  const existing = results[match.id];
  const home = teamsById[match.home];
  const away = teamsById[match.away];

  const [homeSlots, setHomeSlots] = useState(() => initialSlots(existing, home.id, existing?.home ?? 0));
  const [awaySlots, setAwaySlots] = useState(() => initialSlots(existing, away.id, existing?.away ?? 0));
  const [homeCoach, setHomeCoach] = useState<CoachId | null>(existing?.homeCoach ?? null);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scorersComplete = [...homeSlots, ...awaySlots].every((slot) => slot !== "");
  const complete = scorersComplete && homeCoach !== null;
  // The hint tells the user what is necessary before the result can be saved.
  const missing = [
    homeCoach === null && `Kies wie met ${home.name} speelt.`,
    !scorersComplete && "Kies de maker van elk doelpunt.",
  ].filter(Boolean);

  const run = async (kind: "save" | "delete", action: () => Promise<void>, message: string) => {
    setBusy(kind);
    setError(null);
    try {
      await action();
      onSaved?.(message);
      onClose();
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(null);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!scorersComplete || homeCoach === null) return;
    const result: Result = {
      home: homeSlots.length,
      away: awaySlots.length,
      goals: [...toGoals(home.id, homeSlots), ...toGoals(away.id, awaySlots)],
      homeCoach,
    };
    run(
      "save",
      () => saveResult(match, result),
      `Uitslag opgeslagen: ${home.name} ${result.home}–${result.away} ${away.name}`,
    );
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    run("delete", () => deleteResult(match), `Uitslag gewist: ${home.name} – ${away.name}`);
  };

  return (
    <DialogForm onSubmit={handleSubmit}>
      <DialogBody>
        <p className={styles.round}>
          Speelronde {match.round} van {roundCount}
        </p>
        {/* The dice decide who plays at home. The other person plays with the away team. */}
        <SegmentedControl
          className={styles.coach}
          label={`Wie speelt met ${home.name} (thuis)?`}
          options={COACH_OPTIONS}
          value={homeCoach}
          onChange={setHomeCoach}
        />
        {/* The score controls stay at one place. A new goal only adds a list below them. */}
        <div className={styles.scoreboard}>
          <TeamScore
            team={home}
            coach={homeCoach}
            count={homeSlots.length}
            onChange={(count) => setHomeSlots((slots) => resize(slots, count))}
          />
          <TeamScore
            team={away}
            coach={homeCoach && otherCoach(homeCoach)}
            count={awaySlots.length}
            onChange={(count) => setAwaySlots((slots) => resize(slots, count))}
          />
        </div>
        {(homeSlots.length > 0 || awaySlots.length > 0) && (
          <div className={styles.scorerGroups}>
            <ScorerList team={home} slots={homeSlots} onChange={setHomeSlots} />
            <ScorerList team={away} slots={awaySlots} onChange={setAwaySlots} />
          </div>
        )}
        {missing.length > 0 && <p className={styles.hint}>{missing.join(" ")} Daarna kun je de uitslag opslaan.</p>}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        {existing && (
          <Button variant="danger" onClick={handleDelete} disabled={busy !== null}>
            {busy === "delete" ? "Wissen…" : confirmDelete ? "Wissen bevestigen" : "Uitslag wissen"}
          </Button>
        )}
        <Button type="submit" fill disabled={!complete || busy !== null}>
          {busy === "save" ? "Opslaan…" : "Uitslag opslaan"}
        </Button>
      </DialogFooter>
    </DialogForm>
  );
}

/** A new goal gets an empty scorer. A removed goal drops the last scorer. */
function resize(slots: string[], count: number): string[] {
  return count <= slots.length ? slots.slice(0, count) : [...slots, ...Array(count - slots.length).fill("")];
}

type TeamScoreProps = {
  team: Team;
  /** Who plays with this team. `null` before the choice. */
  coach: CoachId | null;
  count: number;
  onChange: (count: number) => void;
};

/** A band in the club colours with the buttons for the number of goals. */
function TeamScore({ team, coach, count, onChange }: TeamScoreProps) {
  return (
    <div className={styles.band} style={teamStyle(team)} role="group" aria-label={team.name}>
      <span className={styles.identity}>
        {/* The letter is on the corner of the logo, so it does not change the width of the band. */}
        <span className={styles.logo}>
          <TeamBadge team={team} size="md" plate />
          {coach && (
            <span className={styles.logoChip}>
              <CoachChip coach={coach} />
            </span>
          )}
        </span>
        <span className={styles.teamName}>{team.name}</span>
      </span>
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.step}
          onClick={() => onChange(count - 1)}
          disabled={count === 0}
          aria-label={`Doelpunt minder voor ${team.name}`}
        >
          −
        </button>
        <output className={styles.score} aria-label={`Doelpunten van ${team.name}`}>
          {count}
        </output>
        <button
          type="button"
          className={styles.step}
          onClick={() => onChange(count + 1)}
          disabled={count >= MAX_GOALS}
          aria-label={`Doelpunt erbij voor ${team.name}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

type ScorerListProps = {
  team: Team;
  slots: string[];
  onChange: (slots: string[]) => void;
};

/** One list for each goal. It has nothing to show for a team without goals. */
function ScorerList({ team, slots, onChange }: ScorerListProps) {
  const headingId = useId();
  const lines = groupByLine(squads[team.id]);
  if (slots.length === 0) return null;

  return (
    <div className={styles.group} role="group" aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.groupTitle}>
        <TeamBadge team={team} size="xs" />
        Doelpunten {team.name}
      </h3>
      <ol className={styles.scorers}>
        {slots.map((slot, index) => (
          <li key={index}>
            <select
              className={styles.select}
              value={slot}
              onChange={(event) =>
                onChange(slots.map((current, i) => (i === index ? event.target.value : current)))
              }
              aria-label={`Maker van doelpunt ${index + 1} van ${team.name}`}
              required
            >
              <option value="">Kies de maker van doelpunt {index + 1}</option>
              {lines.map((line) => (
                <optgroup key={line.label} label={line.label}>
                  {line.players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.number} {player.name}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value={OWN_GOAL}>Eigen doelpunt van de tegenstander</option>
            </select>
          </li>
        ))}
      </ol>
    </div>
  );
}

// "B. Saka 2×, K. Havertz, eigen doelpunt"
function scorerSummary(result: Result, team: Team): string {
  const counts = new Map<string, number>();
  for (const goal of result.goals) {
    if (goal.team !== team.id) continue;
    const name = goal.ownGoal
      ? "eigen doelpunt"
      : (squads[team.id].find((player) => player.id === goal.playerId)?.name ?? "onbekende speler");
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].map(([name, count]) => (count > 1 ? `${name} ${count}×` : name)).join(", ");
}

// "Inter Milan (Niels)", or only the club name when the result has no coach.
function withCoach(team: Team, result: Result | undefined, side: "home" | "away"): string {
  const coach = result && coachOf(result, side);
  return coach ? `${team.name} (${coachNames[coach]})` : team.name;
}

/** Without a token the site is read-only. The dialog shows the result and the token form. */
function ReadOnlyResult({ match }: { match: Match }) {
  const { results } = useResults();
  const result = results[match.id];
  const home = teamsById[match.home];
  const away = teamsById[match.away];

  return (
    <DialogBody>
      <p className={styles.round}>
        Speelronde {match.round} van {roundCount}
      </p>
      <p className={styles.fixture}>
        {withCoach(home, result, "home")} {result ? `${result.home}–${result.away}` : "–"}{" "}
        {withCoach(away, result, "away")}
      </p>
      {result ? (
        <dl className={styles.summary}>
          {[home, away].map((team) => {
            const summary = scorerSummary(result, team);
            return summary ? (
              <div key={team.id}>
                <dt>{team.name}</dt>
                <dd>{summary}</dd>
              </div>
            ) : null;
          })}
        </dl>
      ) : (
        <p className={styles.hint}>Deze wedstrijd heeft nog geen uitslag.</p>
      )}
      <div className={styles.token}>
        <TokenForm />
      </div>
    </DialogBody>
  );
}
