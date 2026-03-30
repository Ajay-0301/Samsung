                                                                                                                                                import { useState } from "react";
                                                                                                                                                import { Link } from "react-router-dom";
import type { RoadReport } from "../types";

interface HomePageProps {
  reportsCount: number;
  reports: RoadReport[];
  onConfirmIssue: (reportId: string) => Promise<void> | void;
}

const statsBase = [
  { value: "68%", label: "Issues Fixed Within 72h" },
  { value: "112", label: "Active Maintenance Teams" }
];

function getProgressPercent(status: RoadReport["status"]): number {
  switch (status) {
    case "New":
      return 25;
    case "In Review":
      return 50;
    case "Assigned":
      return 75;
    case "Resolved":
      return 100;
    default:
      return 0;
  }
}

function getProgressLabel(status: RoadReport["status"]): string {
  switch (status) {
    case "New":
      return "Seen by Admin";
    case "In Review":
      return "Work Assigned";
    case "Assigned":
      return "Team Reached Location";
    case "Resolved":
      return "Completed with Evidence";
    default:
      return "Pending";
  }
}

function getStageCompletion(status: RoadReport["status"]) {
  const percent = getProgressPercent(status);
  return [
    { key: "seen", percent: 25, label: "Seen by Admin", done: percent >= 25 },
    { key: "assigned", percent: 50, label: "Work Assigned", done: percent >= 50 },
    { key: "onsite", percent: 75, label: "Team Reached Location", done: percent >= 75 },
    { key: "done", percent: 100, label: "Completed + Photo Uploaded", done: percent >= 100 }
  ];
}

export default function HomePage({ reportsCount, reports, onConfirmIssue }: HomePageProps) {
  const [expandedProgressId, setExpandedProgressId] = useState<string | null>(null);

  const stats = [
    { value: `${reportsCount}+`, label: "Citizen Reports Logged" },
    ...statsBase
  ];

  const nearbyOpenIssues = reports
    .filter((report) => report.status !== "Resolved")
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 4);

  const recentSolved = reports
    .filter((report) => report.status === "Resolved")
    .sort((a, b) => (b.resolvedAt ?? b.reportedAt).localeCompare(a.resolvedAt ?? a.reportedAt))
    .slice(0, 4);

  const transparencyQueue = reports
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
    .slice(0, 5);

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
          <div className="hero-badges">
            <span>Live Tracking</span>
            <span>Geo-Verified Reports</span>
            <span>Fast Assignment</span>
          </div>
          <div className="hero-cta">
            <Link className="btn btn-primary btn-lg" to="/report">
              📍 Report an Issue
            </Link>
            <Link className="btn btn-secondary btn-lg" to="/solved">
              ✅ View Solved Issues
            </Link>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orb hero-orb-main" />
          <div className="hero-orb hero-orb-alt" />
          <div className="hero-float-card hero-float-card-a">Priority Routing</div>
          <div className="hero-float-card hero-float-card-b">Realtime Status</div>
          <div className="hero-float-card hero-float-card-c">Ward Analytics</div>
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
            <h3>Admin Verification</h3>
            <p>Municipal team validates the report and sets priority transparently.</p>
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

      {/* PROGRESS TRANSPARENCY */}
      <section className="section-container section-alt">
        <h2 className="section-title">Live Report Progress</h2>
        <div className="transparency-list">
          {transparencyQueue.map((report) => (
            <article key={report.id} className="transparency-item">
              <div className="transparency-layout">
                <img
                  className="transparency-image"
                  src={report.imageUrl}
                  alt={`${report.issueType} complaint`}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src =
                      "https://images.unsplash.com/photo-1593766788305-88f8f2184a82?auto=format&fit=crop&w=900&q=60";
                  }}
                />
                <div className="transparency-content">
                  <div className="transparency-head">
                    <p>{report.id} - {report.issueType}</p>
                    <strong>{getProgressPercent(report.status)}%</strong>
                  </div>
                  <p className="transparency-meta">{report.locality}</p>
                  <p className="transparency-meta">{report.description}</p>
                  <p className="transparency-meta">
                    Priority: {report.priority} | Stage: {getProgressLabel(report.status)}
                  </p>
                  <div className="progress-bar">
                    <span style={{ width: `${getProgressPercent(report.status)}%` }} />
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost progress-toggle"
                    onClick={() =>
                      setExpandedProgressId((prev) => (prev === report.id ? null : report.id))
                    }
                  >
                    {expandedProgressId === report.id ? "Hide Tracking" : "View Tracking"}
                  </button>
                </div>
              </div>

              {expandedProgressId === report.id && (
                <div className="stage-list" aria-label="Detailed report progress">
                  {getStageCompletion(report.status).map((stage) => (
                    <div key={`${report.id}-${stage.key}`} className="stage-item">
                      <span
                        className={stage.done ? "stage-dot stage-dot-done" : "stage-dot"}
                        aria-hidden="true"
                      />
                      <p>{stage.label}</p>
                      <strong>{stage.percent}%</strong>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* RECENTLY SOLVED */}
      <section className="section-container">
        <h2 className="section-title">Recently Solved Issues (Everyone)</h2>
        <div className="recent-solved-grid">
          {recentSolved.length === 0 && (
            <article className="solution-card">
              <h3>No solved cases yet</h3>
              <p className="section-subtitle">Resolved issues with proof will appear here.</p>
            </article>
          )}

          {recentSolved.map((report) => (
            <article key={report.id} className="recent-solved-card">
              <img
                src={report.resolutionImageUrl ?? report.imageUrl}
                alt={`${report.issueType} solved evidence`}
                loading="lazy"
              />
              <div className="recent-solved-body">
                <p className="issue-id">{report.id}</p>
                <h3>{report.issueType}</h3>
                <p className="issue-location">{report.locality}</p>
                <p className="citizen-stats">Resolved on {report.resolvedAt ?? report.reportedAt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FOOTER MESSAGE */}
      <section className="section-container section-center">
        <p className="home-footer">
          
        </p>
      </section>
    </section>
  );
}