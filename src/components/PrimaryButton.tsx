import type { MouseEventHandler, ReactNode } from "react";
import { motion } from "motion/react";
import { springs, useReduced } from "../lib/motion";

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  variant?: "primary" | "secondary";
  size?: "default" | "nav";
  block?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  ariaBusy?: boolean;
};

export function PrimaryButton({
  children,
  href,
  onClick,
  variant = "primary",
  size = "default",
  block = false,
  type = "button",
  disabled = false,
  className = "",
  ariaBusy,
}: Props) {
  const reduced = useReduced();
  const classes = [
    "btn",
    variant === "primary" ? "btn--primary" : "btn--secondary",
    size === "nav" ? "btn--nav" : "",
    block ? "btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const tap = reduced ? undefined : { scale: 0.96, y: 1, transition: springs.press };

  if (href) {
    return (
      <motion.a
        href={href}
        onClick={onClick}
        className={classes}
        whileTap={tap}
        transition={springs.playful}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={classes}
      disabled={disabled}
      aria-busy={ariaBusy}
      whileTap={disabled ? undefined : tap}
      transition={springs.playful}
    >
      {children}
    </motion.button>
  );
}
