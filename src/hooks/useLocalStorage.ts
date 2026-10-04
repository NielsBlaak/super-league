import { useCallback, useSyncExternalStore } from "react";

// The "storage" event comes only from another tab. This event tells this tab about its own change.
const CHANGE_EVENT = "super-league:storage";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * Keeps a text value in localStorage on this device.
 * The static HTML and a browser without storage use `fallback`.
 */
export function useLocalStorage<T extends string>(key: string, fallback: T): [T, (value: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return (window.localStorage.getItem(key) as T | null) ?? fallback;
      } catch {
        return fallback;
      }
    },
    () => fallback,
  );

  const setValue = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Storage is not available. The choice is not kept.
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [key],
  );

  return [value, setValue];
}
