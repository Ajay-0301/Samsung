import { Link } from "react-router-dom";
import type { RoadReport } from "../types";

interface HomePageProps {
  reportsCount: number;
  reports: RoadReport[];
  onConfirmIssue: (reportId: string) => void;
}

const statsBase = [
  { value: "68%", label: "Issues Fixed Within 72h" },
  { value: "112", label: "Active Maintenance Teams" }
];

export default function HomePage({ reportsCount, reports, onConfirmIssue }: HomePageProps) {
  const stats = [
    { value: `${reportsCount}+`, label: "Citizen Reports Logged" },
    ...statsBase
  ];

  const nearbyOpenIssues = reports
    .filter((report) => report.status !== "Resolved")
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 4);

  const leaderboard = Object.values(
    reports.reduce<Record<string, { name: string; points: number; reports: number }>>((acc, report) => {
      const key = report.reporterName;
      if (!acc[key]) {
        acc[key] = { name: report.reporterName, points: 0, reports: 0 };
      }
      acc[key].reports += 1;
      acc[key].points += 10 + report.upvotes * 2;
      return acc;
    }, {})
  )
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  return (
    <section className="home-container">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-kicker">🛣️ Smart Road Maintenance Platform</span>
          <h1 className="hero-title">Report road issues. Get them fixed.</h1>
          <p className="hero-subtitle">
            Fast, transparent complaint system that connects citizens with municipal authorities.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-primary btn-lg" to="/report">
              📍 Report an Issue
            </Link>
            <Link className="btn btn-secondary btn-lg" to="/admin">
              📊 View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - STEP BY STEP */}
      <section className="section-container">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          <div className="step-box step-1">
            <div className="step-number">1</div>
            <h3>Report Issue</h3>
            <p>Describe the problem, pinpoint location on map, and upload photo evidence.</p>
          </div>
          <div className="step-box step-2">
            <div className="step-number">2</div>
            <h3>AI Analysis</h3>
            <p>Automatic damage detection, priority inference, and duplicate checking.</p>
          </div>
          <div className="step-box step-3">
            <div className="step-number">3</div>
            <h3>Team Assignment</h3>
            <p>Report routed to nearest municipal team with SLA and repair estimate.</p>
          </div>
          <div className="step-box step-4">
            <div className="step-number">4</div>
            <h3>Track & Resolve</h3>
            <p>Monitor repair progress and verify completion. Earn citizen points.</p>
          </div>
        </div>
      </section>

      {/* IMPACT STATS */}
      <section className="section-container section-alt">
        <h2 className="section-title">Our Impact</h2>
        <div className="stat-grid-new">
          {stats.map((stat) => (
            <article key={stat.label} className="stat-card-new">
              <p className="stat-value">{stat.value}</p>
              <p className="stat-label">{stat.label}</p>
            </article>
          ))}
        </div>
      </section>

      {/* KEY FEATURES */}
      <section className="section-container">
        <h2 className="section-title">Why Choose RoadFix?</h2>
        <div className="features-grid-new">
          <div className="feature-box">
            <div className="feature-icon">🎯</div>
            <h3>Accurate Reporting</h3>
            <p>GPS map pinning and detailed descriptions ensure zero confusion about problem location.</p>
          </div>
          <div className="feature-box">
            <div className="feature-icon">🤖</div>
            <h3>Smart Detection</h3>
            <p>AI analyzes photos to classify damage type and suggest severity level instantly.</p>
          </div>
          <div className="feature-box">
            <div className="feature-icon">⚡</div>
            <h3>Fast Response</h3>
            <p>SLA tracking ensures critical issues get attention within guaranteed timeframes.</p>
          </div>
          <div className="feature-box">
            <div className="feature-icon">👥</div>
            <h3>Community Driven</h3>
            <p>Confirm existing issues and earn points. Leaderboard rewards active citizens.</p>
          </div>
          <div className="feature-box">
            <div className="feature-icon">📱</div>
            <h3>Multi-Channel</h3>
            <p>Submit via web, mobile app, or call 311. No barriers to reporting.</p>
          </div>
          <div className="feature-box">
            <div className="feature-icon">🔍</div>
            <h3>Full Transparency</h3>
            <p>Track every status change from submitted to assigned to resolved in real-time.</p>
          </div>
        </div>
      </section>

      {/* WHAT WE OFFER */}
      <section className="section-container section-alt">
        <h2 className="section-title">Traditional vs. RoadFix</h2>
        <div className="comparison-grid">
          <div className="comparison-card">
            <h3>Traditional System</h3>
            <div className="checklist">
              <p>✓ Citizens submit complaints with evidence</p>
              <p>✓ Manual location mapping by admin</p>
              <p>✓ Basic dashboard for tracking</p>
              <p>✗ No AI assistance</p>
              <p>✗ No SLA enforcement</p>
              <p>✗ Limited citizen engagement</p>
            </div>
          </div>
          <div className="comparison-card comparison-card-highlight">
            <h3>RoadFix Features</h3>
            <div className="checklist">
              <p>✓ Citizens submit with GPS pinning</p>
              <p>✓ Automatic damage detection AI</p>
              <p>✓ Smart priority inference</p>
              <p>✓ Duplicate prevention system</p>
              <p>✓ SLA prediction & overdue alerts</p>
              <p>✓ Heatmap analytics dashboard</p>
              <p>✓ Citizen rewards & leaderboard</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY SECTION */}
      <section className="section-container">
        <h2 className="section-title">Active Community</h2>
        <div className="community-section-grid">
          <div className="community-card">
            <h3>Open Issues Worth Confirming</h3>
            <p className="section-subtitle">Help verify nearby problems and prevent duplicates.</p>
            <div className="issues-list">
              {nearbyOpenIssues.length > 0 ? (
                nearbyOpenIssues.map((issue) => (
                  <div key={issue.id} className="issue-row">
                    <div className="issue-info">
                      <p className="issue-id">{issue.id}</p>
                      <p className="issue-type">{issue.issueType}</p>
                      <p className="issue-location">{issue.locality}</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-confirm"
                      onClick={() => onConfirmIssue(issue.id)}
                    >
                      Confirm <span className="upvote-badge">{issue.upvotes}</span>
                    </button>
                  </div>
                ))
              ) : (
                <p className="no-issues">No open issues to confirm right now.</p>
              )}
            </div>
          </div>

          <div className="community-card">
            <h3>Top Road Guardians</h3>
            <p className="section-subtitle">Citizens leading by reporting and verifying issues.</p>
            <div className="leaderboard">
              {leaderboard.length > 0 ? (
                leaderboard.map((citizen, index) => (
                  <div key={citizen.name} className="leaderboard-row">
                    <div className="rank-badge">#{index + 1}</div>
                    <div className="citizen-info">
                      <p className="citizen-name">{citizen.name}</p>
                      <p className="citizen-stats">{citizen.reports} reports • {citizen.points} pts</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-leaders">No citizen data yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER MESSAGE */}
      <section className="section-container section-center">
        <p className="home-footer">
          Built for faster road issue tracking, transparent status updates, and safer daily commutes.
        </p>
      </section>
    </section>
  );
}