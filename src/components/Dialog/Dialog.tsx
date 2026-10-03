"use client";

import { useEffect, useId, useRef, type FormHTMLAttributes, type ReactNode } from "react";
import styles from "./Dialog.module.css";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/** A modal dialog. It fills the screen on a phone and it is a centred window on larger screens. */
export default function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className={styles.dialog} aria-labelledby={titleId} onClose={onClose}>
      {open && (
        <div className={styles.layout}>
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Sluiten">
              ×
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

/** The part of the dialog that scrolls. */
export function DialogBody({ children }: { children: ReactNode }) {
  return <div className={styles.body}>{children}</div>;
}

/** The fixed row of buttons at the bottom of the dialog. */
export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className={styles.footer}>{children}</div>;
}

/** A form that holds a `DialogBody` and a `DialogFooter`. */
export function DialogForm(props: FormHTMLAttributes<HTMLFormElement>) {
  return <form className={styles.form} {...props} />;
}
