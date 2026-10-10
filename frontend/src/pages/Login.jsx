import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { loginUser } from "../services/auth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/account", { replace: true });
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await loginUser({ email, password });
      login(data);
      navigate(location.state?.from?.pathname || "/account", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn’t sign you in. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrapper container">
      <div className="auth-split-card">
        {/* Left Editorial Brand Panel (Warm Light Editorial) */}
        <aside className="auth-brand-panel">
          <div className="auth-brand-content">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              WELCOME BACK
            </span>
            <h1 className="auth-brand-heading">
              There’s a whole city<br />
              <em>out there.</em>
            </h1>
            <p className="auth-brand-text">
              Sign in to manage your registrations, revisit your saved events, and discover what’s happening next.
            </p>
          </div>

          <div className="auth-brand-footer">
            <span className="auth-mark-icon" aria-hidden="true">H</span>
            <span>HAPPENING Platform</span>
          </div>
        </aside>

        {/* Right Clean Authentication Form */}
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h2>Sign in to your account</h2>
            <p>Enter your email and password to continue</p>
          </div>

          {location.state?.message && (
            <div className="form-success" role="status">
              {location.state.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate={false}>
            <div className="form-field">
              <span>Email address</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="form-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="button button-dark btn-lg auth-submit-btn"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in to HAPPENING"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="auth-footer-switch">
            <span>Don’t have an account yet?</span>
            <Link to="/register" className="text-link">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
