import { createGithubStore, type GithubConfig } from "./githubStore";
import { localStore } from "./localStore";
import type { ResultsStore } from "./resultsFile";

const repository = process.env.NEXT_PUBLIC_GITHUB_REPOSITORY;

/** `null` in local mode. The deploy workflow sets the repository. */
export const githubConfig: GithubConfig | null = repository
  ? {
      repository,
      branch: process.env.NEXT_PUBLIC_DATA_BRANCH || "main",
      path: "data/results.json",
    }
  : null;

export const resultsStore: ResultsStore = githubConfig ? createGithubStore(githubConfig) : localStore;

export { verifyToken } from "./githubStore";
export { ConflictError, StoreError } from "./resultsFile";
export type { ResultsStore, Snapshot } from "./resultsFile";
