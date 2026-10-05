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

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Your passwords don’t match.");
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
        state: { message: "Your account is ready. Log in to start exploring." },
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn’t create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-layout register-layout">
      <div className="auth-aside">
        <span className="eyebrow">YOUR NEXT STORY STARTS HERE</span>
        <h1>Show up for something <em>good.</em></h1>
        <p>Make an account and find your next favourite thing to do.</p>
        <span className="auth-aside-mark">H.</span>
      </div>
      <div className="auth-card">
        <span className="eyebrow">COME ON IN</span>
        <h2>Create your account</h2>
        <form onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Your name</span>
            <input type="text" name="name" autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={updateField} placeholder="What should we call you?" />
          </label>
          <label className="form-field">
            <span>Email address</span>
            <input type="email" name="email" autoComplete="email" required maxLength={254} value={form.email} onChange={updateField} placeholder="you@example.com" />
          </label>
          <label className="form-field">
            <span>Phone number</span>
            <input type="tel" name="phone" autoComplete="tel" required minLength={7} maxLength={20} pattern="\+?[0-9\(\)\s\-]{7,20}" value={form.phone} onChange={updateField} placeholder="+91 98765 43210" />
          </label>
          <label className="form-field">
            <span>Password <small>At least 8 characters</small></span>
            <input type="password" name="password" autoComplete="new-password" required minLength={8} maxLength={72} value={form.password} onChange={updateField} placeholder="Create a password" />
          </label>
          <label className="form-field">
            <span>Confirm password</span>
            <input type="password" name="confirmPassword" autoComplete="new-password" required minLength={8} maxLength={72} value={form.confirmPassword} onChange={updateField} placeholder="Type it again" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"} <span aria-hidden="true">↗</span>
          </button>
        </form>
        <p className="auth-switch">Already a member? <Link to="/login">Log in</Link></p>
      </div>
    </section>
  );
}

export default Register;
