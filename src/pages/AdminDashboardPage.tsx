import { useMemo, useState } from "react";
import { isOverdue } from "../utils/reportIntelligence";
import type { ReportStatus, RoadIssueType, RoadReport } from "../types";

interface AdminDashboardPageProps {
  reports: RoadReport[];
  onAdvanceStatus: (reportId: string) => Promise<void> | void;
  onUpdateResolutionEvidence: (reportId: string, resolutionImageUrl: string) => Promise<void> | void;
  onRefreshReports: () => Promise<void> | void;
}

const statusOrder: ReportStatus[] = ["New", "In Review", "Assigned", "Resolved"];

function nextStatus(current: ReportStatus): ReportStatus {
  const index = statusOrder.indexOf(current);
  if (index < 0 || index === statusOrder.length - 1) {
    return current;
  }
  return statusOrder[index + 1];
}

function getStatusStep(current: ReportStatus): number {
  return statusOrder.indexOf(current);
}

function getProgressPercent(status: ReportStatus): number {
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read image file."));
      }
    };
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

export default function AdminDashboardPage({
  reports,
  onAdvanceStatus,
  onUpdateResolutionEvidence,
  onRefreshReports
}: AdminDashboardPageProps) {
  const [filterType, setFilterType] = useState<RoadIssueType | "All">("All");
  const [filterStatus, setFilterStatus] = useState<ReportStatus | "All">("All");
  const [evidenceDrafts, setEvidenceDrafts] = useState<Record<string, string>>({});
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const handleEvidenceFileUpload = async (reportId: string, file?: File) => {
    if (!file) {
      return;
    }

    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      onUpdateResolutionEvidence(reportId, imageDataUrl);
      setEvidenceDrafts((prev) => ({
        ...prev,
        [reportId]: imageDataUrl
      }));
    } catch {
      // Keep UI stable; admin can still paste URL as fallback.
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const byType = filterType === "All" || report.issueType === filterType;
      const byStatus = filterStatus === "All" || report.status === filterStatus;
      return byType && byStatus;
    });
  }, [reports, filterType, filterStatus]);

  const averageRepairDays = useMemo(() => {
    const resolved = reports.filter((report) => report.status === "Resolved" && report.resolvedAt);
    if (resolved.length === 0) {
      return 0;
    }

    const totalDays = resolved.reduce((sum, report) => {
      const start = new Date(report.reportedAt).getTime();
      const end = new Date(report.resolvedAt ?? report.reportedAt).getTime();
      const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      return sum + days;
    }, 0);

    return Math.round((totalDays / resolved.length) * 10) / 10;
  }, [reports]);

  const heatZones = useMemo(() => {
    const zoneMap = new Map<string, number>();

    reports.forEach((report) => {
      const zone = report.locality.split(",")[0].trim();
      zoneMap.set(zone, (zoneMap.get(zone) ?? 0) + 1);
    });

    return [...zoneMap.entries()]
      .map(([zone, count]) => ({ zone, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [reports]);

  const maxZoneCount = heatZones[0]?.count ?? 1;

  const recentCompleted = useMemo(() => {
    return reports
      .filter((report) => report.status === "Resolved")
      .sort((a, b) => (b.resolvedAt ?? b.reportedAt).localeCompare(a.resolvedAt ?? a.reportedAt))
      .slice(0, 5);
  }, [reports]);

  const summary = {
    total: reports.length,
    critical: reports.filter((r) => r.priority === "Critical").length,
    resolved: reports.filter((r) => r.status === "Resolved").length,
    pending: reports.filter((r) => r.status !== "Resolved").length,
    overdue: reports.filter((r) => isOverdue(r.status, r.slaDueDate)).length
  };

  return (
    <section className="flow-stack">
      <article className="page-head">
        <p className="kicker">Admin Command Center</p>
        <h1>Road Maintenance Dashboard</h1>
        <p>
          Review incoming complaints, filter by issue type or status, and prioritize
          public-safety interventions.
        </p>
        <button type="button" className="btn btn-ghost" onClick={() => void onRefreshReports()}>
          Refresh Reports
        </button>
      </article>

      <section className="stat-grid">
        <article className="stat-card">
          <h2>{summary.total}</h2>
          <p>Total Reports</p>
        </article>
        <article className="stat-card">
          <h2>{summary.critical}</h2>
          <p>Critical Cases</p>
        </article>
        <article className="stat-card">
          <h2>{summary.pending}</h2>
          <p>Pending Resolution</p>
        </article>
        <article className="stat-card">
          <h2>{summary.resolved}</h2>
          <p>Resolved</p>
        </article>
        <article className="stat-card">
          <h2>{summary.overdue}</h2>
          <p>Overdue SLA</p>
        </article>
        <article className="stat-card">
          <h2>{averageRepairDays}</h2>
          <p>Avg Repair Days</p>
        </article>
      </section>

      <section className="heatmap-panel">
        <article className="page-head">
          <p className="kicker">Complaint Heatmap View</p>
          <h1>High Complaint Zones</h1>
        </article>
        <div className="heat-zone-list">
          {heatZones.map((zone) => (
            <div className="heat-zone-row" key={zone.zone}>
              <p>{zone.zone}</p>
              <div className="heat-zone-meter">
                <span style={{ width: `${(zone.count / maxZoneCount) * 100}%` }} />
              </div>
              <strong>{zone.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="solution-card">
        <h3>Recently Completed by Team</h3>
        <div className="leaderboard-list">
          {recentCompleted.length === 0 && (
            <p className="muted">No completed complaints yet.</p>
          )}
          {recentCompleted.map((report) => (
            <article key={`done-${report.id}`} className="leaderboard-item">
              <p>{report.id} - {report.issueType}</p>
              <p>{report.locality}</p>
              <p>Team: {report.assignedTeam} | Citizen: {report.reporterName}</p>
              <p>Completed: {report.resolvedAt ?? "Done"}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="filter-row">
        <label>
          Filter by Type
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as RoadIssueType | "All")}
          >
            <option>All</option>
            <option>Pothole</option>
            <option>Crack</option>
            <option>Drainage</option>
            <option>Road Marking</option>
            <option>Streetlight</option>
          </select>
        </label>

        <label>
          Filter by Status
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ReportStatus | "All")}
          >
            <option>All</option>
            <option>New</option>
            <option>In Review</option>
            <option>Assigned</option>
            <option>Resolved</option>
          </select>
        </label>
      </section>

      <section className="report-grid" aria-label="Filtered maintenance reports">
        {filteredReports.map((report) => (
          <article key={report.id} className="report-card">
            <img src={report.imageUrl} alt={report.issueType} loading="lazy" />
            <div className="report-card-body admin-card-body">
              <div className="admin-card-head">
                <h3>
                  {report.id} - {report.issueType}
                </h3>
                <strong className="admin-progress-number">{getProgressPercent(report.status)}%</strong>
              </div>

              <div className="chip-row">
                <span className={`chip chip-${report.priority.toLowerCase()}`}>
                  {report.priority}
                </span>
                <span className="chip chip-neutral">{report.status}</span>
                <span className="chip chip-neutral">Progress {getProgressPercent(report.status)}%</span>
              </div>

              <p className="admin-description">{report.description}</p>

              <div className="admin-meta-grid">
                <p>
                  <span>Citizen</span>
                  <strong>{report.reporterName}</strong>
                </p>
                <p>
                  <span>Location</span>
                  <strong>{report.locality}</strong>
                </p>
                <p>
                  <span>Assigned Team</span>
                  <strong>{report.assignedTeam}</strong>
                </p>
                <p>
                  <span>Recommended Action</span>
                  <strong>{report.recommendedAction}</strong>
                </p>
                <p>
                  <span>Upvotes</span>
                  <strong>{report.upvotes}</strong>
                </p>
                <p>
                  <span>Reported Date</span>
                  <strong>{report.reportedAt}</strong>
                </p>
              </div>

              <div className="progress-bar" aria-label="Report progress">
                <span style={{ width: `${getProgressPercent(report.status)}%` }} />
              </div>
              {isOverdue(report.status, report.slaDueDate) && (
                <p className="sla-alert">Overdue: SLA date {report.slaDueDate}</p>
              )}

              <div className="status-track" aria-label="Status timeline">
                {statusOrder.map((status) => (
                  <span
                    key={`${report.id}-${status}`}
                    className={
                      getStatusStep(report.status) >= getStatusStep(status)
                        ? "status-dot status-dot-active"
                        : "status-dot"
                    }
                  >
                    {status}
                  </span>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-ghost status-btn"
                onClick={async () => {
                  setStatusUpdatingId(report.id);
                  try {
                    await Promise.resolve(onAdvanceStatus(report.id));
                  } finally {
                    setStatusUpdatingId((current) => (current === report.id ? null : current));
                  }
                }}
                disabled={report.status === "Resolved" || statusUpdatingId === report.id}
              >
                {statusUpdatingId === report.id
                  ? "Updating..."
                  : report.status === "Resolved"
                  ? "Completed"
                  : `Move to ${nextStatus(report.status)}`}
              </button>

              {report.status === "Resolved" && (
                <div className="evidence-box">
                  <p className="muted evidence-title">Resolution Proof (URL or Upload)</p>
                  <div className="evidence-row">
                    <input
                      value={evidenceDrafts[report.id] ?? report.resolutionImageUrl ?? ""}
                      onChange={(event) =>
                        setEvidenceDrafts((prev) => ({
                          ...prev,
                          [report.id]: event.target.value
                        }))
                      }
                      placeholder="Paste resolved-road evidence image URL"
                    />
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        const value = (evidenceDrafts[report.id] ?? report.resolutionImageUrl ?? "").trim();
                        if (!value) {
                          return;
                        }
                        onUpdateResolutionEvidence(report.id, value);
                      }}
                    >
                      Save Proof
                    </button>
                  </div>

                  <div className="evidence-upload-row">
                    <label className="evidence-upload-label">
                      Upload Evidence Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          void handleEvidenceFileUpload(report.id, event.target.files?.[0]);
                        }}
                      />
                    </label>
                  </div>

                  {(evidenceDrafts[report.id] || report.resolutionImageUrl) && (
                    <img
                      className="evidence-preview"
                      src={evidenceDrafts[report.id] || report.resolutionImageUrl}
                      alt="Resolution evidence preview"
                    />
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}