"use client";

import { useResults } from "@/contexts/ResultsContext";
import styles from "./LocalModeNotice.module.css";

/** Tells the user that no GitHub repo is configured. */
export default function LocalModeNotice() {
  const { mode } = useResults();
  if (mode !== "local") return null;

  return <p className={styles.notice}>Lokale modus: de uitslagen staan alleen in deze browser.</p>;
}
