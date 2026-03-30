import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

interface LoginResult {
  ok: boolean;
  message?: string;
}

interface AdminLoginPageProps {
  onLogin: (password: string) => Promise<LoginResult> | LoginResult;
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
}

export default function AdminLoginPage({
  onLogin,
  isAuthenticated,
  isAdminAuthenticated
}: AdminLoginPageProps) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={isAdminAuthenticated ? "/" : "/"} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const result = await onLogin(password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message ?? "Unable to login as admin.");
      return;
    }

    setError("");
    navigate("/");
  };

  return (
    <section className="login-wrap">
      <article className="login-card">
        <p className="kicker">Restricted Access</p>
        <h1>Admin Login</h1>
        <p className="login-copy">
          Authorized municipal staff can access the complaint operations dashboard.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Admin Password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary login-submit" disabled={submitting}>
            {submitting ? "Please wait..." : "Access Dashboard"}
          </button>
        </form>
      </article>
    </section>
  );
}
