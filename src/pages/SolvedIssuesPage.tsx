import type { RoadReport } from "../types";

interface SolvedIssuesPageProps {
  reports: RoadReport[];
}

function getResolvedTimestamp(report: RoadReport): string {
  return report.resolvedAt ?? report.reportedAt;
}

export default function SolvedIssuesPage({ reports }: SolvedIssuesPageProps) {
  const solvedReports = reports
    .filter((report) => report.status === "Resolved")
    .sort((a, b) => getResolvedTimestamp(b).localeCompare(getResolvedTimestamp(a)));

  return (
    <section className="flow-stack">
      <article className="page-head">
        <p className="kicker">Transparency Board</p>
        <h1>Solved Issues With Evidence</h1>
        <p>
          Recently completed complaints by field teams are listed here with completion
          evidence so citizens and admin can track outcomes transparently.
        </p>
      </article>

      <section className="resolved-grid" aria-label="Solved issues list">
        {solvedReports.length === 0 && (
          <article className="solution-card">
            <h3>No solved issues yet</h3>
            <p className="muted">Resolved complaints will appear here with proof photos.</p>
          </article>
        )}

        {solvedReports.map((report) => (
          <article key={report.id} className="resolved-card">
            <div className="resolved-card-media">
              <div>
                <p className="resolved-label">Reported Issue</p>
                <img src={report.imageUrl} alt={`${report.issueType} reported`} loading="lazy" />
              </div>
              <div>
                <p className="resolved-label">Resolution Evidence</p>
                <img
                  src={report.resolutionImageUrl ?? report.imageUrl}
                  alt={`${report.issueType} resolved evidence`}
                  loading="lazy"
                />
              </div>
            </div>

            <div className="resolved-card-body">
              <div className="chip-row">
                <span className="chip chip-neutral">{report.id}</span>
                <span className="chip chip-low">Resolved</span>
                <span className="chip chip-neutral">Progress 100%</span>
              </div>
              <h3>{report.issueType}</h3>
              <p>{report.description}</p>
              <p className="muted">{report.locality}</p>
              <p className="muted">Assigned Team: {report.assignedTeam}</p>
              <p className="muted">Reported: {report.reportedAt}</p>
              <p className="muted">Resolved: {report.resolvedAt ?? "Completed"}</p>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
