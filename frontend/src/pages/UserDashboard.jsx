import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getMyBookings, getMyFavorites, getMyReviews } from "../services/platform";

function UserDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ bookings: 0, favorites: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getMyBookings(), getMyFavorites(), getMyReviews()])
      .then(([bookings, favorites, reviews]) => {
        if (active) {
          setSummary({
            bookings: bookings.data.length,
            favorites: favorites.data.length,
            reviews: reviews.data.length,
          });
        }
      })
      .catch(() => {
        if (active) setError("Your dashboard could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="user-dashboard-page container">
      {/* Header */}
      <div className="dashboard-welcome-header">
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          ATTENDEE HUB
        </span>
        <h1>Welcome back, <em>{user?.name}.</em></h1>
        <p>Your upcoming plans, saved events, and community reviews in one calm space.</p>
      </div>

      {error && (
        <div className="state-panel error-message" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="state-message" role="status">Loading your activity…</p>
      ) : (
        <>
          {/* Activity Summary Metric Blocks (Event-focused, not SaaS KPIs) */}
          <div className="hub-metrics-grid">
            <Link to="/my-bookings" className="hub-metric-card">
              <div className="metric-icon-wrap" aria-hidden="true">🎫</div>
              <div className="metric-content">
                <span className="metric-label">Confirmed Bookings</span>
                <strong className="metric-value">{summary.bookings}</strong>
                <span className="metric-link-text">Manage registrations →</span>
              </div>
            </Link>

            <Link to="/my-favorites" className="hub-metric-card">
              <div className="metric-icon-wrap" aria-hidden="true">♥</div>
              <div className="metric-content">
                <span className="metric-label">Saved Events</span>
                <strong className="metric-value">{summary.favorites}</strong>
                <span className="metric-link-text">View saved events →</span>
              </div>
            </Link>

            <Link to="/my-reviews" className="hub-metric-card">
              <div className="metric-icon-wrap" aria-hidden="true">★</div>
              <div className="metric-content">
                <span className="metric-label">Your Reviews</span>
                <strong className="metric-value">{summary.reviews}</strong>
                <span className="metric-link-text">Read past reviews →</span>
              </div>
            </Link>
          </div>

          {/* Quick Actions Panel */}
          <div className="hub-actions-section">
            <div className="section-heading">
              <div>
                <h2>Quick actions</h2>
                <p>Jump directly to discovery or event exploration tools.</p>
              </div>
            </div>

            <div className="hub-quick-actions-row">
              <Link className="button button-dark" to="/events">
                Explore What’s On Now <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button-light" to="/my-bookings">
                View Ticket Bookings
              </Link>
              <Link className="button button-light" to="/assistant">
                Ask AI Event Assistant ✦
              </Link>
              <Link className="button button-light" to="/account">
                Profile Settings
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default UserDashboard;
