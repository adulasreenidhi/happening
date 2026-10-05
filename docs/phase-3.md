# Phase 3: Event platform workflows

## Discovery

`GET /api/events` returns a page containing only `APPROVED` events. It supports combined title/description search, city/category IDs, exact dates/date ranges, free/paid status, seat availability, pagination, and sorting by date, price, creation time, or title.

`GET /api/events/{id}/reviews` returns reviews, average rating, and rating count for an approved event. Public event and review responses use DTOs rather than serializing JPA relationships.

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/events` | Public; returns paginated approved events |
| GET | `/api/events/{id}` | Public; approved events only |
| GET | `/api/categories`, `/api/cities` | Public catalog |
| GET | `/api/events/{id}/reviews` | Public; approved events only |
| POST | `/api/events/{id}/reviews` | `USER`; eligible booking required |
| GET | `/api/organizer/dashboard`, `/api/organizer/events`, `/api/organizer/bookings` | `ORGANIZER`, `ADMIN`; current organizer only |
| GET | `/api/admin/dashboard`, `/api/admin/users`, `/api/admin/events` | `ADMIN` |
| PATCH | `/api/admin/users/{id}/role` | `ADMIN` |
| PATCH | `/api/admin/events/{id}/approve`, `/reject` | `ADMIN` |
| GET/POST/PUT/DELETE | `/api/admin/categories`, `/api/admin/cities` | `ADMIN` |
| POST | `/api/bookings` | `USER` |
| GET | `/api/bookings/me` | `USER`; own bookings |
| POST | `/api/bookings/{id}/cancel` | `USER`; own eligible booking |
| GET/POST/DELETE | `/api/favorites[/{eventId}]` | `USER`; own favorites |

## Organizer and administration

- An organizer's event-create/update/delete calls are tied to the email resolved from the authenticated JWT. Organizer IDs, event status, and remaining seats supplied by that client do not override server-owned values.
- New organizer events are `PENDING`; only `/api/admin/events/{id}/approve` and `/reject` can moderate events.
- Organizer dashboard and booking views are scoped to the authenticated organizer. Event ownership is checked on every mutation.
- `/api/admin/**` is method-protected for `ADMIN` only. Admin tools include summary counts, user-role management, event review, and category/city CRUD. Administrators cannot change their own role through the user-role endpoint.

## Booking, favorites, reviews

- Booking accepts an event ID and positive ticket quantity. The server locks the event row, requires an approved event that has not started, checks remaining seats, calculates the total from the stored event price, and persists the booking and reduced seat count in one transaction.
- Users can list or cancel only their own bookings. Cancellation is allowed for a confirmed booking only before the event begins and restores its seats transactionally.
- Favorites are unique per user/event in the database and are read/changed using the authenticated user, never a caller-supplied user ID.
- A user may review an approved event once after it has ended, and only with a confirmed booking. Ratings are constrained to 1–5.

The payment model is retained from Phase 1, but there is no payment processor in Phase 3. Cancellation therefore changes booking status and inventory only; it does not represent a refund transaction.
