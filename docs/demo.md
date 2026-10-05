# HAPPENING demo sequence

Use a clean development database and three test accounts: attendee (`USER`), organizer (`ORGANIZER`), and administrator (`ADMIN`). Self-registration creates only USER accounts; promote test accounts through an authorized administrative process. Configure a live AI provider key only on the backend if demonstrating provider-backed responses.

Before the walkthrough, provision the initial administrator through a trusted bootstrap process, create at least one category and city, and prepare an organizer account. The application intentionally does not expose public admin self-promotion or hard-coded seed credentials.

1. **Public discovery:** open Home, Events, Categories, and Cities; search and apply multiple event filters, sorting, and paging.
2. **Registration:** register a new attendee and show validation plus the default USER role.
3. **Login:** sign in and show protected navigation and profile details.
4. **Booking:** open an approved upcoming event, choose a quantity, book, then inspect the server-calculated total and remaining seats.
5. **Favorites/reviews:** save an event, view My Favorites, and demonstrate review eligibility after a confirmed booking and the event date.
6. **Organizer event creation:** sign in as organizer, create an event, and show its initial PENDING status.
7. **Organizer management:** edit/delete an owned event and inspect registrations and dashboard totals. Attempting to modify another organizer's event must be rejected.
8. **Admin review:** sign in as administrator, inspect the pending event, approve or reject it, and demonstrate user/organizer, catalog, and booking administration.
9. **Approved discovery:** return to public event discovery and verify the approved event appears while pending/rejected events do not.
10. **AI assistant:** ask for a city/category/date/budget-specific event; distinguish returned database facts from generated explanations.
11. **RAG and health:** use alternate wording for a semantically relevant query, then check backend `/actuator/health` and (with ADMIN authorization) metrics.
12. **Docker deployment:** run `docker compose config`, `docker compose up --build -d`, check service health and frontend-to-API behavior, and show the persistent MySQL volume.

Record which steps were actually demonstrated. H2 integration tests, successful image builds, or local health responses do not prove a live MySQL-backed public cloud deployment or an AI-provider request.
