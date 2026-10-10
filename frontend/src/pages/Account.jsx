import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import StatusBadge from "../components/StatusBadge";

function Account() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="account-page container container-narrow">
      <div className="page-heading">
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          ACCOUNT PROFILE
        </span>
        <h1>Personal <em>settings.</em></h1>
        <p>Review your personal information and associated platform credentials.</p>
      </div>

      <div className="profile-identity-card">
        <div className="profile-header-strip">
          <div className="profile-avatar-large">
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="profile-names">
            <h2>{user.name}</h2>
            <span className="profile-role-badge">
              <StatusBadge status="ACTIVE" label={user.role} />
            </span>
          </div>
        </div>

        <div className="profile-details-grid">
          <div className="profile-detail-item">
            <span className="detail-label">Full Name</span>
            <strong className="detail-value">{user.name}</strong>
          </div>

          <div className="profile-detail-item">
            <span className="detail-label">Email Address</span>
            <strong className="detail-value">{user.email}</strong>
          </div>

          <div className="profile-detail-item">
            <span className="detail-label">Phone Number</span>
            <strong className="detail-value">{user.phone}</strong>
          </div>

          <div className="profile-detail-item">
            <span className="detail-label">Account Role</span>
            <strong className="detail-value">{user.role}</strong>
          </div>
        </div>

        <div className="profile-card-footer">
          <p className="profile-notice">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Personal contact details are currently managed securely by platform administrators.
          </p>
        </div>
      </div>

      {/* Relevant Navigation Shortcuts Based on Role */}
      <div className="account-navigation-panel">
        <h3>Connected Workspaces</h3>
        <div className="account-links-row">
          {user.role === "USER" && (
            <>
              <Link className="button button-light btn-sm" to="/dashboard">
                Personal Dashboard →
              </Link>
              <Link className="button button-light btn-sm" to="/my-bookings">
                My Bookings →
              </Link>
              <Link className="button button-light btn-sm" to="/my-favorites">
                Saved Events →
              </Link>
              <Link className="button button-light btn-sm" to="/my-reviews">
                My Reviews →
              </Link>
            </>
          )}

          {["ORGANIZER", "ADMIN"].includes(user.role) && (
            <Link className="button button-dark btn-sm" to="/organizer">
              Open Organizer Studio →
            </Link>
          )}

          {user.role === "ADMIN" && (
            <Link className="button button-dark btn-sm" to="/admin">
              Open Platform Administration →
            </Link>
          )}

          <Link className="button button-light btn-sm" to="/events">
            Explore Events →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Account;
