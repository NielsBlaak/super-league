import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "quiet" | "danger";
  /** The button takes the free width of its row. */
  fill?: boolean;
};

export default function Button({
  variant = "primary",
  fill = false,
  type = "button",
  className,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], fill && styles.fill, className].filter(Boolean).join(" ");
  return <button type={type} className={classes} {...rest} />;
}
