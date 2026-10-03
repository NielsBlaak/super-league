import { parseResultsFile, serializeResults, type ResultsStore } from "./resultsFile";

const KEY = "super-league:results";

/** Local mode: the results stay in this browser. Used when no GitHub repo is configured. */
export const localStore: ResultsStore = {
  mode: "local",

  async load() {
    const text = window.localStorage.getItem(KEY);
    return { results: text ? parseResultsFile(text) : {}, version: null };
  },

  async save(results) {
    window.localStorage.setItem(KEY, serializeResults(results));
    return { results, version: null };
  },
};
