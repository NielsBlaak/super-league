// The GitHub token stays in localStorage on this device. It never goes into the repo or the build.
const KEY = "super-league:github-token";
const listeners = new Set<() => void>();

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  window.localStorage.setItem(KEY, token);
  listeners.forEach((listener) => listener());
}

export function clearToken(): void {
  window.localStorage.removeItem(KEY);
  listeners.forEach((listener) => listener());
}

/** For `useSyncExternalStore`. Also reacts to a change in another tab. */
export function subscribeToken(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
