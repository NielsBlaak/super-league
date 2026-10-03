"use client";

import { useId, useState, type FormEvent } from "react";
import Button from "@/components/Button";
import { errorMessage, useResults } from "@/contexts/ResultsContext";
import { githubConfig } from "@/lib/store";
import styles from "./TokenForm.module.css";

const NEW_TOKEN_URL = "https://github.com/settings/personal-access-tokens/new";

/** Lets the user save or remove the GitHub token on this device. */
export default function TokenForm() {
  const { hasToken, saveToken, removeToken } = useResults();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await saveToken(value);
      setValue("");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <p>
        De site bewaart de uitslagen in de GitHub-repo <strong>{githubConfig?.repository}</strong>. Je hebt een
        token nodig om uitslagen op te slaan.
      </p>

      {hasToken ? (
        <div className={styles.saved}>
          <p role="status">Er staat een token op dit apparaat. Je kunt uitslagen opslaan.</p>
          <Button variant="danger" onClick={removeToken}>
            Token verwijderen
          </Button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <ol className={styles.steps}>
            <li>
              Maak een{" "}
              <a href={NEW_TOKEN_URL} target="_blank" rel="noreferrer">
                fine-grained token op GitHub
              </a>
              .
            </li>
            <li>Kies alleen deze repo bij “Repository access”.</li>
            <li>Geef het recht “Contents: Read and write”.</li>
          </ol>
          <label htmlFor={inputId} className={styles.label}>
            GitHub-token
          </label>
          <input
            id={inputId}
            className={styles.input}
            type="password"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            required
          />
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy || value.trim() === ""}>
            {busy ? "Token controleren…" : "Token opslaan"}
          </Button>
          <p className={styles.note}>Het token blijft op dit apparaat. Het token komt niet in de repo.</p>
        </form>
      )}
    </div>
  );
}
