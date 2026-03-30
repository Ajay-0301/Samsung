import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

type CitizenAuthMode = "create" | "login";

type LoginPayload = {
  mode: CitizenAuthMode;
  fullName: string;
  contact: string;
  password: string;
};

interface LoginResult {
  ok: boolean;
  message?: string;
}

interface LoginPageProps {
  onLogin: (payload: LoginPayload) => Promise<LoginResult> | LoginResult;
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
}

export default function LoginPage({
  onLogin,
  isAuthenticated,
  isAdminAuthenticated
}: LoginPageProps) {
  const navigate = useNavigate();
  const [citizenMode, setCitizenMode] = useState<CitizenAuthMode>("create");
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const payload: LoginPayload = {
      mode: citizenMode,
      fullName,
      contact,
      password
    };

    const result = await onLogin(payload);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message ?? "Unable to login. Please try again.");
      return;
    }

    setError("");
    navigate("/");
  };

  return (
    <section className="login-wrap">
      <article className="login-card">
        <p className="kicker">Secure Access</p>
        <h1>Citizen Access</h1>
        <p className="login-copy">
          Create your citizen profile or login to track and report road complaints.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="mode-switch" role="group" aria-label="Citizen auth mode">
            <button
              type="button"
              className={citizenMode === "create" ? "mode-btn mode-btn-active" : "mode-btn"}
              onClick={() => {
                setCitizenMode("create");
                setError("");
              }}
            >
              Create Profile
            </button>
            <button
              type="button"
              className={citizenMode === "login" ? "mode-btn mode-btn-active" : "mode-btn"}
              onClick={() => {
                setCitizenMode("login");
                setError("");
              }}
            >
              Citizen Login
            </button>
          </div>

          {citizenMode === "create" && (
            <label>
              Citizen Name
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </label>
          )}

          <label>
            Email ID or Phone Number
            <input
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="name@email.com or 9876543210"
            />
          </label>

          <label>
            {citizenMode === "create" ? "Create Password" : "Password"}
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={citizenMode === "create" ? "Create a strong password" : "Enter your password"}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary login-submit" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : citizenMode === "create"
                ? "Create Profile & Login"
                : "Continue"}
          </button>
        </form>

        <div className="login-help">
          <p>Citizen: profile uses name + email/phone + password</p>
          <Link className="btn btn-ghost" to="/admin-login">
            Admin Login
          </Link>
        </div>
      </article>
    </section>
  );
}
