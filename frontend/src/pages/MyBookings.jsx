import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cancelBooking, getMyBookings } from "../services/platform";
import StatusBadge from "../components/StatusBadge";
import { ConfirmModal } from "../components/Modal";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await getMyBookings();
    setBookings(data);
  }, []);

  useEffect(() => {
    let active = true;
    getMyBookings()
      .then(({ data }) => {
        if (active) setBookings(data);
      })
      .catch(() => {
        if (active) setError("Your bookings could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleConfirmCancel() {
    if (!bookingToCancel) return;
    setError("");
    setCancelling(true);
    try {
      await cancelBooking(bookingToCancel.id);
      setBookingToCancel(null);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Booking could not be cancelled. Please contact support.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="section container">
        <p className="state-message" role="status">Loading your bookings…</p>
      </div>
    );
  }

  return (
    <div className="bookings-page container">
      <div className="page-heading">
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          YOUR RESERVATIONS
        </span>
        <h1>My <em>bookings.</em></h1>
        <p>Review and manage your confirmed event tickets and registrations.</p>
      </div>

      {error && (
        <div className="state-panel error-message" role="alert">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎫</div>
          <h2>No upcoming events yet.</h2>
          <p>You haven’t registered for any events yet. Discover concerts, workshops, and meetups happening in your city.</p>
          <Link className="button button-dark" to="/events">
            Explore events now →
          </Link>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => {
            const canCancel =
              booking.bookingStatus === "CONFIRMED" &&
              new Date(`${booking.eventDate}T${booking.eventTime}`) > new Date();

            return (
              <article className="booking-record-card" key={booking.id}>
                <div className="booking-main-details">
                  <div className="booking-title-row">
                    <h3 className="booking-event-title">{booking.eventTitle}</h3>
                    <StatusBadge status={booking.bookingStatus} />
                  </div>

                  <div className="booking-meta-grid">
                    <div className="meta-block">
                      <span className="meta-label">Date & Time</span>
                      <strong className="meta-value">
                        {booking.eventDate} · {booking.eventTime?.slice(0, 5) || booking.eventTime}
                      </strong>
                    </div>

                    <div className="meta-block">
                      <span className="meta-label">Venue</span>
                      <strong className="meta-value">{booking.venue}</strong>
                    </div>

                    <div className="meta-block">
                      <span className="meta-label">Tickets Reserved</span>
                      <strong className="meta-value">
                        {booking.quantity} {booking.quantity === 1 ? "ticket" : "tickets"}
                      </strong>
                    </div>

                    <div className="meta-block">
                      <span className="meta-label">Total Amount</span>
                      <strong className="meta-value">
                        ₹{booking.totalAmount} ({booking.paymentStatus})
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="booking-actions-side">
                  {booking.eventId && (
                    <Link
                      className="button button-light btn-sm"
                      to={`/events/${booking.eventId}`}
                    >
                      View event
                    </Link>
                  )}

                  {canCancel && (
                    <button
                      className="button btn-danger btn-sm"
                      type="button"
                      disabled={cancelling}
                      onClick={() => setBookingToCancel(booking)}
                    >
                      Cancel booking
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Booking Cancellation */}
      <ConfirmModal
        isOpen={Boolean(bookingToCancel)}
        title="Cancel Booking"
        message={
          bookingToCancel
            ? `Are you sure you want to cancel your reservation for “${bookingToCancel.eventTitle}” (${bookingToCancel.quantity} tickets)? This action cannot be reversed.`
            : ""
        }
        confirmText={cancelling ? "Cancelling…" : "Yes, cancel booking"}
        cancelText="Keep reservation"
        isDestructive={true}
        onConfirm={handleConfirmCancel}
        onCancel={() => setBookingToCancel(null)}
      />
    </div>
  );
}

export default MyBookings;
