"use client";

import type { ReactNode } from "react";
import Button from "@/components/Button";
import { useResults } from "@/contexts/ResultsContext";
import styles from "./ResultsGate.module.css";

/** Shows its content when the results are loaded. */
export default function ResultsGate({ children }: { children: ReactNode }) {
  const { status, error, reload } = useResults();

  if (status === "loading") {
    return (
      <p className={styles.loading} role="status">
        Uitslagen laden…
      </p>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.error} role="alert">
        <p>{error}</p>
        <Button variant="quiet" onClick={reload}>
          Opnieuw laden
        </Button>
      </div>
    );
  }

  return children;
}
