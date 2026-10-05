import { useCallback, useEffect, useState } from "react";
import { createEvent, deleteEvent, getCategories, getCities, updateEvent } from "../services/events";
import { getOrganizerBookings, getOrganizerDashboard, getOrganizerEvents } from "../services/platform";

const emptyForm = {
  title: "",
  description: "",
  categoryId: "",
  cityId: "",
  venue: "",
  date: "",
  time: "",
  price: "0",
  capacity: "1",
  imageUrl: "",
};

function OrganizerDashboard() {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    const [dashboard, eventList, bookingList, categoryList, cityList] = await Promise.all([
      getOrganizerDashboard(),
      getOrganizerEvents(),
      getOrganizerBookings(),
      getCategories(),
      getCities(),
    ]);
    setSummary(dashboard.data);
    setEvents(eventList.data);
    setBookings(bookingList.data);
    setCategories(categoryList.data);
    setCities(cityList.data);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      getOrganizerDashboard(),
      getOrganizerEvents(),
      getOrganizerBookings(),
      getCategories(),
      getCities(),
    ])
      .then(([dashboard, eventList, bookingList, categoryList, cityList]) => {
        if (!active) return;
        setSummary(dashboard.data);
        setEvents(eventList.data);
        setBookings(bookingList.data);
        setCategories(categoryList.data);
        setCities(cityList.data);
      })
      .catch(() => {
        if (active) setError("Organizer data could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function editEvent(event) {
    setEditingId(event.id);
    setMessage("");
    setError("");
    setForm({
      title: event.title,
      description: event.description,
      categoryId: String(event.categoryId),
      cityId: String(event.cityId),
      venue: event.venue,
      date: event.date,
      time: event.time.slice(0, 5),
      price: String(event.price),
      capacity: String(event.capacity),
      imageUrl: event.imageUrl ?? "",
    });
    document.getElementById("organizer-event-form")?.scrollIntoView({ behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function saveEvent(eventObject) {
    eventObject.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const payload = {
      ...form,
      categoryId: Number(form.categoryId),
      cityId: Number(form.cityId),
      price: Number(form.price),
      capacity: Number(form.capacity),
      imageUrl: form.imageUrl.trim() || null,
    };
    try {
      if (editingId) {
        await updateEvent(editingId, payload);
        setMessage("Event updated.");
      } else {
        const { data } = await createEvent(payload);
        setMessage(`Event created and submitted for review (${data.status}).`);
      }
      setForm(emptyForm);
      setEditingId(null);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Event could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEvent(event) {
    if (!window.confirm(`Delete “${event.title}”? This action cannot be undone.`)) return;
    setError("");
    try {
      await deleteEvent(event.id);
      setMessage("Event deleted.");
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Event could not be deleted.");
    }
  }

  if (loading) return <p className="state-message" role="status">Loading organizer dashboard…</p>;

  return (
    <section className="section dashboard-page">
      <span className="eyebrow">ORGANIZER STUDIO</span>
      <h1>Your events, <em>your people.</em></h1>
      {error && <p className="error-message" role="alert">{error}</p>}
      {message && <p className="success-message" role="status">{message}</p>}
      <div className="dashboard-stat-grid">
        <article><span>Total events</span><strong>{summary?.totalEvents ?? 0}</strong></article>
        <article><span>Upcoming events</span><strong>{summary?.upcomingEvents ?? 0}</strong></article>
        <article><span>Registrations</span><strong>{summary?.registrations ?? 0}</strong></article>
        <article><span>Available seats</span><strong>{summary?.availableSeats ?? 0}</strong></article>
      </div>

      <section className="dashboard-panel">
        <h2>{editingId ? "Edit event" : "Create an event"}</h2>
        <p>New events are submitted as pending for admin review.</p>
        <form id="organizer-event-form" className="dashboard-form" onSubmit={saveEvent}>
          <label>Title<input required maxLength="150" value={form.title} onChange={(change) => setForm({ ...form, title: change.target.value })} /></label>
          <label>Description<textarea required maxLength="10000" value={form.description} onChange={(change) => setForm({ ...form, description: change.target.value })} /></label>
          <label>Category<select required value={form.categoryId} onChange={(change) => setForm({ ...form, categoryId: change.target.value })}><option value="">Choose category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>City<select required value={form.cityId} onChange={(change) => setForm({ ...form, cityId: change.target.value })}><option value="">Choose city</option>{cities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Venue<input required maxLength="200" value={form.venue} onChange={(change) => setForm({ ...form, venue: change.target.value })} /></label>
          <label>Date<input type="date" required value={form.date} onChange={(change) => setForm({ ...form, date: change.target.value })} /></label>
          <label>Time<input type="time" required value={form.time} onChange={(change) => setForm({ ...form, time: change.target.value })} /></label>
          <label>Price<input type="number" min="0" step="0.01" required value={form.price} onChange={(change) => setForm({ ...form, price: change.target.value })} /></label>
          <label>Capacity<input type="number" min="1" step="1" required value={form.capacity} onChange={(change) => setForm({ ...form, capacity: change.target.value })} /></label>
          <label>Image URL<input type="url" value={form.imageUrl} onChange={(change) => setForm({ ...form, imageUrl: change.target.value })} /></label>
          <div className="dashboard-form-actions">
            <button className="button button-dark" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Create event"}</button>
            {editingId && <button className="button button-light" type="button" onClick={cancelEdit}>Cancel edit</button>}
          </div>
        </form>
      </section>

      <section className="dashboard-panel">
        <h2>My events</h2>
        {events.length === 0 ? <p>You have not created any events yet.</p> : (
          <div className="dashboard-list">
            {events.map((event) => (
              <article className="dashboard-list-row" key={event.id}>
                <div><strong>{event.title}</strong><span>{event.date} · {event.status} · {event.availableSeats}/{event.capacity} seats</span></div>
                <div className="row-actions">
                  <button type="button" onClick={() => editEvent(event)}>Edit</button>
                  <button className="danger-action" type="button" onClick={() => removeEvent(event)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-panel">
        <h2>Registrations</h2>
        {bookings.length === 0 ? <p>No registrations yet.</p> : (
          <div className="dashboard-list">
            {bookings.map((booking) => (
              <article className="dashboard-list-row" key={booking.id}>
                <div><strong>{booking.eventTitle}</strong><span>{booking.attendeeName} · {booking.quantity} ticket(s) · {booking.bookingStatus}</span></div>
                <span>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : ""}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default OrganizerDashboard;
