import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      {/* Fonts & Icons (loaded externally) */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      {/* ─── NAVBAR ─── */}
      <nav className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <div className="landing-logo">
            <i className="fa-solid fa-bell"></i> Stale Deal Nagger
          </div>
          <div className="landing-nav-links">
            <a href="#problem">The Problem</a>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="landing-nav-actions">
            {user ? (
              <Link
                to="/dashboard"
                className="landing-btn landing-btn-primary"
                style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="landing-login-link">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="landing-btn landing-btn-primary"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <header className="landing-hero landing-container">
        <div className="landing-hero-content landing-reveal landing-active">
          <div className="landing-system-pill">System Active</div>
          <h1 className="landing-h1">
            Your CRM is <br />
            <span className="landing-highlight">Lying to You.</span>
          </h1>
          <p className="landing-hero-subtext">
            Stop losing leads to human error. We automate the nagging so you
            don't have to. Trigger Slack nudges based on deal inactivity and fix
            your leaky pipeline.
          </p>
          <div className="landing-hero-buttons">
            <Link to="/register" className="landing-btn landing-btn-primary">
              Start Nagging Deals
            </Link>
            <Link to="/get-demo" className="landing-btn landing-btn-secondary">
              Get a Demo
            </Link>
          </div>
          <div className="landing-trusted-by">
            <div className="landing-avatars">
              <span></span>
              <span></span>
              <span></span>
            </div>
            Trusted by RevOps teams at 50+ agencies
          </div>
        </div>

        <div className="landing-hero-visual">
          <div className="landing-alert-popover">
            <div className="landing-alert-header">
              <i className="fa-solid fa-triangle-exclamation"></i> Action
              Required
            </div>
            <div className="landing-alert-body">
              Stark Industries is cold (14 days). <br />
              Sending Slack nudge to Vedang...
            </div>
          </div>

          <div className="landing-mockup-card">
            <div className="landing-mockup-header">
              <div className="landing-dots">
                <div className="landing-dot red"></div>
                <div className="landing-dot yellow"></div>
                <div className="landing-dot green"></div>
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  fontFamily: "monospace",
                }}
              >
                Stale Deal Monitor_
              </div>
            </div>

            <div className="landing-deal-row">
              <div className="landing-deal-icon">
                <i className="fa-solid fa-briefcase"></i>
              </div>
              <div className="landing-deal-info">
                <h4>Acme Corp Contract</h4>
                <p>Last touch: 2 hours ago</p>
              </div>
              <div className="landing-deal-status landing-status-healthy">
                Healthy
              </div>
            </div>

            <div className="landing-deal-row landing-deal-row-stale">
              <div className="landing-deal-icon landing-deal-icon-red">
                <i className="fa-regular fa-clock"></i>
              </div>
              <div className="landing-deal-info">
                <h4>Stark Industries POC</h4>
                <p>Last touch: 14 days ago</p>
              </div>
              <div className="landing-deal-status landing-status-stale">
                STALE
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── PROBLEM SECTION ─── */}
      <section id="problem" className="landing-section">
        <div className="landing-container landing-problem-layout">
          <div className="landing-reveal landing-active">
            <h2 className="landing-section-title">
              The &ldquo;I&rsquo;ll Do It Tomorrow&rdquo; Epidemic
            </h2>
            <p style={{ color: "#4b5563", marginBottom: "2rem" }}>
              Sales reps are optimistic. They &ldquo;swear&rdquo; they&rsquo;ll
              update the CRM. But reality is different. Deals rot in the
              pipeline simply because no one looked at them for 2 weeks.
            </p>
            <ul className="landing-problem-list">
              <li>
                <i className="fa-regular fa-circle-xmark"></i> Revenue
                forecasting becomes a guessing game
              </li>
              <li>
                <i className="fa-regular fa-circle-xmark"></i> Leads turn cold
                and go to competitors
              </li>
              <li>
                <i className="fa-regular fa-circle-xmark"></i> Manual
                &ldquo;check-ins&rdquo; waste manager time
              </li>
            </ul>
          </div>

          <div className="landing-problem-card landing-reveal landing-active">
            <div className="landing-loss-metric">
              <div className="landing-loss-icon">
                <i className="fa-solid fa-arrow-trend-down"></i>
              </div>
              <div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800 }}>$24,000</h3>
                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  Avg. Monthly Loss per Team
                </p>
              </div>
            </div>
            <div className="landing-progress-container">
              <div className="landing-progress-bar">
                <div
                  className="landing-progress-fill"
                  style={{ width: "76%" }}
                ></div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  color: "#6b7280",
                }}
              >
                <span>Forgotten Follow-ups</span>
                <span>76% of Loss</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES / STEPS ─── */}
      <section id="features" className="landing-section landing-bg-gradient">
        <div className="landing-container">
          <div className="landing-centered-header landing-reveal landing-active">
            <h2 className="landing-section-title">Automated Accountability</h2>
            <p style={{ color: "#4b5563" }}>
              Set it once. It runs forever. We monitor the boring stuff so you
              can close.
            </p>
          </div>

          <div className="landing-steps-grid">
            <div className="landing-step-card landing-reveal landing-active">
              <div className="landing-step-number">1</div>
              <h3>Connect &amp; Map</h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#4b5563",
                  marginTop: "0.5rem",
                }}
              >
                Link Google Sheets or HubSpot via OAuth. Map your columns to our
                logic engine in seconds.
              </p>
              <div className="landing-step-visual">
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      background: "#22c55e",
                      borderRadius: "50%",
                    }}
                  ></div>
                  Connected: HubSpot
                </div>
                <div
                  style={{
                    height: 6,
                    background: "#e5e7eb",
                    marginTop: 10,
                    borderRadius: 4,
                    width: "60%",
                  }}
                ></div>
              </div>
            </div>

            <div
              className="landing-step-card landing-reveal landing-active"
              style={{ transitionDelay: "0.2s" }}
            >
              <div className="landing-step-number">2</div>
              <h3>Set The Rules</h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#4b5563",
                  marginTop: "0.5rem",
                }}
              >
                Define what &ldquo;Stale&rdquo; means. 7 days? 14 days? Choose
                escalation channels (Slack, Email).
              </p>
              <div className="landing-step-visual">
                <div className="landing-toggle-ui">
                  <span style={{ fontSize: "0.8rem", color: "#111827" }}>
                    Inactivity: 7 Days
                  </span>
                  <div className="landing-toggle-switch"></div>
                </div>
              </div>
            </div>

            <div
              className="landing-step-card landing-reveal landing-active"
              style={{ transitionDelay: "0.4s" }}
            >
              <div className="landing-step-number">3</div>
              <h3>Get Nudged</h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#4b5563",
                  marginTop: "0.5rem",
                }}
              >
                Reps get alerted automatically. Managers get a weekly
                &ldquo;Shame Report&rdquo; of ignored deals.
              </p>
              <div className="landing-step-visual">
                <div
                  style={{
                    background: "#fff",
                    padding: 10,
                    borderRadius: 6,
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <i
                    className="fa-brands fa-slack"
                    style={{ color: "#111827" }}
                  ></i>
                  <div
                    style={{
                      height: 6,
                      background: "#e5e7eb",
                      width: "70%",
                      borderRadius: 4,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIAL ─── */}
      <section className="landing-testimonial-section">
        <div className="landing-container landing-reveal landing-active">
          <div className="landing-quote-icon">
            <i className="fa-solid fa-code"></i>
          </div>
          <div className="landing-quote-text">
            &ldquo;I built this because I saw millions lost to{" "}
            <span style={{ color: "#f97316" }}>laziness.</span>&rdquo;
          </div>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              maxWidth: 600,
              margin: "0 auto 2rem auto",
              fontSize: "1.1rem",
            }}
          >
            As a developer with a background in B2B Lead Gen, I realized the
            biggest problem wasn&rsquo;t generating leads&mdash;it was
            remembering to follow up. Stale Deal Nagger is the automated
            discipline every sales team needs.
          </p>
          <div className="landing-quote-author">
            <span className="landing-author-name">Vedang Vaidya</span>
            <span className="landing-author-title">
              Founder &amp; Developer | MSc Adv. Computer Science Liverpool
            </span>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="landing-section">
        <div className="landing-container">
          <div className="landing-centered-header landing-reveal landing-active">
            <h2 className="landing-section-title">
              Pay Less Than One Lost Deal
            </h2>
            <p style={{ color: "#4b5563" }}>
              Simple pricing for teams serious about revenue.
            </p>
          </div>

          <div className="landing-pricing-grid">
            <div className="landing-pricing-card landing-reveal landing-active">
              <h3>Growth Team</h3>
              <div className="landing-price">
                £149 <span>/month</span>
              </div>
              <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                Perfect for boutique agencies and small sales squads.
              </p>
              <ul className="landing-feature-list">
                <li>
                  <i className="fa-regular fa-circle-check"></i> Up to 5 Users
                </li>
                <li>
                  <i className="fa-regular fa-circle-check"></i> Google Sheets
                  Integration
                </li>
                <li>
                  <i className="fa-regular fa-circle-check"></i> Slack Nudges
                </li>
              </ul>
              <Link
                to="/get-demo"
                className="landing-btn landing-btn-secondary"
                style={{ width: "100%", textAlign: "center" }}
              >
                Start Trial
              </Link>
            </div>

            <div
              className="landing-pricing-card landing-pricing-popular landing-reveal landing-active"
              style={{ transitionDelay: "0.2s" }}
            >
              <div className="landing-popular-tag">Popular</div>
              <h3>Scale Up</h3>
              <div className="landing-price">
                £299 <span>/month</span>
              </div>
              <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>
                For rapid-growth teams needing full CRM enforcement.
              </p>
              <ul className="landing-feature-list">
                <li>
                  <i className="fa-regular fa-circle-check"></i> Unlimited Users
                </li>
                <li>
                  <i className="fa-regular fa-circle-check"></i> HubSpot +
                  Salesforce
                </li>
                <li>
                  <i className="fa-regular fa-circle-check"></i> Advanced Rule
                  Logic
                </li>
                <li>
                  <i className="fa-regular fa-circle-check"></i> Priority
                  Support
                </li>
              </ul>
              <Link
                to="/register"
                className="landing-btn landing-btn-primary"
                style={{ width: "100%", textAlign: "center" }}
              >
                Get Started Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div>
              <div className="landing-logo" style={{ marginBottom: "1rem" }}>
                <i className="fa-solid fa-bell"></i> Stale Deal Nagger
              </div>
              <p
                style={{ color: "#4b5563", maxWidth: 300, fontSize: "0.9rem" }}
              >
                Automated accountability for sales teams. Stop losing revenue to
                poor CRM hygiene.
              </p>
            </div>
            <div className="landing-footer-links">
              <h4>Product</h4>
              <ul>
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#pricing">Pricing</a>
                </li>
                <li>
                  <a href="#features">Integrations</a>
                </li>
              </ul>
            </div>
            <div className="landing-footer-links">
              <h4>Legal</h4>
              <ul>
                <li>
                  <a href="#pricing">Privacy Policy</a>
                </li>
                <li>
                  <a href="#pricing">Terms of Service</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="landing-copyright">
            &copy; 2026 Stale Deal Nagger. All rights reserved. Powered by
            MaxLeads
          </div>
        </div>
      </footer>
    </div>
  );
}
