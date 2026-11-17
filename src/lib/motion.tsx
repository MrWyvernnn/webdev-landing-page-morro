import { createContext, useContext, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import type { Transition } from "motion/react";

/** The app's Compose springs, damping = 2ζ√k, mass 1. */
export const springs = {
  default: { type: "spring", stiffness: 322, damping: 36, mass: 1 } satisfies Transition,
  momentum: { type: "spring", stiffness: 386, damping: 32, mass: 1 } satisfies Transition,
  press: { type: "spring", stiffness: 2741, damping: 105, mass: 1 } satisfies Transition,
  playful: { type: "spring", stiffness: 438, damping: 23, mass: 1 } satisfies Transition,
} as const;

type Bezier = [number, number, number, number];

export const expoOut: Bezier = [0.16, 1, 0.3, 1];

const ReducedContext = createContext(false);

/** A single reduced-motion signal for every animated component. */
export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  const prefersReduced = useReducedMotion();
  return <ReducedContext.Provider value={prefersReduced === true}>{children}</ReducedContext.Provider>;
}

export function useReduced() {
  return useContext(ReducedContext);
}
