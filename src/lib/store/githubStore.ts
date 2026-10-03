import {
  ConflictError,
  parseResultsFile,
  serializeResults,
  StoreError,
  type ResultsStore,
  type Snapshot,
} from "./resultsFile";
import { getToken } from "./token";

export type GithubConfig = {
  /** `owner/repo` */
  repository: string;
  branch: string;
  path: string;
};

const API = "https://api.github.com";
const EMPTY: Snapshot = { results: {}, version: null };

function headers(token: string | null): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function encodeBase64(text: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(base64: string): string {
  const binary = atob(base64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

export function createGithubStore({ repository, branch, path }: GithubConfig): ResultsStore {
  const contentsUrl = `${API}/repos/${repository}/contents/${path}`;
  const rawUrl = `https://raw.githubusercontent.com/${repository}/${branch}/${path}`;

  // The public copy has no rate limit, but it can be a few minutes old and it has no SHA.
  async function loadPublicCopy(): Promise<Snapshot> {
    let response: Response;
    try {
      response = await fetch(rawUrl, { cache: "no-store" });
    } catch {
      throw new StoreError("De uitslagen zijn niet te laden. Controleer de verbinding en probeer het opnieuw.");
    }
    if (response.status === 404) return EMPTY;
    if (!response.ok) {
      throw new StoreError(`De uitslagen zijn niet te laden (fout ${response.status}). Probeer het opnieuw.`);
    }
    return { results: parseResultsFile(await response.text()), version: null };
  }

  return {
    mode: "github",

    async load() {
      let response: Response | null = null;
      try {
        response = await fetch(`${contentsUrl}?ref=${encodeURIComponent(branch)}`, {
          headers: headers(getToken()),
          cache: "no-store",
        });
      } catch {
        // No connection to the API. The public copy is the fallback.
      }

      if (response?.ok) {
        const file = (await response.json()) as { content: string; sha: string };
        return { results: parseResultsFile(decodeBase64(file.content)), version: file.sha };
      }
      // The file does not exist before the first result.
      if (response?.status === 404) return EMPTY;
      // Rate limit (60 requests per hour without a token) or a token that is not valid.
      return loadPublicCopy();
    },

    async save(results, version, message) {
      const token = getToken();
      if (!token) throw new StoreError("Voer eerst een GitHub-token in.");

      let response: Response;
      try {
        response = await fetch(contentsUrl, {
          method: "PUT",
          headers: { ...headers(token), "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            content: encodeBase64(serializeResults(results)),
            branch,
            ...(version ? { sha: version } : {}),
          }),
        });
      } catch {
        throw new StoreError("Het opslaan is mislukt. Controleer de verbinding en probeer het opnieuw.");
      }

      if (response.ok) {
        const body = (await response.json()) as { content: { sha: string } };
        return { results, version: body.content.sha };
      }
      // 409: the SHA is old. 422: the file exists but the request has no SHA.
      if (response.status === 409 || response.status === 422) throw new ConflictError();
      if (response.status === 401) {
        throw new StoreError("Het GitHub-token is niet geldig of is verlopen. Voer een nieuw token in.");
      }
      if (response.status === 403 || response.status === 404) {
        throw new StoreError(
          "Het GitHub-token heeft geen schrijfrechten op deze repo. Geef het token het recht “Contents: Read and write”.",
        );
      }
      throw new StoreError(`Het opslaan is mislukt (fout ${response.status}). Probeer het opnieuw.`);
    },
  };
}

/** Checks that GitHub accepts the token. GitHub gives status 401 for a token that is not valid. */
export async function verifyToken({ repository }: GithubConfig, token: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API}/repos/${repository}`, { headers: headers(token), cache: "no-store" });
  } catch {
    throw new StoreError("GitHub is niet bereikbaar. Controleer de verbinding en probeer het opnieuw.");
  }
  if (response.status === 401) {
    throw new StoreError("GitHub accepteert dit token niet. Controleer het token en probeer het opnieuw.");
  }
  if (!response.ok) {
    throw new StoreError("Het token heeft geen toegang tot deze repo. Kies de repo bij het maken van het token.");
  }
}
