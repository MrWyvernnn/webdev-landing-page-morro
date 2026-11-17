import { MorroMascot } from "../components/MorroMascot";
import { SignatureRule } from "../components/SignatureRule";

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--hairline)" }}>
      <div className="shell" style={{ paddingBlock: "64px 40px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 32,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <MorroMascot size={48} animated={false} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 17, lineHeight: "22px" }}>Morro</span>
                  <SignatureRule delay={0.2} width={24} />
                </div>
                <p className="t-secondary" style={{ marginTop: 4, color: "var(--text-secondary)" }}>
                  A commitment device for the first ten seconds.
                </p>
              </div>
            </div>
          </div>

          <nav aria-label="Footer" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <a href="/privacy.html" className="footer-link t-secondary">
              Privacy
            </a>
            <a href="mailto:marhaanansari@gmail.com" className="footer-link t-secondary">
              Contact
            </a>
            <a
              href="https://github.com/marhaanansari"
              className="footer-link t-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </nav>
        </div>

        <p
          className="t-label"
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: "1px solid var(--hairline)",
            color: "var(--text-tertiary)",
          }}
        >
          Android 8.0 and up. Made by one person who slept badly.
        </p>
      </div>
    </footer>
  );
}
