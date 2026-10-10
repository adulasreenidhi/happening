import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createReview, getEvent, getReviews } from "../services/events";
import { bookEvent } from "../services/platform";
import { useAuth } from "../context/useAuth";
import FavoriteButton from "../components/FavoriteButton";
import StatusBadge from "../components/StatusBadge";

function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [result, setResult] = useState({ id: null, event: null, error: "" });
  const [reviews, setReviews] = useState({ averageRating: 0, ratingCount: 0, reviews: [] });
  const [quantity, setQuantity] = useState(1);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [review, setReview] = useState({ rating: "5", comment: "" });
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getEvent(id), getReviews(id)])
      .then(([eventResult, reviewResult]) => {
        if (active) {
          setResult({ id, event: eventResult.data, error: "" });
          setReviews(reviewResult.data);
        }
      })
      .catch((requestError) => {
        if (active) {
          const error = requestError.response?.status === 404
            ? "We couldn’t find that event."
            : "We couldn’t load this event. Please try again.";
          setResult({ id, event: null, error });
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  const loading = result.id !== id;
  const event = loading ? null : result.event;
  const error = loading ? "" : result.error;

  if (loading) {
    return (
      <div className="section container">
        <p className="state-message" role="status">Loading event details…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section container">
        <div className="state-panel error-message" role="alert">
          <h2>{error}</h2>
          <p>The event listing may have been moved or removed.</p>
          <Link className="button button-dark btn-sm" to="/events">
            Browse all events
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(`${event.date}T${event.time || "00:00:00"}`);
  const isValidDate = !Number.isNaN(eventDate.getTime());
  const eventHasStarted = isValidDate && eventDate <= new Date();
  const isFree = Number(event.price) === 0;
  const isSoldOut = event.availableSeats < 1;
  const ticketTotal = (Number(event.price) * Number(quantity)).toFixed(2);

  async function handleBooking(e) {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError("");
    setBookingMessage("");
    try {
      const { data } = await bookEvent(event.id, Number(quantity));
      setBookingMessage(`Booking confirmed for ${data.quantity} ticket${data.quantity === 1 ? "" : "s"}. Total: ₹${data.totalAmount}.`);
      try {
        const latest = await getEvent(id);
        setResult({ id, event: latest.data, error: "" });
      } catch {
        setBookingError("Your booking succeeded, but availability could not be refreshed.");
      }
    } catch (requestError) {
      setBookingError(requestError.response?.data?.message ?? "Booking could not be completed. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  }

  async function handleReview(e) {
    e.preventDefault();
    setReviewError("");
    setReviewMessage("");
    try {
      await createReview(event.id, { ...review, rating: Number(review.rating) });
      setReviewMessage("Thank you for sharing your review.");
      const { data } = await getReviews(id);
      setReviews(data);
      setReview({ rating: "5", comment: "" });
    } catch (requestError) {
      setReviewError(requestError.response?.data?.message ?? "Review could not be submitted.");
    }
  }

  return (
    <div className="event-detail-page container">
      {/* Back Link */}
      <nav className="detail-breadcrumb" aria-label="Breadcrumb">
        <Link className="text-link" to="/events">
          ← Back to all events
        </Link>
      </nav>

      {/* Main 2-Column Editorial Detail Layout */}
      <div className="detail-layout">
        {/* Left Column: Media, Information, Description, Reviews */}
        <div className="detail-main-column">
          {/* Hero Media */}
          <div className="detail-hero-media">
            {event.imageUrl ? (
              <img
                className="detail-hero-image"
                src={event.imageUrl}
                alt={event.title}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="detail-image-fallback"
              style={{ display: event.imageUrl ? "none" : "flex" }}
            >
              <span>{event.categoryName || "HAPPENING"}</span>
              <p>{event.cityName || "CITY EVENT"}</p>
            </div>

            <div className="detail-favorite-overlay">
              <FavoriteButton eventId={event.id} />
            </div>
          </div>

          {/* Heading Header */}
          <div className="detail-header">
            <div className="detail-tag-row">
              <span className="category-tag">{event.categoryName || "City Event"}</span>
              {event.cityName && (
                <span className="badge badge-neutral">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {event.cityName}
                </span>
              )}
              {event.status && event.status !== "APPROVED" && (
                <StatusBadge status={event.status} />
              )}
            </div>

            <h1 className="detail-title">{event.title}</h1>

            {/* Ratings Summary */}
            <div className="detail-rating-row">
              <span className="rating-stars" aria-hidden="true">
                {"★".repeat(Math.round(reviews.averageRating || 0))}
                {"☆".repeat(5 - Math.round(reviews.averageRating || 0))}
              </span>
              <span className="rating-score">
                {reviews.averageRating ? reviews.averageRating.toFixed(1) : "No ratings"}
              </span>
              <span className="rating-count">
                ({reviews.ratingCount} {reviews.ratingCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>

          {/* Facts Strip */}
          <div className="detail-facts-strip">
            <div className="fact-item">
              <span className="fact-icon" aria-hidden="true">📅</span>
              <div className="fact-info">
                <span className="fact-label">Date</span>
                <strong>
                  {isValidDate ? eventDate.toLocaleDateString(undefined, { dateStyle: "full" }) : event.date}
                </strong>
              </div>
            </div>

            <div className="fact-item">
              <span className="fact-icon" aria-hidden="true">⏰</span>
              <div className="fact-info">
                <span className="fact-label">Time</span>
                <strong>{event.time ? event.time.slice(0, 5) : "TBD"}</strong>
              </div>
            </div>

            <div className="fact-item">
              <span className="fact-icon" aria-hidden="true">📍</span>
              <div className="fact-info">
                <span className="fact-label">Location / Venue</span>
                <strong>{event.venue}</strong>
              </div>
            </div>
          </div>

          {/* About The Event */}
          <section className="detail-section">
            <h2>About this event</h2>
            <div className="detail-description-content">
              {event.description?.split("\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          {/* Attendee Reviews Section */}
          <section className="detail-section detail-reviews-section">
            <div className="section-heading">
              <div>
                <h2>Attendee reviews</h2>
                <p>Real experiences shared by community members.</p>
              </div>
            </div>

            {reviews.reviews.length === 0 ? (
              <p className="no-reviews-note">No attendee reviews submitted yet.</p>
            ) : (
              <div className="reviews-list">
                {reviews.reviews.map((item) => (
                  <article className="review-card" key={item.id}>
                    <div className="review-card-header">
                      <div className="review-author">
                        <span className="review-avatar">
                          {item.userName ? item.userName.charAt(0).toUpperCase() : "A"}
                        </span>
                        <strong>{item.userName || "Attendee"}</strong>
                      </div>
                      <span className="review-rating-stars">
                        {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                      </span>
                    </div>
                    {item.comment && <p className="review-comment">{item.comment}</p>}
                    <span className="review-date">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                    </span>
                  </article>
                ))}
              </div>
            )}

            {/* Review Submission Form (Only USER role after event has started) */}
            {user?.role === "USER" && eventHasStarted && (
              <div className="add-review-panel">
                <h3>Share your experience</h3>
                <p>Help other attendees understand what made this event memorable.</p>

                <form className="review-form" onSubmit={handleReview}>
                  <label className="form-field">
                    <span>Your rating</span>
                    <select
                      value={review.rating}
                      onChange={(e) => setReview({ ...review, rating: e.target.value })}
                    >
                      <option value="5">★★★★★ (5 / 5 - Exceptional)</option>
                      <option value="4">★★★★☆ (4 / 5 - Great)</option>
                      <option value="3">★★★☆☆ (3 / 5 - Good)</option>
                      <option value="2">★★☆☆☆ (2 / 5 - Fair)</option>
                      <option value="1">★☆☆☆☆ (1 / 5 - Poor)</option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Your thoughts</span>
                    <textarea
                      rows="4"
                      maxLength={3000}
                      value={review.comment}
                      placeholder="What was the atmosphere like? Any highlights?"
                      onChange={(e) => setReview({ ...review, comment: e.target.value })}
                    />
                  </label>

                  <button type="submit" className="button button-dark">
                    Submit review
                  </button>
                </form>

                {reviewMessage && (
                  <p className="success-message" role="status">{reviewMessage}</p>
                )}
                {reviewError && (
                  <p className="error-message" role="alert">{reviewError}</p>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Sticky Booking & Registration Panel */}
        <aside className="detail-sidebar-column">
          <div className="booking-card">
            <div className="booking-card-header">
              <span className="booking-eyebrow">ADMISSION</span>
              <div className="booking-price-row">
                <span className="booking-price-amount">
                  {isFree ? "Free" : `₹${event.price}`}
                </span>
                <span className="booking-price-unit">/ ticket</span>
              </div>
            </div>

            <div className="booking-status-box">
              <span className={`seats-badge ${isSoldOut ? "is-sold-out" : ""}`}>
                {isSoldOut ? "Sold out" : `${event.availableSeats} seats remaining`}
              </span>
              {eventHasStarted && (
                <span className="event-started-badge">Event has begun</span>
              )}
            </div>

            {/* Booking Form or Login / Role Notice */}
            {user?.role === "USER" && !eventHasStarted && (
              <form className="booking-form-inner" onSubmit={handleBooking}>
                <label className="form-field">
                  <span>Number of tickets</span>
                  <input
                    id="ticket-quantity"
                    type="number"
                    min="1"
                    max={event.availableSeats}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    disabled={isSoldOut || bookingLoading}
                  />
                </label>

                {!isFree && (
                  <div className="booking-total-preview">
                    <span>Total Amount:</span>
                    <strong>₹{ticketTotal}</strong>
                  </div>
                )}

                <button
                  type="submit"
                  className="button button-dark btn-lg btn-full"
                  disabled={bookingLoading || isSoldOut}
                >
                  {bookingLoading ? "Confirming booking…" : isSoldOut ? "Sold out" : "Register & Book tickets"}
                </button>
              </form>
            )}

            {!user && !eventHasStarted && (
              <div className="booking-auth-prompt">
                <p>Sign in with an attendee account to register for this event.</p>
                <Link className="button button-dark btn-full" to="/login">
                  Sign in to register
                </Link>
                <Link className="button button-light btn-full" to="/register">
                  Create account
                </Link>
              </div>
            )}

            {user && user.role !== "USER" && (
              <div className="booking-role-notice">
                <p>
                  You are logged in as <strong>{user.role}</strong>. Bookings and ticket registrations are designed for attendee accounts.
                </p>
              </div>
            )}

            {eventHasStarted && (
              <div className="booking-ended-notice">
                <p>Online ticket registrations are closed because this event is already underway or concluded.</p>
              </div>
            )}

            {/* Booking Feedback Alerts */}
            {bookingMessage && (
              <div className="success-message" role="status">
                {bookingMessage}
              </div>
            )}
            {bookingError && (
              <div className="error-message" role="alert">
                {bookingError}
              </div>
            )}

            {/* Helpful booking guarantees */}
            <ul className="booking-perks-list">
              <li>✓ Instant reservation confirmation</li>
              <li>✓ Visible in your personal bookings hub</li>
              <li>✓ Cancellation available before event date</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default EventDetails;
