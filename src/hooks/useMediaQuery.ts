import { useCallback, useSyncExternalStore } from "react";

const getServerSnapshot = () => false;

/** Gives `false` in the static HTML. The phone layout is the base layout. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, getServerSnapshot);
}
