import { motion, useScroll } from "motion/react";
import { ReducedMotionProvider } from "./lib/motion";
import { LenisProvider } from "./lib/lenis";
import { Nav } from "./sections/Nav";
import { Hero } from "./sections/Hero";
import { MorningLoop } from "./sections/MorningLoop";
import { Wordmark } from "./sections/Wordmark";
import { Gates } from "./sections/Gates";
import { Screens } from "./sections/Screens";
import { Privacy } from "./sections/Privacy";
import { Signup } from "./sections/Signup";
import { Footer } from "./sections/Footer";

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="scroll-progress"
      style={{ scaleX: scrollYProgress }}
      aria-hidden="true"
    />
  );
}

export default function App() {
  return (
    <ReducedMotionProvider>
      <LenisProvider>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <ScrollProgress />
        <Nav />
        <main id="main">
          <Hero />
          <MorningLoop />
          <Wordmark />
          <Gates />
          <Screens />
          <Privacy />
          <Signup />
        </main>
        <Footer />
      </LenisProvider>
    </ReducedMotionProvider>
  );
}
