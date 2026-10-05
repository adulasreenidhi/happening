# HAPPENING API

Base path: `/api`. JSON error responses are produced by the backend exception handlers. Protected endpoints use `Authorization: Bearer <accessToken>` from `POST /api/auth/login`.

## Authentication and access

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Create a USER account |
| POST | `/auth/login` | Public | Authenticate and issue a bearer token |
| GET | `/categories`, `/cities` | Public | Read event catalogs |
| GET | `/events` | Public | List approved events |
| GET | `/events/{id}` | Public | Read one approved event |
| POST/PUT/DELETE | `/events`, `/events/{id}` | ORGANIZER/ADMIN | Create, update, and delete; ownership checked for organizers |

## Discovery and paging

`GET /events` accepts the following optional query parameters together:

| Parameter | Meaning |
| --- | --- |
| `search` | Match event title/description |
| `cityId`, `categoryId` | Catalog identifiers |
| `date`, `fromDate`, `toDate` | Specific date or inclusive date range |
| `free` | Filter free/paid events |
| `available` | Exclude events without seats when true |
| `page`, `size` | Zero-based page and page size (maximum 100) |
| `sort` | Supported fields include `date`, `price`, `createdAt`, `title`, with `asc`/`desc` |

The response uses Spring `Page` metadata: `content`, `number`, `size`, `totalElements`, `totalPages`, and navigation flags.

## User workflows

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/bookings` | Create a booking; server computes total and locks/checks available inventory |
| GET | `/bookings/me` | List the authenticated user's bookings |
| POST | `/bookings/{id}/cancel` | Cancel own eligible booking and restore seats |
| GET/POST/DELETE | `/favorites`, `/favorites/{eventId}` | List/add/remove own favorites |
| GET | `/events/{eventId}/reviews` | Public event reviews, average, and count |
| POST | `/events/{eventId}/reviews` | Submit an eligible post-event review (confirmed booking required) |
| GET | `/reviews/me` | List the authenticated USER's reviews |
| POST | `/assistant/chat` | Authenticated grounded assistant query |

## Organizer and admin workflows

| Method | Path | Access |
| --- | --- | --- |
| GET | `/organizer/dashboard`, `/organizer/events`, `/organizer/bookings` | ORGANIZER/ADMIN; organizer data is scoped to the caller |
| GET | `/admin/dashboard`, `/admin/users`, `/admin/bookings` | ADMIN |
| PATCH | `/admin/users/{id}/role` | ADMIN |
| GET | `/admin/events` | ADMIN; optional status and pageable/sort query |
| PATCH | `/admin/events/{id}/approve`, `/admin/events/{id}/reject` | ADMIN |
| GET/POST/PUT/DELETE | `/admin/categories[/{id}]`, `/admin/cities[/{id}]` | ADMIN |

## Monitoring

`GET /actuator/health` (including health probes) is public. Health details follow Spring's configured `when-authorized` policy; `/actuator/info` and `/actuator/metrics` require an ADMIN JWT. Do not expose internal management ports to the public network.

## API verification

Run backend tests with `cd backend; .\mvnw.cmd test`. The HTTP integration tests use isolated H2 and exercise registration, login, moderation, booking, inventory, and authorization. For live MySQL and provider checks, start the application with configured environment variables and use the routes above in Postman or the browser.
