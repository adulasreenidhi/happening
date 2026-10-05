import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyReviews } from "../services/platform";

function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getMyReviews()
      .then(({ data }) => {
        if (active) setReviews(data);
      })
      .catch(() => {
        if (active) setError("Your reviews could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="state-message" role="status">Loading your reviews…</p>;

  return (
    <section className="section dashboard-page">
      <span className="eyebrow">YOUR EXPERIENCES</span>
      <h1>My <em>reviews.</em></h1>
      {error && <p className="error-message" role="alert">{error}</p>}
      {reviews.length === 0 ? (
        <div className="empty-state"><h2>No reviews yet.</h2><p>After attending an event, share what made it special.</p><Link className="text-link" to="/events">Explore events <span>↗</span></Link></div>
      ) : (
        <div className="dashboard-list">
          {reviews.map((review) => (
            <article className="dashboard-list-row" key={review.id}>
              <div><strong><Link to={`/events/${review.eventId}`}>View event</Link></strong>{review.comment && <span>{review.comment}</span>}</div>
              <span>★ {review.rating}/5 · {new Date(review.createdAt).toLocaleDateString()}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyReviews;
