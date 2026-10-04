import { isCoachId } from "@/lib/coaches";
import type { Result, Results, ResultsFile } from "@/lib/types";

/** `version` identifies the stored file. The GitHub store uses the blob SHA. */
export type Snapshot = {
  results: Results;
  version: string | null;
};

export interface ResultsStore {
  readonly mode: "github" | "local";
  load(): Promise<Snapshot>;
  save(results: Results, version: string | null, message: string): Promise<Snapshot>;
}

/** An error with a message that the site can show to the user. */
export class StoreError extends Error {}

/** The stored file changed after the last load. */
export class ConflictError extends StoreError {
  constructor() {
    super("De uitslagen zijn op een andere plek gewijzigd. Laad de pagina opnieuw en probeer het opnieuw.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isResult(value: unknown): value is Result {
  return (
    isRecord(value) &&
    Number.isInteger(value.home) &&
    Number.isInteger(value.away) &&
    Array.isArray(value.goals) &&
    value.goals.every((goal) => isRecord(goal) && typeof goal.team === "string")
  );
}

export function parseResultsFile(text: string): Results {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new StoreError("Het bestand met uitslagen is beschadigd.");
  }
  if (!isRecord(data) || !isRecord(data.results)) {
    throw new StoreError("Het bestand met uitslagen is beschadigd.");
  }
  return Object.fromEntries(
    Object.entries(data.results)
      .filter((entry): entry is [string, Result] => isResult(entry[1]))
      .map(([id, result]) => [id, withValidCoach(result)]),
  );
}

// A value that is not N or T is the same as no value.
function withValidCoach(result: Result): Result {
  if (result.homeCoach === undefined || isCoachId(result.homeCoach)) return result;
  const rest = { ...result };
  delete rest.homeCoach;
  return rest;
}

export function serializeResults(results: Results): string {
  const file: ResultsFile = { version: 1, results };
  return `${JSON.stringify(file, null, 2)}\n`;
}
