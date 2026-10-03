"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import TokenDialog from "@/components/TokenDialog";
import { useResults } from "@/contexts/ResultsContext";
import styles from "./Header.module.css";

const LINKS = [
  { href: "/", label: "Stand" },
  { href: "/speelschema", label: "Speelschema" },
  { href: "/topscorers", label: "Topscorers" },
];

export default function Header() {
  const pathname = usePathname();
  const { mode } = useResults();
  const [manageOpen, setManageOpen] = useState(false);
  // `trailingSlash` adds a slash to the path.
  const current = pathname.replace(/\/$/, "") || "/";

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link href="/" className={styles.wordmark}>
          Super League
        </Link>

        {/* Phone: a tab bar at the bottom of the screen. Larger screens: links in the header. */}
        <nav className={styles.nav} aria-label="Hoofdmenu">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={styles.link}
              aria-current={current === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        {mode === "github" && (
          <button type="button" className={styles.manage} onClick={() => setManageOpen(true)}>
            Beheer
          </button>
        )}
      </div>

      <TokenDialog open={manageOpen} onClose={() => setManageOpen(false)} />
    </header>
  );
}
