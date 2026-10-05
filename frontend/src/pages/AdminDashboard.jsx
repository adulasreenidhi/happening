import { useCallback, useEffect, useState } from "react";
import { getCategories, getCities } from "../services/events";
import { getAdminBookings, getAdminDashboard, getAdminEvents, getAdminUsers, manageCatalog, moderateEvent, updateUserRole } from "../services/platform";

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [catalogName, setCatalogName] = useState({ categories: "", cities: "" });
  const [status, setStatus] = useState("PENDING");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [dashboard, eventPage, userList, categoryList, cityList, bookingList] = await Promise.all([
      getAdminDashboard(),
      getAdminEvents({ status, size: 100, sort: "createdAt,desc" }),
      getAdminUsers(),
      getCategories(),
      getCities(),
      getAdminBookings(),
    ]);
    setSummary(dashboard.data);
    setEvents(eventPage.data.content);
    setUsers(userList.data);
    setCategories(categoryList.data);
    setCities(cityList.data);
    setBookings(bookingList.data);
  }, [status]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getAdminDashboard(),
      getAdminEvents({ status, size: 100, sort: "createdAt,desc" }),
      getAdminUsers(),
      getCategories(),
      getCities(),
      getAdminBookings(),
    ])
      .then(([dashboard, eventPage, userList, categoryList, cityList, bookingList]) => {
        if (!active) return;
        setSummary(dashboard.data);
        setEvents(eventPage.data.content);
        setUsers(userList.data);
        setCategories(categoryList.data);
        setCities(cityList.data);
        setBookings(bookingList.data);
      })
      .catch(() => {
        if (active) setError("Administrative data could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [status]);

  async function moderate(event, decision) {
    const action = decision === "approve" ? "approve" : "reject";
    if (!window.confirm(`${action === "approve" ? "Approve" : "Reject"} “${event.title}”?`)) return;
    setError("");
    setMessage("");
    try {
      await moderateEvent(event.id, decision);
      setMessage(`Event ${action === "approve" ? "approved" : "rejected"}.`);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Event status could not be changed.");
    }
  }

  async function changeRole(user, role) {
    if (role === user.role) return;
    if (!window.confirm(`Change ${user.name} from ${user.role} to ${role}?`)) return;
    setError("");
    try {
      await updateUserRole(user.id, role);
      setMessage(`${user.name} is now ${role}.`);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "User role could not be changed.");
    }
  }

  async function createCatalog(type, eventObject) {
    eventObject.preventDefault();
    setError("");
    try {
      await manageCatalog(type, "post", null, catalogName[type]);
      setCatalogName((current) => ({ ...current, [type]: "" }));
      setMessage(`${type === "categories" ? "Category" : "City"} added.`);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Catalog item could not be added.");
    }
  }

  async function editCatalog(type, item) {
    const name = window.prompt(`Update ${type === "categories" ? "category" : "city"} name`, item.name);
    if (name === null || !name.trim() || name.trim() === item.name) return;
    setError("");
    try {
      await manageCatalog(type, "put", item.id, name.trim());
      setMessage("Catalog item updated.");
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Catalog item could not be updated.");
    }
  }

  async function deleteCatalog(type, item) {
    if (!window.confirm(`Delete “${item.name}”? It cannot be removed while events use it.`)) return;
    setError("");
    try {
      await manageCatalog(type, "delete", item.id);
      setMessage("Catalog item deleted.");
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Catalog item could not be deleted.");
    }
  }

  if (loading) return <p className="state-message" role="status">Loading administration…</p>;

  return (
    <section className="section dashboard-page admin-dashboard">
      <span className="eyebrow">PLATFORM ADMINISTRATION</span>
      <h1>Keep things <em>happening.</em></h1>
      {error && <p className="error-message" role="alert">{error}</p>}
      {message && <p className="success-message" role="status">{message}</p>}
      <div className="dashboard-stat-grid">
        <article><span>Users</span><strong>{summary?.users ?? 0}</strong></article>
        <article><span>Organizers</span><strong>{summary?.organizers ?? 0}</strong></article>
        <article><span>Events</span><strong>{summary?.events ?? 0}</strong></article>
        <article><span>Pending review</span><strong>{summary?.pendingEvents ?? 0}</strong></article>
        <article><span>Bookings</span><strong>{summary?.bookings ?? 0}</strong></article>
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-panel-heading"><h2>Event approval</h2><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}>{["PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((value) => <option key={value}>{value}</option>)}</select></label></div>
        {events.length === 0 ? <p>No {status.toLowerCase()} events.</p> : (
          <div className="dashboard-list">
            {events.map((event) => (
              <article className="dashboard-list-row" key={event.id}>
                <div><strong>{event.title}</strong><span>{event.cityName} · {event.date} · {event.availableSeats}/{event.capacity} seats</span></div>
                {event.status === "PENDING" && <div className="row-actions"><button type="button" onClick={() => moderate(event, "approve")}>Approve</button><button className="danger-action" type="button" onClick={() => moderate(event, "reject")}>Reject</button></div>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-panel">
        <h2>User and organizer management</h2>
        <div className="dashboard-list">
          {users.map((user) => (
            <article className="dashboard-list-row" key={user.id}>
              <div><strong>{user.name}</strong><span>{user.email} · {user.phone}</span></div>
              <label className="role-selector">Role<select value={user.role} onChange={(event) => changeRole(user, event.target.value)}>{["USER", "ORGANIZER", "ADMIN"].map((role) => <option key={role}>{role}</option>)}</select></label>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-panel">
        <h2>Booking management</h2>
        {bookings.length === 0 ? <p>No bookings yet.</p> : (
          <div className="dashboard-list">
            {bookings.map((booking) => (
              <article className="dashboard-list-row" key={booking.id}>
                <div>
                  <strong>{booking.eventTitle}</strong>
                  <span>{booking.attendeeName} · {booking.eventDate} · {booking.quantity} ticket(s)</span>
                </div>
                <span>{booking.bookingStatus} · ₹{booking.totalAmount}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      {[["categories", categories], ["cities", cities]].map(([type, items]) => (
        <section className="dashboard-panel" key={type}>
          <h2>{type === "categories" ? "Category management" : "City management"}</h2>
          <form className="catalog-form" onSubmit={(event) => createCatalog(type, event)}>
            <label>{type === "categories" ? "New category" : "New city"}
              <input required maxLength="100" value={catalogName[type]} onChange={(event) => setCatalogName((current) => ({ ...current, [type]: event.target.value }))} />
            </label>
            <button className="button button-dark">Add</button>
          </form>
          <div className="catalog-list">
            {items.map((item) => (
              <div className="catalog-row" key={item.id}>
                <span>{item.name}</span>
                <div className="row-actions"><button type="button" onClick={() => editCatalog(type, item)}>Edit</button><button className="danger-action" type="button" onClick={() => deleteCatalog(type, item)}>Delete</button></div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}

export default AdminDashboard;
