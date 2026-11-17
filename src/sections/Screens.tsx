import { useEffect, useRef, useState, type ComponentType } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { DashboardPhone, SetupPhone, SplashPhone } from "../components/Phones";
import { springs, useReduced } from "../lib/motion";

type PhoneProps = { spin?: MotionValue<number> };

const PHONES: { id: string; caption: string; Screen: ComponentType<PhoneProps> }[] = [
  { id: "splash", caption: "Opens here.", Screen: SplashPhone },
  { id: "dashboard", caption: "One alarm. One mission.", Screen: DashboardPhone },
  { id: "setup", caption: "Set it in ten seconds.", Screen: SetupPhone },
];

export function Screens() {
  const reduced = useReduced();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [narrow, setNarrow] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [12, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.94, 1]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !narrow) return;
    const cards = Array.from(track.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = cards.indexOf(entry.target as HTMLElement);
          if (index >= 0) setActive(index);
        });
      },
      { root: track, threshold: 0.7 },
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [narrow]);

  return (
    <section className="section" id="screens" aria-labelledby="screens-title" ref={sectionRef}>
      <div className="shell">
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={reduced ? { duration: 0.15 } : springs.default}
          style={{ maxWidth: "52ch" }}
        >
          <h2 className="t-section-lg" id="screens-title">
            Three screens. That’s the whole app.
          </h2>
          <p
            className="t-body"
            style={{ marginTop: 16, color: "var(--text-secondary)", fontSize: 17, lineHeight: "26px" }}
          >
            No dashboard to learn. You set a time, pick a mission, and go to sleep.
          </p>
        </motion.div>
      </div>

      <div className="shell" style={{ perspective: 1200 }}>
        <motion.div
          className="phone-track"
          ref={trackRef}
          style={
            reduced
              ? undefined
              : { rotateX, scale, transformPerspective: 1200, transformStyle: "preserve-3d" }
          }
        >
          {PHONES.map((phone, index) => {
            const Screen = phone.Screen;
            return (
              <motion.div
                key={phone.id}
                animate={{ scale: narrow && active !== index ? 0.97 : 1 }}
                transition={reduced ? { duration: 0 } : springs.momentum}
                style={{ willChange: "transform" }}
              >
                <motion.div
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={
                    reduced ? { duration: 0.15 } : { ...springs.default, delay: index * 0.09 }
                  }
                >
                  <Screen spin={scrollYProgress} />
                </motion.div>
                <p className="phone__caption">{phone.caption}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

    </section>
  );
}
