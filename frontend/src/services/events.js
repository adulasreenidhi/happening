import api from "./api";

export function getEvents(params = {}) {
  return api.get("/events", { params });
}

export function getEvent(id) {
  return api.get(`/events/${id}`);
}

export function createEvent(event) {
  return api.post("/events", event);
}

export function updateEvent(id, event) {
  return api.put(`/events/${id}`, event);
}

export function deleteEvent(id) {
  return api.delete(`/events/${id}`);
}

export function getCategories() {
  return api.get("/categories");
}

export function getCities() {
  return api.get("/cities");
}

export function getReviews(eventId) {
  return api.get(`/events/${eventId}/reviews`);
}

export function createReview(eventId, review) {
  return api.post(`/events/${eventId}/reviews`, review);
}
