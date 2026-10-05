import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createReview, getEvent, getReviews } from "../services/events";
import { bookEvent } from "../services/platform";
import { useAuth } from "../context/useAuth";
import FavoriteButton from "../components/FavoriteButton";

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
      })
    return () => {
      active = false;
    };
  }, [id]);

  const loading = result.id !== id;
  const event = loading ? null : result.event;
  const error = loading ? "" : result.error;

  if (loading) return <p className="state-message" role="status">Loading event…</p>;
  if (error) return <section className="section state-panel error-message" role="alert"><h1>{error}</h1><Link className="text-link" to="/events">Browse events <span>↗</span></Link></section>;

  const eventDate = new Date(`${event.date}T${event.time || "00:00:00"}`);
  const eventHasStarted = eventDate <= new Date();

  async function handleBooking(eventObject) {
    eventObject.preventDefault();
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

  async function handleReview(eventObject) {
    eventObject.preventDefault();
    setReviewError("");
    setReviewMessage("");
    try {
      await createReview(event.id, { ...review, rating: Number(review.rating) });
      setReviewMessage("Thanks for sharing your experience.");
      const { data } = await getReviews(id);
      setReviews(data);
      setReview({ rating: "5", comment: "" });
    } catch (requestError) {
      setReviewError(requestError.response?.data?.message ?? "Review could not be submitted.");
    }
  }

  return (
    <article className="section event-detail">
      <Link className="text-link" to="/events">← All events</Link>
      {event.imageUrl && <img className="event-detail-image" src={event.imageUrl} alt={event.title} />}
      <span className="eyebrow">{event.categoryName || "CITY EVENT"}{event.cityName && ` · ${event.cityName}`}</span>
      <h1>{event.title}</h1>
      <FavoriteButton eventId={event.id} />
      <p className="event-rating" aria-label={`${reviews.averageRating.toFixed(1)} average rating from ${reviews.ratingCount} reviews`}>
        ★ {reviews.averageRating.toFixed(1)} <span>({reviews.ratingCount} {reviews.ratingCount === 1 ? "rating" : "ratings"})</span>
      </p>
      <div className="detail-facts">
        <span>{eventDate.toLocaleDateString(undefined, { dateStyle: "long" })}</span>
        <span>{event.time}</span>
        <span>{event.venue}</span>
        <strong>{Number(event.price) > 0 ? `₹${event.price}` : "Free"}</strong>
        <span>{event.availableSeats} seats available</span>
      </div>
      <h2>About this event</h2>
      <p>{event.description}</p>
      {user?.role === "USER" && !eventHasStarted && (
        <form className="booking-form" onSubmit={handleBooking}>
          <label htmlFor="ticket-quantity">Tickets</label>
          <input
            id="ticket-quantity"
            type="number"
            min="1"
            max={event.availableSeats}
            value={quantity}
            onChange={(change) => setQuantity(change.target.value)}
            required
          />
          <button className="button button-dark" disabled={bookingLoading || event.availableSeats < 1}>
            {bookingLoading ? "Booking…" : event.availableSeats < 1 ? "Sold out" : "Book tickets"}
          </button>
        </form>
      )}
      {!user && !eventHasStarted && <p><Link to="/login">Sign in as an attendee</Link> to book tickets.</p>}
      {bookingMessage && <p className="success-message" role="status">{bookingMessage}</p>}
      {bookingError && <p className="error-message" role="alert">{bookingError}</p>}
      <section className="event-reviews">
        <h2>Attendee reviews</h2>
        {reviews.reviews.length === 0 ? <p>No reviews yet.</p> : reviews.reviews.map((item) => (
          <article className="review-card" key={item.id}>
            <strong>{item.userName}</strong><span> ★ {item.rating}/5</span>
            {item.comment && <p>{item.comment}</p>}
          </article>
        ))}
        {user?.role === "USER" && eventHasStarted && (
          <form className="review-form" onSubmit={handleReview}>
            <label>Rating
              <select value={review.rating} onChange={(change) => setReview({ ...review, rating: change.target.value })}>
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
              </select>
            </label>
            <label>Comment
              <textarea maxLength="3000" value={review.comment} onChange={(change) => setReview({ ...review, comment: change.target.value })} />
            </label>
            <button className="button button-dark">Share review</button>
          </form>
        )}
        {reviewMessage && <p className="success-message" role="status">{reviewMessage}</p>}
        {reviewError && <p className="error-message" role="alert">{reviewError}</p>}
      </section>
    </article>
  );
}

export default EventDetails;
