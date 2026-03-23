import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface SuccessState {
  id?: string;
  issueType?: string;
  locality?: string;
  recommendedAction?: string;
}

export default function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as SuccessState | null) ?? {};
  const [counter, setCounter] = useState(8);

  useEffect(() => {
    if (counter <= 0) {
      navigate("/");
      return;
    }

    const timer = setTimeout(() => setCounter((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [counter, navigate]);

  const reportId = useMemo(() => state.id ?? "RM-0000", [state.id]);

  return (
    <section className="success-wrap">
      <article className="success-card">
        <p className="success-icon" aria-hidden="true">
          ✓
        </p>
        <h1>Report Submitted Successfully</h1>
        <p>
          Your complaint has been recorded and shared with the local road maintenance
          authority.
        </p>

        <div className="success-details">
          <p>
            <strong>Reference:</strong> {reportId}
          </p>
          <p>
            <strong>Issue Type:</strong> {state.issueType ?? "General Road Damage"}
          </p>
          <p>
            <strong>Location:</strong> {state.locality ?? "Not specified"}
          </p>
          <p>
            <strong>Predicted Action:</strong> {state.recommendedAction ?? "Normal priority"}
          </p>
        </div>

        <p className="redirect-note">Redirecting to home in {counter}s...</p>

        <div className="cta-row">
          <Link className="btn btn-primary" to="/">
            Go Home Now
          </Link>
          <Link className="btn btn-ghost" to="/report">
            Submit Another Report
          </Link>
        </div>
      </article>
    </section>
  );
}