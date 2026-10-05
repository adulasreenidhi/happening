import api from "./api";

export function bookEvent(eventId, quantity) {
  return api.post("/bookings", { eventId, quantity });
}

export function getMyBookings() {
  return api.get("/bookings/me");
}

export function getMyReviews() {
  return api.get("/reviews/me");
}

export function cancelBooking(id) {
  return api.post(`/bookings/${id}/cancel`);
}

export function getMyFavorites() {
  return api.get("/favorites");
}

export function addFavorite(eventId) {
  return api.post(`/favorites/${eventId}`);
}

export function removeFavorite(eventId) {
  return api.delete(`/favorites/${eventId}`);
}

export function getOrganizerDashboard() {
  return api.get("/organizer/dashboard");
}

export function getOrganizerEvents() {
  return api.get("/organizer/events");
}

export function getOrganizerBookings() {
  return api.get("/organizer/bookings");
}

export function getAdminDashboard() {
  return api.get("/admin/dashboard");
}

export function getAdminBookings() {
  return api.get("/admin/bookings");
}

export function getAdminUsers(role) {
  return api.get("/admin/users", { params: role ? { role } : {} });
}

export function updateUserRole(id, role) {
  return api.patch(`/admin/users/${id}/role`, { role });
}

export function getAdminEvents(params = {}) {
  return api.get("/admin/events", { params });
}

export function moderateEvent(id, decision) {
  return api.patch(`/admin/events/${id}/${decision}`);
}

export function manageCatalog(type, method, id, name) {
  const path = `/admin/${type}${id ? `/${id}` : ""}`;
  return api[method](path, method === "delete" ? undefined : { name });
}
