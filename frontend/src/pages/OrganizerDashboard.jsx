import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createEvent, deleteEvent, getCategories, getCities, updateEvent } from "../services/events";
import { getOrganizerBookings, getOrganizerDashboard, getOrganizerEvents } from "../services/platform";
import StatusBadge from "../components/StatusBadge";
import { ConfirmModal } from "../components/Modal";

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
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("events"); // 'events' | 'create' | 'bookings'

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
      time: event.time ? event.time.slice(0, 5) : "",
      price: String(event.price),
      capacity: String(event.capacity),
      imageUrl: event.imageUrl ?? "",
    });
    setActiveTab("create");
    window.scrollTo({ top: 300, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function saveEvent(e) {
    e.preventDefault();
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
        setMessage("Event successfully updated.");
      } else {
        const { data } = await createEvent(payload);
        setMessage(`Event created and submitted for administrative review (${data.status}).`);
      }
      setForm(emptyForm);
      setEditingId(null);
      await refresh();
      setActiveTab("events");
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Event could not be saved. Please check the form fields.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!eventToDelete) return;
    setError("");
    setDeleting(true);
    try {
      await deleteEvent(eventToDelete.id);
      setMessage(`Event “${eventToDelete.title}” deleted.`);
      setEventToDelete(null);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Event could not be deleted.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="section container">
        <p className="state-message" role="status">Loading Organizer Studio…</p>
      </div>
    );
  }

  return (
    <div className="operations-page container">
      {/* Workspace Header */}
      <div className="operations-header">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            ORGANIZER WORKSPACE
          </span>
          <h1>Event <em>Operations Studio.</em></h1>
          <p>Create, manage, and monitor registration capacity for your hosted city events.</p>
        </div>

        <button
          type="button"
          className="button button-dark"
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setActiveTab("create");
          }}
        >
          + Create New Event
        </button>
      </div>

      {error && <div className="state-panel error-message" role="alert">{error}</div>}
      {message && <div className="state-panel success-message" role="status">{message}</div>}

      {/* Operational KPI Metric Strip */}
      <div className="operations-kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Events</span>
          <strong className="kpi-value">{summary?.totalEvents ?? 0}</strong>
          <span className="kpi-subtext">All created listings</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Upcoming Events</span>
          <strong className="kpi-value">{summary?.upcomingEvents ?? 0}</strong>
          <span className="kpi-subtext">Active on calendar</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Total Registrations</span>
          <strong className="kpi-value">{summary?.registrations ?? 0}</strong>
          <span className="kpi-subtext">Reserved tickets</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Seats Available</span>
          <strong className="kpi-value">{summary?.availableSeats ?? 0}</strong>
          <span className="kpi-subtext">Remaining capacity</span>
        </div>
      </div>

      {/* Operations Segmented Tabs */}
      <div className="operations-tabs" role="tablist" aria-label="Organizer sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "events"}
          className={`tab-btn ${activeTab === "events" ? "is-active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          My Events ({events.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "create"}
          className={`tab-btn ${activeTab === "create" ? "is-active" : ""}`}
          onClick={() => setActiveTab("create")}
        >
          {editingId ? "Edit Event" : "Create Event"}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "bookings"}
          className={`tab-btn ${activeTab === "bookings" ? "is-active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          Registrations ({bookings.length})
        </button>
      </div>

      {/* TAB 1: MY EVENTS LIST */}
      {activeTab === "events" && (
        <section className="operations-panel">
          <div className="operations-panel-header">
            <div>
              <h2>Hosted events</h2>
              <p>All events managed under your organizer profile.</p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✦</div>
              <h3>No events hosted yet</h3>
              <p>Ready to host an experience? Create your first event listing to get started.</p>
              <button
                type="button"
                className="button button-dark"
                onClick={() => setActiveTab("create")}
              >
                Create an event
              </button>
            </div>
          ) : (
            <div className="operations-table-wrap">
              <table className="operations-table">
                <thead>
                  <tr>
                    <th>Event Details</th>
                    <th>Date & City</th>
                    <th>Capacity / Seats</th>
                    <th>Status</th>
                    <th className="th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id}>
                      <td>
                        <strong className="table-title">
                          <Link to={`/events/${ev.id}`}>{ev.title}</Link>
                        </strong>
                        <span className="table-sub">{ev.venue}</span>
                      </td>
                      <td>
                        <span>{ev.date}</span>
                        <span className="table-sub">{ev.cityName || "City"}</span>
                      </td>
                      <td>
                        <span>{ev.availableSeats} of {ev.capacity} left</span>
                        <span className="table-sub">
                          {Number(ev.price) === 0 ? "Free admission" : `₹${ev.price}`}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={ev.status} />
                      </td>
                      <td>
                        <div className="table-action-group">
                          <button
                            type="button"
                            className="button button-light btn-sm"
                            onClick={() => editEvent(ev)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button btn-danger btn-sm"
                            onClick={() => setEventToDelete(ev)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: CREATE / EDIT EVENT FORM */}
      {activeTab === "create" && (
        <section className="operations-panel">
          <div className="operations-panel-header">
            <div>
              <h2>{editingId ? "Edit Event Listing" : "Create New Event"}</h2>
              <p>New events are submitted as pending for administrative moderation.</p>
            </div>
            {editingId && (
              <button
                type="button"
                className="button button-light btn-sm"
                onClick={cancelEdit}
              >
                Cancel edit
              </button>
            )}
          </div>

          <form id="organizer-event-form" className="grouped-event-form" onSubmit={saveEvent}>
            {/* Section 1: Basic Information */}
            <fieldset className="form-section-fieldset">
              <legend className="form-section-legend">
                <span className="legend-step">1</span>
                Basic Information
              </legend>

              <div className="form-field">
                <span>Event Title</span>
                <input
                  required
                  maxLength={150}
                  value={form.title}
                  placeholder="e.g. City Jazz Under The Stars"
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <span>Category</span>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <span>Target City</span>
                  <select
                    required
                    value={form.cityId}
                    onChange={(e) => setForm({ ...form, cityId: e.target.value })}
                  >
                    <option value="">Select a city</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-field">
                <span>Detailed Description</span>
                <textarea
                  required
                  rows="5"
                  maxLength={10000}
                  value={form.description}
                  placeholder="Provide an overview of the event, what attendees should expect, prerequisites, etc."
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </fieldset>

            {/* Section 2: Location & Timing */}
            <fieldset className="form-section-fieldset">
              <legend className="form-section-legend">
                <span className="legend-step">2</span>
                Location & Schedule
              </legend>

              <div className="form-field">
                <span>Venue Name & Address</span>
                <input
                  required
                  maxLength={200}
                  value={form.venue}
                  placeholder="e.g. National Center for the Arts, Hall B"
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <span>Event Date</span>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <span>Start Time</span>
                  <input
                    type="time"
                    required
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
              </div>
            </fieldset>

            {/* Section 3: Capacity & Pricing */}
            <fieldset className="form-section-fieldset">
              <legend className="form-section-legend">
                <span className="legend-step">3</span>
                Capacity & Ticket Pricing
              </legend>

              <div className="form-row">
                <div className="form-field">
                  <span>Total Seat Capacity</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={form.capacity}
                    placeholder="e.g. 100"
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <span>Ticket Price (₹) <small>Set 0 for free events</small></span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.price}
                    placeholder="0"
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
              </div>
            </fieldset>

            {/* Section 4: Imagery */}
            <fieldset className="form-section-fieldset">
              <legend className="form-section-legend">
                <span className="legend-step">4</span>
                Imagery (Optional)
              </legend>

              <div className="form-field">
                <span>Event Cover Image URL</span>
                <input
                  type="url"
                  value={form.imageUrl}
                  placeholder="https://example.com/event-cover.jpg"
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
                <small>Leave empty to use the design system’s editorial fallback graphic.</small>
              </div>
            </fieldset>

            {/* Form Actions */}
            <div className="form-submit-row">
              <button
                type="submit"
                className="button button-dark btn-lg"
                disabled={saving}
              >
                {saving ? "Saving listing…" : editingId ? "Save Changes" : "Create & Submit Event"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="button button-light btn-lg"
                  onClick={cancelEdit}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      {/* TAB 3: REGISTRATIONS LIST */}
      {activeTab === "bookings" && (
        <section className="operations-panel">
          <div className="operations-panel-header">
            <div>
              <h2>Attendee registrations</h2>
              <p>Direct bookings recorded for your hosted events.</p>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎫</div>
              <h3>No registrations yet</h3>
              <p>Attendee bookings will appear here as soon as tickets are reserved.</p>
            </div>
          ) : (
            <div className="operations-table-wrap">
              <table className="operations-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Attendee</th>
                    <th>Tickets</th>
                    <th>Status</th>
                    <th>Booked Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <strong>{booking.eventTitle}</strong>
                      </td>
                      <td>
                        <span>{booking.attendeeName}</span>
                      </td>
                      <td>
                        <span>{booking.quantity} {booking.quantity === 1 ? "ticket" : "tickets"}</span>
                      </td>
                      <td>
                        <StatusBadge status={booking.bookingStatus} />
                      </td>
                      <td>
                        <span>
                          {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(eventToDelete)}
        title="Delete Event"
        message={
          eventToDelete
            ? `Are you sure you want to delete “${eventToDelete.title}”? This action cannot be reversed.`
            : ""
        }
        confirmText={deleting ? "Deleting…" : "Delete Event"}
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
}

export default OrganizerDashboard;
