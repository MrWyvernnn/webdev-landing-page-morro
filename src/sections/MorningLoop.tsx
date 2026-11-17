import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Waveform } from "../components/Waveform";
import { expoOut, springs, useReduced } from "../lib/motion";

const CARDS = [
  {
    step: "The night before",
    title: "Leave a note for morning-you.",
    body: "Record one short promise in your own voice. What matters tomorrow? Say it now, while you still mean it.",
    sample: "Up. Water. Then the run.",
    byline: "you, last night",
  },
  {
    step: "When the alarm rings",
    title: "Hear it from someone you trust.",
    body: "Your own voice plays back. It keeps going until you’ve listened — before you can talk yourself out of it.",
    sample: null,
    byline: null,
  },
];

const STATE_COPY = [
  "With a normal alarm you dismiss it, roll over, and wake up forty-five minutes later bargaining with the day you meant to begin.",
  "At seven in the morning the only voice you still believe is the one that meant it last night.",
];

export function MorningLoop() {
  const reduced = useReduced();
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState(false);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const nodes = cardRefs.current.filter((node): node is HTMLDivElement => node !== null);
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = nodes.indexOf(entry.target as HTMLDivElement);
          if (index >= 0) setActive(index);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="section" id="how-it-works" aria-labelledby="loop-title">
      <div className="shell">
        <div className="loop__grid">
          <div className="loop__pin">
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={reduced ? { duration: 0.15 } : springs.default}
            >
              <h2 className="t-section" id="loop-title">
                Your tired brain is a good negotiator.
              </h2>

              <div className="loop__state">
                {STATE_COPY.map((copy, index) => (
                  <motion.div
                    key={index}
                    className="loop__state-item"
                    initial={false}
                    animate={{ opacity: active === index ? 1 : 0 }}
                    transition={{ duration: reduced ? 0 : 0.22, ease: expoOut }}
                    aria-hidden={active !== index}
                  >
                    <p className="t-headline" style={{ color: "var(--text-primary)" }}>
                      {CARDS[index].step}
                    </p>
                    <p className="t-body" style={{ marginTop: 12, color: "var(--text-secondary)" }}>
                      {copy}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="loop__cards">
            {CARDS.map((card, index) => (
              <div
                className="loop__card-wrap"
                key={card.step}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
              >
                <motion.article
                  className="card"
                  style={{ padding: 24 }}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={
                    reduced ? { duration: 0.15 } : { ...springs.default, delay: index * 0.06 }
                  }
                >
                  <p className="t-label" style={{ color: "var(--text-tertiary)" }}>
                    {card.step}
                  </p>
                  <h3 className="t-headline" style={{ marginTop: 8 }}>
                    {card.title}
                  </h3>
                  <p className="t-body" style={{ marginTop: 12, color: "var(--text-secondary)" }}>
                    {card.body}
                  </p>

                  {card.sample && (
                    <>
                      <p className="loop__sample">“{card.sample}”</p>
                      <p className="loop__byline">{card.byline}</p>
                    </>
                  )}

                  {index === 1 && (
                    <>
                      <Waveform playing={preview} />
                      <button
                        type="button"
                        onClick={() => setPreview((current) => !current)}
                        aria-pressed={preview}
                        className="t-label"
                        style={{
                          marginTop: 12,
                          minHeight: 44,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          color: preview ? "var(--text-primary)" : "var(--text-secondary)",
                          borderBottom: "1px solid var(--hairline-strong)",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 99,
                            background: preview ? "var(--honey)" : "var(--surface-low)",
                          }}
                        />
                        {preview ? "Preview on" : "Preview"}
                      </button>
                    </>
                  )}
                </motion.article>
              </div>
            ))}
          </div>
        </div>

        <motion.p
          className="t-body"
          style={{ marginTop: 56, maxWidth: "58ch", color: "var(--text-secondary)" }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={reduced ? { duration: 0.15 } : springs.default}
        >
          Handbuilt because we slept badly too. Morro is for people who mean it — and want a little
          friction between a promise and an excuse.
        </motion.p>
      </div>
    </section>
  );
}
