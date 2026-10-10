import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, getCities } from "../services/events";
import {
  getAdminBookings,
  getAdminDashboard,
  getAdminEvents,
  getAdminUsers,
  manageCatalog,
  moderateEvent,
  updateUserRole,
} from "../services/platform";
import StatusBadge from "../components/StatusBadge";
import { ConfirmModal, PromptModal } from "../components/Modal";

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
  const [activeTab, setActiveTab] = useState("moderation"); // 'moderation' | 'users' | 'bookings' | 'catalogs'

  // Modal dialog states
  const [moderationTarget, setModerationTarget] = useState(null); // { event, decision }
  const [roleTarget, setRoleTarget] = useState(null); // { user, newRole }
  const [catalogDeleteTarget, setCatalogDeleteTarget] = useState(null); // { type, item }
  const [catalogEditTarget, setCatalogEditTarget] = useState(null); // { type, item }
  const [actionLoading, setActionLoading] = useState(false);

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

  // Moderate Event (Approve / Reject)
  async function confirmModerate() {
    if (!moderationTarget) return;
    const { event, decision } = moderationTarget;
    const action = decision === "approve" ? "approve" : "reject";
    setError("");
    setMessage("");
    setActionLoading(true);
    try {
      await moderateEvent(event.id, decision);
      setMessage(`Event “${event.title}” successfully ${action === "approve" ? "approved" : "rejected"}.`);
      setModerationTarget(null);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Event moderation could not be applied.");
    } finally {
      setActionLoading(false);
    }
  }

  // Change Role
  async function confirmChangeRole() {
    if (!roleTarget) return;
    const { user, newRole } = roleTarget;
    setError("");
    setMessage("");
    setActionLoading(true);
    try {
      await updateUserRole(user.id, newRole);
      setMessage(`Updated ${user.name}’s role to ${newRole}.`);
      setRoleTarget(null);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "User role could not be updated.");
    } finally {
      setActionLoading(false);
    }
  }

  // Create Catalog Item
  async function createCatalog(type, e) {
    e.preventDefault();
    setError("");
    try {
      await manageCatalog(type, "post", null, catalogName[type].trim());
      setCatalogName((current) => ({ ...current, [type]: "" }));
      setMessage(`${type === "categories" ? "Category" : "City"} successfully added.`);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Catalog item could not be created.");
    }
  }

  // Edit Catalog Item
  async function confirmEditCatalog(newName) {
    if (!catalogEditTarget || !newName.trim()) return;
    const { type, item } = catalogEditTarget;
    setError("");
    try {
      await manageCatalog(type, "put", item.id, newName.trim());
      setMessage(`Updated ${type === "categories" ? "category" : "city"} name to “${newName.trim()}”.`);
      setCatalogEditTarget(null);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Catalog item could not be renamed.");
    }
  }

  // Delete Catalog Item
  async function confirmDeleteCatalog() {
    if (!catalogDeleteTarget) return;
    const { type, item } = catalogDeleteTarget;
    setError("");
    setActionLoading(true);
    try {
      await manageCatalog(type, "delete", item.id);
      setMessage(`Deleted ${type === "categories" ? "category" : "city"} “${item.name}”.`);
      setCatalogDeleteTarget(null);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Catalog item could not be removed while events are using it.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="section container">
        <p className="state-message" role="status">Loading platform administration…</p>
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
            PLATFORM OPERATIONS
          </span>
          <h1>System <em>Administration.</em></h1>
          <p>Moderate submissions, manage users & roles, track registrations, and curate city catalogs.</p>
        </div>
      </div>

      {error && <div className="state-panel error-message" role="alert">{error}</div>}
      {message && <div className="state-panel success-message" role="status">{message}</div>}

      {/* Admin Summary KPIs */}
      <div className="operations-kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Registered Users</span>
          <strong className="kpi-value">{summary?.users ?? 0}</strong>
          <span className="kpi-subtext">Attendees on platform</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Organizers</span>
          <strong className="kpi-value">{summary?.organizers ?? 0}</strong>
          <span className="kpi-subtext">Approved event hosts</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Total Events</span>
          <strong className="kpi-value">{summary?.events ?? 0}</strong>
          <span className="kpi-subtext">Created listings</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Pending Review</span>
          <strong className="kpi-value">{summary?.pendingEvents ?? 0}</strong>
          <span className="kpi-subtext">Awaiting moderation</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Platform Bookings</span>
          <strong className="kpi-value">{summary?.bookings ?? 0}</strong>
          <span className="kpi-subtext">All-time reservations</span>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="operations-tabs" role="tablist" aria-label="Administration sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "moderation"}
          className={`tab-btn ${activeTab === "moderation" ? "is-active" : ""}`}
          onClick={() => setActiveTab("moderation")}
        >
          Event Moderation ({events.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "users"}
          className={`tab-btn ${activeTab === "users" ? "is-active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users & Roles ({users.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "bookings"}
          className={`tab-btn ${activeTab === "bookings" ? "is-active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          All Bookings ({bookings.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "catalogs"}
          className={`tab-btn ${activeTab === "catalogs" ? "is-active" : ""}`}
          onClick={() => setActiveTab("catalogs")}
        >
          Catalogs & Cities
        </button>
      </div>

      {/* TAB 1: EVENT MODERATION */}
      {activeTab === "moderation" && (
        <section className="operations-panel">
          <div className="operations-panel-header">
            <div>
              <h2>Event Moderation Queue</h2>
              <p>Review submitted events to ensure quality standards and accurate venue details.</p>
            </div>
            <div className="filter-select-inline">
              <label htmlFor="moderation-status">Status:</label>
              <select
                id="moderation-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {["PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✓</div>
              <h3>Queue is clear</h3>
              <p>No events found with status “{status}”.</p>
            </div>
          ) : (
            <div className="operations-table-wrap">
              <table className="operations-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>City & Date</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th className="th-actions">Decision</th>
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
                        <span>{ev.cityName || "City"}</span>
                        <span className="table-sub">{ev.date}</span>
                      </td>
                      <td>
                        <span>{ev.availableSeats} / {ev.capacity} seats</span>
                        <span className="table-sub">
                          {Number(ev.price) === 0 ? "Free" : `₹${ev.price}`}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={ev.status} />
                      </td>
                      <td>
                        {ev.status === "PENDING" ? (
                          <div className="table-action-group">
                            <button
                              type="button"
                              className="button button-dark btn-sm"
                              onClick={() => setModerationTarget({ event: ev, decision: "approve" })}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="button btn-danger btn-sm"
                              onClick={() => setModerationTarget({ event: ev, decision: "reject" })}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="table-sub">Decided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: USERS & ROLES */}
      {activeTab === "users" && (
        <section className="operations-panel">
          <div className="operations-panel-header">
            <div>
              <h2>User Management & Access Control</h2>
              <p>Promote users to Organizers or Administrators across the platform.</p>
            </div>
          </div>

          <div className="operations-table-wrap">
            <table className="operations-table">
              <thead>
                <tr>
                  <th>User Identity</th>
                  <th>Contact Information</th>
                  <th>Role Assignment</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong className="table-title">{u.name}</strong>
                      <span className="table-sub">ID: #{u.id}</span>
                    </td>
                    <td>
                      <span>{u.email}</span>
                      <span className="table-sub">{u.phone}</span>
                    </td>
                    <td>
                      <select
                        aria-label={`Role for ${u.name}`}
                        value={u.role}
                        className="role-dropdown-compact"
                        onChange={(e) => {
                          const newRole = e.target.value;
                          if (newRole !== u.role) {
                            setRoleTarget({ user: u, newRole });
                          }
                        }}
                      >
                        {["USER", "ORGANIZER", "ADMIN"].map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: ALL BOOKINGS */}
      {activeTab === "bookings" && (
        <section className="operations-panel">
          <div className="operations-panel-header">
            <div>
              <h2>Platform Reservations & Bookings</h2>
              <p>Complete history of ticket sales and reservations made on the platform.</p>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎫</div>
              <h3>No bookings recorded yet</h3>
              <p>Registered attendee tickets will appear here.</p>
            </div>
          ) : (
            <div className="operations-table-wrap">
              <table className="operations-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Attendee</th>
                    <th>Tickets & Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.eventTitle}</strong>
                        <span className="table-sub">{b.eventDate}</span>
                      </td>
                      <td>
                        <span>{b.attendeeName}</span>
                      </td>
                      <td>
                        <span>{b.quantity} ticket(s)</span>
                        <span className="table-sub">₹{b.totalAmount}</span>
                      </td>
                      <td>
                        <StatusBadge status={b.bookingStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 4: CATALOGS & CITIES */}
      {activeTab === "catalogs" && (
        <div className="catalogs-dual-grid">
          {[
            { type: "categories", title: "Categories", items: categories, placeholder: "New category name" },
            { type: "cities", title: "Cities", items: cities, placeholder: "New city name" },
          ].map(({ type, title, items, placeholder }) => (
            <section className="operations-panel" key={type}>
              <div className="operations-panel-header">
                <div>
                  <h2>{title} ({items.length})</h2>
                  <p>Curate approved discovery taxonomies.</p>
                </div>
              </div>

              <form className="catalog-inline-form" onSubmit={(e) => createCatalog(type, e)}>
                <input
                  required
                  maxLength={100}
                  placeholder={placeholder}
                  value={catalogName[type]}
                  onChange={(e) => setCatalogName((cur) => ({ ...cur, [type]: e.target.value }))}
                />
                <button type="submit" className="button button-dark btn-sm">
                  + Add
                </button>
              </form>

              <div className="catalog-items-list">
                {items.map((item) => (
                  <div className="catalog-item-row" key={item.id}>
                    <span className="catalog-item-name">{item.name}</span>
                    <div className="table-action-group">
                      <button
                        type="button"
                        className="button button-light btn-sm"
                        onClick={() => setCatalogEditTarget({ type, item })}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button btn-danger btn-sm"
                        onClick={() => setCatalogDeleteTarget({ type, item })}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* MODAL 1: Moderation Confirmation */}
      <ConfirmModal
        isOpen={Boolean(moderationTarget)}
        title={moderationTarget?.decision === "approve" ? "Approve Event" : "Reject Event"}
        message={
          moderationTarget
            ? `Are you sure you want to ${moderationTarget.decision === "approve" ? "approve" : "reject"} “${moderationTarget.event.title}”?`
            : ""
        }
        confirmText={
          actionLoading
            ? "Applying…"
            : moderationTarget?.decision === "approve"
            ? "Yes, Approve Event"
            : "Yes, Reject Event"
        }
        cancelText="Cancel"
        isDestructive={moderationTarget?.decision === "reject"}
        onConfirm={confirmModerate}
        onCancel={() => setModerationTarget(null)}
      />

      {/* MODAL 2: Change Role Confirmation */}
      <ConfirmModal
        isOpen={Boolean(roleTarget)}
        title="Change User Role"
        message={
          roleTarget
            ? `Change role for ${roleTarget.user.name} (${roleTarget.user.email}) from ${roleTarget.user.role} to ${roleTarget.newRole}?`
            : ""
        }
        confirmText={actionLoading ? "Updating…" : "Confirm Role Change"}
        cancelText="Cancel"
        onConfirm={confirmChangeRole}
        onCancel={() => setRoleTarget(null)}
      />

      {/* MODAL 3: Edit Catalog Name Prompt */}
      <PromptModal
        isOpen={Boolean(catalogEditTarget)}
        title={`Edit ${catalogEditTarget?.type === "categories" ? "Category" : "City"}`}
        message="Update the public name displayed across discovery filters."
        initialValue={catalogEditTarget?.item.name ?? ""}
        placeholder="Enter name"
        confirmText="Save changes"
        cancelText="Cancel"
        onConfirm={confirmEditCatalog}
        onCancel={() => setCatalogEditTarget(null)}
      />

      {/* MODAL 4: Delete Catalog Confirmation */}
      <ConfirmModal
        isOpen={Boolean(catalogDeleteTarget)}
        title={`Delete ${catalogDeleteTarget?.type === "categories" ? "Category" : "City"}`}
        message={
          catalogDeleteTarget
            ? `Are you sure you want to delete “${catalogDeleteTarget.item.name}”? Note: It cannot be removed while existing events are associated with it.`
            : ""
        }
        confirmText={actionLoading ? "Deleting…" : "Delete Item"}
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={confirmDeleteCatalog}
        onCancel={() => setCatalogDeleteTarget(null)}
      />
    </div>
  );
}

export default AdminDashboard;
