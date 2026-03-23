import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

interface LoginPageProps {
  onLogin: (username: string, password: string) => boolean;
  isAuthenticated: boolean;
}

export default function LoginPage({ onLogin, isAuthenticated }: LoginPageProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isValid = onLogin(username, password);

    if (!isValid) {
      setError("Invalid credentials. Please use the admin credentials.");
      return;
    }

    setError("");
    navigate("/");
  };

  return (
    <section className="login-wrap">
      <article className="login-card">
        <p className="kicker">Secure Access</p>
        <h1>Admin Login</h1>
        <p className="login-copy">
          Login first to access Home, Report, and Admin Dashboard in the citizen portal.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
            />
          </label>

          <label>
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary login-submit">
            Login
          </button>
        </form>

        <div className="login-help">
          <p>Demo credentials: username admin, password roadfix123</p>
        </div>
      </article>
    </section>
  );
}
