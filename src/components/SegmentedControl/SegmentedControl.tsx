"use client";

import { useId } from "react";
import styles from "./SegmentedControl.module.css";

type SegmentedControlProps<T extends string> = {
  /** The question that the options answer. */
  label: string;
  /** Hides the label on screen. A screen reader still reads it. */
  hideLabel?: boolean;
  options: { value: T; label: string }[];
  /** `null`: no option is selected. */
  value: T | null;
  onChange: (value: T) => void;
  className?: string;
};

/** A group of radio buttons that looks like one row of buttons. */
export default function SegmentedControl<T extends string>({
  label,
  hideLabel = false,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const name = useId();

  return (
    <fieldset className={[styles.group, className].filter(Boolean).join(" ")}>
      <legend className={hideLabel ? "visuallyHidden" : styles.legend}>{label}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              className={styles.input}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className={styles.text}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
