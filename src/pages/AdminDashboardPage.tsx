import { useMemo, useState } from "react";
import { isOverdue } from "../utils/reportIntelligence";
import type { ReportStatus, RoadIssueType, RoadReport } from "../types";

interface AdminDashboardPageProps {
  reports: RoadReport[];
  onAdvanceStatus: (reportId: string) => void;
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

export default function AdminDashboardPage({ reports, onAdvanceStatus }: AdminDashboardPageProps) {
  const [filterType, setFilterType] = useState<RoadIssueType | "All">("All");
  const [filterStatus, setFilterStatus] = useState<ReportStatus | "All">("All");

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
            <div className="report-card-body">
              <div className="chip-row">
                <span className={`chip chip-${report.priority.toLowerCase()}`}>
                  {report.priority}
                </span>
                <span className="chip chip-neutral">{report.status}</span>
              </div>
              <h3>
                {report.id} - {report.issueType}
              </h3>
              <p>{report.description}</p>
              <p className="muted">{report.locality}</p>
              <p className="muted">Assigned: {report.assignedTeam}</p>
              <p className="muted">AI Action: {report.recommendedAction}</p>
              <p className="muted">Upvotes: {report.upvotes}</p>
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
                onClick={() => onAdvanceStatus(report.id)}
                disabled={report.status === "Resolved"}
              >
                {report.status === "Resolved"
                  ? "Completed"
                  : `Move to ${nextStatus(report.status)}`}
              </button>
              <p className="muted">Reported: {report.reportedAt}</p>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}