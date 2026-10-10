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
        if (active) setError("Your reviews could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="section container">
        <p className="state-message" role="status">Loading your reviews…</p>
      </div>
    );
  }

  return (
    <div className="reviews-page container container-narrow">
      <div className="page-heading">
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          COMMUNITY FEEDBACK
        </span>
        <h1>My <em>reviews.</em></h1>
        <p>A personal record of the events you’ve attended and reviewed.</p>
      </div>

      {error && (
        <div className="state-panel error-message" role="alert">
          {error}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">★</div>
          <h2>No reviews written yet.</h2>
          <p>After you attend an event, you can share feedback to guide fellow community members.</p>
          <Link className="button button-dark" to="/events">
            Find an event to attend →
          </Link>
        </div>
      ) : (
        <div className="editorial-reviews-stream">
          {reviews.map((review) => (
            <article className="editorial-review-item" key={review.id}>
              <div className="review-item-header">
                <div className="review-event-link-wrap">
                  <span className="review-eyebrow">REVIEWED EVENT</span>
                  <Link className="review-event-link" to={`/events/${review.eventId}`}>
                    View event details →
                  </Link>
                </div>

                <div className="review-rating-badge">
                  <span className="review-stars-display" aria-label={`${review.rating} out of 5 stars`}>
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </span>
                  <span className="review-date-label">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : ""}
                  </span>
                </div>
              </div>

              {review.comment ? (
                <p className="review-body-text">{review.comment}</p>
              ) : (
                <p className="review-empty-comment">Rating submitted without additional written commentary.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyReviews;
