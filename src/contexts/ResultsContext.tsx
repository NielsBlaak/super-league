"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { coachNames } from "@/data/coaches";
import { teamsById } from "@/data/teams";
import { otherCoach } from "@/lib/coaches";
import { ConflictError, githubConfig, resultsStore, StoreError, verifyToken, type Snapshot } from "@/lib/store";
import { clearToken, getToken, setToken, subscribeToken } from "@/lib/store/token";
import type { Match, Result, Results } from "@/lib/types";

type Status = "loading" | "ready" | "error";

type ResultsContextValue = {
  results: Results;
  status: Status;
  error: string | null;
  /** "local": the results stay in this browser. "github": the results are in the repo. */
  mode: "github" | "local";
  hasToken: boolean;
  canEdit: boolean;
  reload: () => void;
  saveResult: (match: Match, result: Result) => Promise<void>;
  deleteResult: (match: Match) => Promise<void>;
  saveToken: (token: string) => Promise<void>;
  removeToken: () => void;
};

const ResultsContext = createContext<ResultsContextValue | null>(null);

const EMPTY: Snapshot = { results: {}, version: null };
const getServerToken = () => null;

export function errorMessage(cause: unknown): string {
  return cause instanceof StoreError ? cause.message : "Er is een onbekende fout. Probeer het opnieuw.";
}

export function ResultsProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const latest = useRef<Snapshot>(EMPTY);
  const token = useSyncExternalStore(subscribeToken, getToken, getServerToken);

  useEffect(() => {
    let cancelled = false;
    resultsStore.load().then(
      (loaded) => {
        if (cancelled) return;
        latest.current = loaded;
        setSnapshot(loaded);
        setStatus("ready");
      },
      (cause: unknown) => {
        if (cancelled) return;
        setError(errorMessage(cause));
        setStatus("error");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setStatus("loading");
    setError(null);
    setAttempt((count) => count + 1);
  }, []);

  const mutate = useCallback(async (apply: (results: Results) => Results, message: string) => {
    let base = latest.current;
    // Without a version, the loaded copy can be old. Read the file again before the change.
    if (resultsStore.mode === "github" && base.version === null) base = await resultsStore.load();

    let saved: Snapshot;
    try {
      saved = await resultsStore.save(apply(base.results), base.version, message);
    } catch (cause) {
      if (!(cause instanceof ConflictError)) throw cause;
      const fresh = await resultsStore.load();
      saved = await resultsStore.save(apply(fresh.results), fresh.version, message);
    }
    latest.current = saved;
    setSnapshot(saved);
  }, []);

  const saveResult = useCallback(
    (match: Match, result: Result) => {
      const home = teamsById[match.home].name;
      const away = teamsById[match.away].name;
      // The commit message also names who played, for example "(Niels - Tim)".
      const coaches = result.homeCoach
        ? ` (${coachNames[result.homeCoach]} - ${coachNames[otherCoach(result.homeCoach)]})`
        : "";
      return mutate(
        (results) => ({ ...results, [match.id]: result }),
        `Uitslag: ${home} ${result.home}-${result.away} ${away}${coaches}`,
      );
    },
    [mutate],
  );

  const deleteResult = useCallback(
    (match: Match) => {
      const home = teamsById[match.home].name;
      const away = teamsById[match.away].name;
      return mutate((results) => {
        const next = { ...results };
        delete next[match.id];
        return next;
      }, `Uitslag gewist: ${home} - ${away}`);
    },
    [mutate],
  );

  const saveToken = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (githubConfig) await verifyToken(githubConfig, trimmed);
    setToken(trimmed);
  }, []);

  const value = useMemo<ResultsContextValue>(
    () => ({
      results: snapshot.results,
      status,
      error,
      mode: resultsStore.mode,
      hasToken: token !== null,
      canEdit: resultsStore.mode === "local" || token !== null,
      reload,
      saveResult,
      deleteResult,
      saveToken,
      removeToken: clearToken,
    }),
    [snapshot, status, error, token, reload, saveResult, deleteResult, saveToken],
  );

  return <ResultsContext.Provider value={value}>{children}</ResultsContext.Provider>;
}

export function useResults(): ResultsContextValue {
  const context = useContext(ResultsContext);
  if (!context) throw new Error("useResults must be used within a ResultsProvider");
  return context;
}
