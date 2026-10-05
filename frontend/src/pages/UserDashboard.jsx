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
    <section className="section dashboard-page">
      <span className="eyebrow">YOUR HAPPENING</span>
      <h1>Welcome back, <em>{user.name}.</em></h1>
      <p>Keep your plans, saved events and reviews in one place.</p>
      {error && <p className="error-message" role="alert">{error}</p>}
      {loading ? (
        <p className="state-message" role="status">Loading your dashboard…</p>
      ) : (
        <>
          <div className="dashboard-stat-grid">
            <article><span>Bookings</span><strong>{summary.bookings}</strong></article>
            <article><span>Favorites</span><strong>{summary.favorites}</strong></article>
            <article><span>Reviews</span><strong>{summary.reviews}</strong></article>
          </div>
          <div className="dashboard-shortcuts">
            <Link className="button button-dark" to="/my-bookings">My bookings <span>↗</span></Link>
            <Link className="button button-light" to="/my-favorites">My favorites <span>↗</span></Link>
            <Link className="button button-light" to="/my-reviews">My reviews <span>↗</span></Link>
            <Link className="button button-light" to="/assistant">Ask the event assistant <span>↗</span></Link>
          </div>
        </>
      )}
    </section>
  );
}

export default UserDashboard;
