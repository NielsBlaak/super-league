"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/Button";
import Dialog, { DialogBody, DialogFooter, DialogForm } from "@/components/Dialog";
import { TokenForm } from "@/components/TokenDialog";
import { errorMessage, useResults } from "@/contexts/ResultsContext";
import { roundCount } from "@/data/schedule";
import { squads } from "@/data/squads";
import { teamsById } from "@/data/teams";
import { groupByLine } from "@/lib/positions";
import { teamStyle } from "@/lib/teamStyle";
import type { Goal, Match, Result, Team } from "@/lib/types";
import styles from "./ResultDialog.module.css";

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
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = [...homeSlots, ...awaySlots].every((slot) => slot !== "");

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
    if (!complete) return;
    const result: Result = {
      home: homeSlots.length,
      away: awaySlots.length,
      goals: [...toGoals(home.id, homeSlots), ...toGoals(away.id, awaySlots)],
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
        <div className={styles.teams}>
          <TeamEntry team={home} slots={homeSlots} onChange={setHomeSlots} />
          <TeamEntry team={away} slots={awaySlots} onChange={setAwaySlots} />
        </div>
        {!complete && <p className={styles.hint}>Kies de maker van elk doelpunt. Daarna kun je de uitslag opslaan.</p>}
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

type TeamEntryProps = {
  team: Team;
  slots: string[];
  onChange: (slots: string[]) => void;
};

function TeamEntry({ team, slots, onChange }: TeamEntryProps) {
  const lines = groupByLine(squads[team.id]);

  return (
    <fieldset className={styles.team} style={teamStyle(team)}>
      <legend className="visuallyHidden">{team.name}</legend>
      <div className={styles.band}>
        <span className={styles.teamName}>{team.name}</span>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.step}
            onClick={() => onChange(slots.slice(0, -1))}
            disabled={slots.length === 0}
            aria-label={`Doelpunt minder voor ${team.name}`}
          >
            −
          </button>
          <output className={styles.score} aria-label={`Doelpunten van ${team.name}`}>
            {slots.length}
          </output>
          <button
            type="button"
            className={styles.step}
            onClick={() => onChange([...slots, ""])}
            disabled={slots.length >= MAX_GOALS}
            aria-label={`Doelpunt erbij voor ${team.name}`}
          >
            +
          </button>
        </div>
      </div>

      {slots.length > 0 && (
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
      )}
    </fieldset>
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
        {home.name} {result ? `${result.home}–${result.away}` : "–"} {away.name}
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
