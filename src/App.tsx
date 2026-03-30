import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ReportPage from "./pages/ReportPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import SuccessPage from "./pages/SuccessPage";
import LoginPage from "./pages/LoginPage";
import SolvedIssuesPage from "./pages/SolvedIssuesPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import type { ReportStatus, RoadReport } from "./types";
import {
  adminAuth,
  advanceReportStatus,
  citizenAuth,
  confirmReport,
  createReport,
  fetchReports,
  mapErrorToLoginResult,
  saveReportEvidence,
  type CitizenLoginPayload,
  type LoginResult,
  type SessionUser
} from "./api/roadfixApi";

type UserRole = "citizen" | "admin";

const authStorageKey = "roadfix_auth_role";
const legacyAdminAuthStorageKey = "roadfix_admin_auth";
const userSessionStorageKey = "roadfix_session_user";
const authTokenStorageKey = "roadfix_auth_token";
const reportsCacheStorageKey = "roadfix_reports_cache";

type ReportsCachePayload = {
  ownerKey: string;
  reports: RoadReport[];
};

function getReportsOwnerKey(user: Pick<SessionUser, "role" | "contact">): string {
  return `${user.role}:${user.contact}`;
}

function readCachedReports(user: SessionUser | null): RoadReport[] {
  if (!user) {
    return [];
  }

  const raw = sessionStorage.getItem(reportsCacheStorageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ReportsCachePayload;
    if (parsed.ownerKey !== getReportsOwnerKey(user) || !Array.isArray(parsed.reports)) {
      return [];
    }
    return parsed.reports;
  } catch {
    return [];
  }
}

function getNextStatus(current: ReportStatus): ReportStatus {
  if (current === "New") return "In Review";
  if (current === "In Review") return "Assigned";
  if (current === "Assigned") return "Resolved";
  return "Resolved";
}

export default function App() {
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    const savedRole = sessionStorage.getItem(authStorageKey);
    if (savedRole === "citizen" || savedRole === "admin") {
      return savedRole;
    }

    // Backward compatibility for previous admin-only session flag.
    if (sessionStorage.getItem(legacyAdminAuthStorageKey) === "true") {
      return "admin";
    }

    return null;
  });

  const isAuthenticated = userRole !== null;
  const isAdminAuthenticated = userRole === "admin";
  const [showProfileCard, setShowProfileCard] = useState<boolean>(false);

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => {
    const raw = sessionStorage.getItem(userSessionStorageKey);
    const savedToken = sessionStorage.getItem(authTokenStorageKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as SessionUser;
      if (!parsed.fullName || !parsed.contact || !parsed.role || !savedToken) {
        return null;
      }
      return {
        ...parsed,
        token: savedToken
      };
    } catch {
      return null;
    }
  });

  const [reports, setReports] = useState<RoadReport[]>(() => readCachedReports(sessionUser));

  const navItems = isAuthenticated
    ? isAdminAuthenticated
      ? [
          { to: "/", label: "Admin Dashboard" },
          { to: "/solved", label: "Solved Issues" }
        ]
      : [
          { to: "/", label: "Home" },
          { to: "/report", label: "Report" },
          { to: "/solved", label: "Solved Issues" }
        ]
    : [{ to: "/login", label: "Login" }];

  const loadReports = async (user: SessionUser) => {
    try {
      const freshReports = await fetchReports(user.token);
      setReports(freshReports);
      sessionStorage.setItem(
        reportsCacheStorageKey,
        JSON.stringify({ ownerKey: getReportsOwnerKey(user), reports: freshReports })
      );
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const syncReports = async () => {
      if (!sessionUser?.token) {
        setReports([]);
        return;
      }

      await loadReports(sessionUser);
    };

    void syncReports();
  }, [sessionUser]);

  useEffect(() => {
    if (!sessionUser) {
      return;
    }

    sessionStorage.setItem(
      reportsCacheStorageKey,
      JSON.stringify({ ownerKey: getReportsOwnerKey(sessionUser), reports })
    );
  }, [reports, sessionUser]);

  const persistSession = (nextUser: SessionUser) => {
    sessionStorage.setItem(authStorageKey, nextUser.role);
    sessionStorage.setItem(authTokenStorageKey, nextUser.token);
    sessionStorage.setItem(
      userSessionStorageKey,
      JSON.stringify({
        role: nextUser.role,
        fullName: nextUser.fullName,
        contact: nextUser.contact
      })
    );
    sessionStorage.removeItem(legacyAdminAuthStorageKey);
    setUserRole(nextUser.role);
    setSessionUser(nextUser);
    setReports(readCachedReports(nextUser));
  };

  const handleCitizenLogin = async (payload: CitizenLoginPayload): Promise<LoginResult> => {
    const contact = payload.contact.trim();
    if (!contact || !payload.password.trim()) {
      return { ok: false, message: "Please fill contact and password." };
    }

    if (payload.mode === "create" && !payload.fullName.trim()) {
      return { ok: false, message: "Please enter full name to create profile." };
    }

    try {
      const nextUser = await citizenAuth({
        ...payload,
        contact
      });
      persistSession(nextUser);
      await loadReports(nextUser);
      return { ok: true };
    } catch (error) {
      return mapErrorToLoginResult(error, "Citizen login failed.");
    }
  };

  const handleAdminLogin = async (password: string): Promise<LoginResult> => {
    try {
      const nextUser = await adminAuth(password);
      persistSession(nextUser);
      await loadReports(nextUser);
      return { ok: true };
    } catch (error) {
      return mapErrorToLoginResult(error, "Invalid admin password. Please try again.");
    }
  };

  const handleRefreshReports = async () => {
    if (!sessionUser?.token) {
      return;
    }
    await loadReports(sessionUser);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(authStorageKey);
    sessionStorage.removeItem(authTokenStorageKey);
    sessionStorage.removeItem(legacyAdminAuthStorageKey);
    sessionStorage.removeItem(userSessionStorageKey);
    sessionStorage.removeItem(reportsCacheStorageKey);
    setUserRole(null);
    setSessionUser(null);
    setReports([]);
    setShowProfileCard(false);
  };

  const handleCreateReport = async (newReport: RoadReport): Promise<RoadReport | null> => {
    if (!sessionUser?.token) {
      return null;
    }

    try {
      const created = await createReport(sessionUser.token, newReport);
      setReports((prevReports) => [created, ...prevReports]);
      return created;
    } catch {
      return null;
    }
  };

  const handleAdvanceStatus = async (reportId: string) => {
    if (!sessionUser?.token || sessionUser.role !== "admin") {
      return;
    }

    const report = reports.find((item) => item.id === reportId);
    if (!report) {
      return;
    }

    const nextStatus = getNextStatus(report.status);
    setReports((prevReports) =>
      prevReports.map((item) => {
        if (item.id !== reportId) {
          return item;
        }
        return {
          ...item,
          status: nextStatus,
          resolvedAt:
            nextStatus === "Resolved"
              ? new Date().toISOString().slice(0, 10)
              : item.resolvedAt
        };
      })
    );

    try {
      const updated = await advanceReportStatus(sessionUser.token, reportId, nextStatus);
      setReports((prevReports) =>
        prevReports.map((item) => (item.id === reportId ? updated : item))
      );
    } catch {
      await loadReports(sessionUser);
    }
  };

  const handleConfirmIssue = async (reportId: string) => {
    if (!sessionUser?.token) {
      return;
    }

    try {
      const updated = await confirmReport(sessionUser.token, reportId);
      setReports((prevReports) =>
        prevReports.map((item) => (item.id === reportId ? updated : item))
      );
    } catch {
      // ignore to keep home feed usable if confirm API fails
    }
  };

  const handleUpdateResolutionEvidence = async (reportId: string, resolutionImageUrl: string) => {
    if (!sessionUser?.token || sessionUser.role !== "admin") {
      return;
    }

    try {
      const updated = await saveReportEvidence(sessionUser.token, reportId, resolutionImageUrl);
      setReports((prevReports) =>
        prevReports.map((item) => (item.id === reportId ? updated : item))
      );
    } catch {
      // ignore to keep admin flow stable during temporary backend issues
    }
  };

  return (
    <div className={isAuthenticated ? "app-shell" : "app-shell login-mode"}>
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
          {isAuthenticated && (
            <button
              type="button"
              className="profile-fab"
              onClick={() => setShowProfileCard((prev) => !prev)}
              aria-label="Open profile"
              title="Profile"
            >
              {sessionUser?.fullName?.[0]?.toUpperCase() ?? "U"}
            </button>
          )}
          {isAuthenticated && (
            <button type="button" className="btn btn-ghost nav-logout" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </header>

      {isAuthenticated && showProfileCard && sessionUser && (
        <aside className="profile-popover" aria-label="User profile card">
          <p className="profile-name">{sessionUser.fullName}</p>
          <p className="profile-meta">Role: {sessionUser.role === "admin" ? "Admin" : "Citizen"}</p>
          <p className="profile-meta">Contact: {sessionUser.contact}</p>
        </aside>
      )}

      <main className="page-container">
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                isAdminAuthenticated ? (
                  <AdminDashboardPage
                    reports={reports}
                    onAdvanceStatus={handleAdvanceStatus}
                    onUpdateResolutionEvidence={handleUpdateResolutionEvidence}
                    onRefreshReports={handleRefreshReports}
                  />
                ) : (
                  <HomePage
                    reportsCount={reports.length}
                    reports={reports}
                    onConfirmIssue={handleConfirmIssue}
                  />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/report"
            element={
              isAuthenticated && !isAdminAuthenticated ? (
                <ReportPage existingReports={reports} onCreateReport={handleCreateReport} />
              ) : (
                <Navigate to={isAuthenticated ? "/" : "/login"} replace />
              )
            }
          />
          <Route
            path="/admin"
            element={
              isAdminAuthenticated ? (
                <AdminDashboardPage
                  reports={reports}
                  onAdvanceStatus={handleAdvanceStatus}
                  onUpdateResolutionEvidence={handleUpdateResolutionEvidence}
                  onRefreshReports={handleRefreshReports}
                />
              ) : (
                <Navigate to={isAuthenticated ? "/" : "/login"} replace />
              )
            }
          />
          <Route
            path="/solved"
            element={
              isAuthenticated ? <SolvedIssuesPage reports={reports} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/login"
            element={
              <LoginPage
                onLogin={handleCitizenLogin}
                isAuthenticated={isAuthenticated}
                isAdminAuthenticated={isAdminAuthenticated}
              />
            }
          />
          <Route
            path="/admin-login"
            element={
              <AdminLoginPage
                onLogin={handleAdminLogin}
                isAuthenticated={isAuthenticated}
                isAdminAuthenticated={isAdminAuthenticated}
              />
            }
          />
          <Route
            path="/success"
            element={isAuthenticated ? <SuccessPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
          />
        </Routes>
      </main>

      <footer className="site-footer">
        <p>Built for faster road issue tracking, transparent status, and safer daily commute.</p>
      </footer>
    </div>
  );
}