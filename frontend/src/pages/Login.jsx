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

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await loginUser({ email, password });
      login(data);
      navigate(location.state?.from?.pathname || "/account", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn’t sign you in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-aside">
        <span className="eyebrow">GOOD TO HAVE YOU BACK</span>
        <h1>There’s a whole city out <em>there.</em></h1>
        <p>Pick up where your next great story begins.</p>
        <span className="auth-aside-mark">H.</span>
      </div>
      <div className="auth-card">
        <span className="eyebrow">WELCOME BACK</span>
        <h2>Log in to HAPPENING</h2>
        {location.state?.message && <p className="form-success" role="status">{location.state.message}</p>}
        <form onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Email address</span>
            <input type="email" name="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </label>
          <label className="form-field">
            <span>Password</span>
            <input type="password" name="password" autoComplete="current-password" required maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"} <span aria-hidden="true">↗</span>
          </button>
        </form>
        <p className="auth-switch">New around here? <Link to="/register">Create an account</Link></p>
      </div>
    </section>
  );
}

export default Login;
