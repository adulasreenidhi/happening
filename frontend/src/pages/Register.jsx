import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/auth";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(e) {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please verify both fields.");
      return;
    }

    setSubmitting(true);
    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      navigate("/login", {
        replace: true,
        state: { message: "Your account is ready. Please log in to start exploring." },
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn’t create your account. Please review your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrapper container">
      <div className="auth-split-card">
        {/* Left Editorial Brand Panel */}
        <aside className="auth-brand-panel">
          <div className="auth-brand-content">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              JOIN HAPPENING
            </span>
            <h1 className="auth-brand-heading">
              Show up for<br />
              <em>something good.</em>
            </h1>
            <p className="auth-brand-text">
              Create an attendee account to discover upcoming experiences, book tickets,
              save your favorite events, and share honest reviews.
            </p>
          </div>

          <div className="auth-brand-footer">
            <span className="auth-mark-icon" aria-hidden="true">H</span>
            <span>HAPPENING Community</span>
          </div>
        </aside>

        {/* Right Clean Registration Form */}
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h2>Create your account</h2>
            <p>Fill in your details below to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate={false}>
            <div className="form-field">
              <span>Full name</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                value={form.name}
                onChange={updateField}
                placeholder="Jane Doe"
              />
            </div>

            <div className="form-field">
              <span>Email address</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength={254}
                value={form.email}
                onChange={updateField}
                placeholder="jane@example.com"
              />
            </div>

            <div className="form-field">
              <span>Phone number</span>
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                required
                minLength={7}
                maxLength={20}
                pattern="\+?[0-9\(\)\s\-]{7,20}"
                value={form.phone}
                onChange={updateField}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="form-field">
              <span>
                Password
                <small>Minimum 8 characters</small>
              </span>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={form.password}
                onChange={updateField}
                placeholder="Create a strong password"
              />
            </div>

            <div className="form-field">
              <span>Confirm password</span>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={form.confirmPassword}
                onChange={updateField}
                placeholder="Repeat your password"
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
              {submitting ? "Creating account…" : "Create account"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="auth-footer-switch">
            <span>Already have an account?</span>
            <Link to="/login" className="text-link">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
