import { useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { mockReports } from "./data/mockReports";
import HomePage from "./pages/HomePage";
import ReportPage from "./pages/ReportPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import SuccessPage from "./pages/SuccessPage";
import LoginPage from "./pages/LoginPage";
import type { ReportStatus, RoadReport } from "./types";

const authStorageKey = "roadfix_admin_auth";
const reportsStorageKey = "roadfix_reports";

export default function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem(authStorageKey) === "true";
  });

  const [reports, setReports] = useState<RoadReport[]>(() => {
    const savedReports = localStorage.getItem(reportsStorageKey);
    if (!savedReports) {
      return mockReports;
    }

    try {
      const parsed = JSON.parse(savedReports) as Partial<RoadReport>[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return mockReports;
      }

      return parsed.map((report, index) => ({
        id: report.id ?? `RM-L${1000 + index}`,
        reporterName: report.reporterName ?? "Citizen Reporter",
        issueType: report.issueType ?? "Pothole",
        description: report.description ?? "Road issue reported by citizen.",
        locality: report.locality ?? "Unknown locality",
        latitude: report.latitude ?? 0,
        longitude: report.longitude ?? 0,
        channel: report.channel ?? "Web",
        priority: report.priority ?? "Medium",
        aiSuggestedPriority: report.aiSuggestedPriority ?? report.priority ?? "Medium",
        aiInsights: report.aiInsights ?? [{ label: "Surface Wear", confidence: 0.55 }],
        recommendedAction:
          report.recommendedAction ?? "Plan repair within 3 to 5 days",
        status: report.status ?? "New",
        assignedTeam: report.assignedTeam ?? "Central Ops Team B",
        upvotes: report.upvotes ?? 0,
        reportedAt: report.reportedAt ?? new Date().toISOString().slice(0, 10),
        resolvedAt: report.resolvedAt,
        slaDueDate: report.slaDueDate ?? new Date().toISOString().slice(0, 10),
        imageUrl:
          report.imageUrl ??
          "https://images.unsplash.com/photo-1593766788305-88f8f2184a82?auto=format&fit=crop&w=900&q=60"
      }));
    } catch {
      return mockReports;
    }
  });

  const navItems = isAdminAuthenticated
    ? [
        { to: "/", label: "Home" },
        { to: "/report", label: "Report" },
        { to: "/admin", label: "Admin Dashboard" }
      ]
    : [{ to: "/login", label: "Login" }];

  const handleLogin = (username: string, password: string) => {
    const isValid = username.trim().toLowerCase() === "admin" && password === "roadfix123";
    if (isValid) {
      sessionStorage.setItem(authStorageKey, "true");
      setIsAdminAuthenticated(true);
    }
    return isValid;
  };

  const handleLogout = () => {
    sessionStorage.removeItem(authStorageKey);
    setIsAdminAuthenticated(false);
  };

  const handleCreateReport = (newReport: RoadReport) => {
    setReports((prevReports) => {
      const updated = [newReport, ...prevReports];
      localStorage.setItem(reportsStorageKey, JSON.stringify(updated));
      return updated;
    });
  };

  const handleAdvanceStatus = (reportId: string) => {
    setReports((prevReports) => {
      const updated = prevReports.map((report) => {
        if (report.id !== reportId) {
          return report;
        }

        const nextStatus: ReportStatus =
          report.status === "New"
            ? "In Review"
            : report.status === "In Review"
              ? "Assigned"
              : report.status === "Assigned"
                ? "Resolved"
                : "Resolved";

        return {
          ...report,
          status: nextStatus,
          resolvedAt:
            nextStatus === "Resolved"
              ? new Date().toISOString().slice(0, 10)
              : report.resolvedAt
        };
      });

      localStorage.setItem(reportsStorageKey, JSON.stringify(updated));
      return updated;
    });
  };

  const handleConfirmIssue = (reportId: string) => {
    setReports((prevReports) => {
      const updated = prevReports.map((report) => {
        if (report.id !== reportId) {
          return report;
        }
        return { ...report, upvotes: report.upvotes + 1 };
      });

      localStorage.setItem(reportsStorageKey, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className={isAdminAuthenticated ? "app-shell" : "app-shell login-mode"}>
      <header className="top-nav">
        <div className="brand-wrap">
          <div className="brand-mark" aria-hidden="true">
            RF
          </div>
          <div>
            <p className="brand-title">RoadFix Citizen Portal</p>
            <p className="brand-sub">E-Governance for Road Safety</p>
          </div>
        </div>

        <nav className="nav-links" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
          {isAdminAuthenticated && (
            <button type="button" className="btn btn-ghost nav-logout" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </header>

      <main className="page-container">
        <Routes>
          <Route
            path="/"
            element={
              isAdminAuthenticated ? (
                <HomePage
                  reportsCount={reports.length}
                  reports={reports}
                  onConfirmIssue={handleConfirmIssue}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/report"
            element={
              isAdminAuthenticated ? (
                <ReportPage existingReports={reports} onCreateReport={handleCreateReport} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin"
            element={
              isAdminAuthenticated ? (
                <AdminDashboardPage reports={reports} onAdvanceStatus={handleAdvanceStatus} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              <LoginPage onLogin={handleLogin} isAuthenticated={isAdminAuthenticated} />
            }
          />
          <Route
            path="/success"
            element={isAdminAuthenticated ? <SuccessPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="*"
            element={<Navigate to={isAdminAuthenticated ? "/" : "/login"} replace />}
          />
        </Routes>
      </main>

      <footer className="site-footer">
        <p>Built for faster road issue tracking, transparent status, and safer daily commute.</p>
      </footer>
    </div>
  );
}