import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { useReduced } from "./motion";

const LenisContext = createContext<Lenis | null>(null);

/**
 * Exactly one Lenis instance and one rAF loop for the whole page.
 * Under reduced motion it is never created at all.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const reduced = useReduced();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (reduced) return;

    const instance = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      syncTouch: false,
      autoResize: true,
    });

    let frame = 0;
    const raf = (time: number) => {
      instance.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    setLenis(instance);

    return () => {
      cancelAnimationFrame(frame);
      instance.destroy();
      setLenis(null);
    };
  }, [reduced]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

export function useScrollTo() {
  const lenis = useContext(LenisContext);

  return useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      const href = event.currentTarget.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;

      event.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -88, duration: 1.15 });
      } else {
        target.scrollIntoView({ block: "start" });
      }
      window.history.replaceState(null, "", href);
    },
    [lenis],
  );
}
