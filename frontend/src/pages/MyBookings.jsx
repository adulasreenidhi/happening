import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cancelBooking, getMyBookings } from "../services/platform";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        if (active) setError("Your bookings could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleCancel(booking) {
    if (!window.confirm(`Cancel your booking for “${booking.eventTitle}”?`)) return;
    setError("");
    try {
      await cancelBooking(booking.id);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Booking could not be cancelled.");
    }
  }

  if (loading) return <p className="state-message" role="status">Loading your bookings…</p>;

  return (
    <section className="section dashboard-page">
      <span className="eyebrow">YOUR PLANS</span><h1>My <em>bookings.</em></h1>
      {error && <p className="error-message" role="alert">{error}</p>}
      {bookings.length === 0 ? <div className="empty-state"><h2>No bookings yet.</h2><p>Find your next plan in the events list.</p><Link className="button button-dark" to="/events">Explore events</Link></div> : (
        <div className="dashboard-list">
          {bookings.map((booking) => {
            const canCancel = booking.bookingStatus === "CONFIRMED"
              && new Date(`${booking.eventDate}T${booking.eventTime}`) > new Date();
            return (
              <article className="dashboard-list-row booking-row" key={booking.id}>
                <div><strong>{booking.eventTitle}</strong><span>{booking.eventDate} · {booking.eventTime} · {booking.venue}</span><span>{booking.quantity} ticket(s) · ₹{booking.totalAmount} · {booking.paymentStatus}</span></div>
                <div className="row-actions"><span className={`status-chip status-${booking.bookingStatus.toLowerCase()}`}>{booking.bookingStatus}</span>{canCancel && <button className="danger-action" type="button" onClick={() => handleCancel(booking)}>Cancel booking</button>}</div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default MyBookings;
