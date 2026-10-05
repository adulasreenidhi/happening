# Phase 1: Backend and relational model

## Entity relationships

- `Event` belongs to one `Category`, one `City`, and one organizer (`User`).
- `User` has organized events, bookings, favorites, and reviews.
- `Booking` belongs to one user and one event; its booking and payment statuses are enums.
- `Favorite` and `Review` each belong to one user and one event. A user can favorite or review an event at most once.
- `Category` and `City` each have many events.

Event, role, booking, and payment status values are persisted as enum names. Event timestamps use `LocalDateTime`, event dates and times use `LocalDate` and `LocalTime`, and monetary amounts use `BigDecimal`.

## Persistence and API notes

Hibernate's development schema mode is `update`. The connection uses `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`; credentials are not stored in this repository. The `create-database.sql` script initializes the MySQL database before the application starts.

The Event API accepts relation IDs and returns DTOs with relation IDs, rather than serializing JPA entities. This prevents exposing user data and avoids recursive serialization of bidirectional relationships. Validation, not-found responses, and database referential-integrity conflicts have centralized JSON error responses.
