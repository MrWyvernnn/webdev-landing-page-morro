import { motion, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { SignatureRule } from "../components/SignatureRule";
import { PrimaryButton } from "../components/PrimaryButton";
import { useScrollTo } from "../lib/lenis";
import { expoOut, useReduced } from "../lib/motion";

const LINKS = [
  { id: "how-it-works", label: "How it works" },
  { id: "gates", label: "Gates" },
  { id: "screens", label: "Screens" },
  { id: "privacy", label: "Privacy" },
];

export function Nav() {
  const scrollTo = useScrollTo();
  const reduced = useReduced();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (value) => setScrolled(value > 40));
    return unsubscribe;
  }, [scrollY]);

  useEffect(() => {
    const nodes = LINKS.map((link) => document.getElementById(link.id)).filter(
      (node): node is HTMLElement => node !== null,
    );
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="nav" data-scrolled={scrolled}>
      <div className="shell nav__inner">
        <motion.a
          href="#top"
          className="nav__wordmark"
          onClick={scrollTo}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.15 : 0.5, ease: expoOut, delay: 0.05 }}
        >
          <span>Morro</span>
          <SignatureRule delay={0.45} width={26} />
        </motion.a>

        <nav className="nav__links" aria-label="Main">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="nav__link"
              data-active={active === link.id}
              onClick={scrollTo}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="nav__cta" style={{ paddingBlock: 4 }}>
          <PrimaryButton href="#waitlist" onClick={scrollTo} size="nav">
            Join the beta
          </PrimaryButton>
        </div>
      </div>
    </header>
  );
}
