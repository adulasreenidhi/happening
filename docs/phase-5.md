# Phase 5: reliability, performance, monitoring, and tests

## Cache

Spring caching uses the in-process concurrent map cache manager. Only shared, non-sensitive catalog DTOs are cached:

| Method | Cache key | Invalidation |
| --- | --- | --- |
| `AdminService.categories()` | `categories::all` | Evicted after successful category create, update, or delete |
| `AdminService.cities()` | `cities::all` | Evicted after successful city create, update, or delete |

Public catalog reads and admin catalog management use the same cached service methods. Event pages/details are intentionally not cached: their seat inventory and event approval status change, and stale recommendations are undesirable. User-, booking-, favorite-, and conversation-specific data are also not cached.

The catalog cache is process-local and has no time-based expiration; service-managed updates invalidate it immediately. If an operator edits catalog rows directly in SQL, restart the application or invoke the corresponding service mutation before relying on the cache.

## Asynchronous work

Event create/update/moderation publishes an event-change notification. After the transaction commits, a bounded `@Async` executor checks eligibility and updates/removes the embedding. The provider API call is not part of the event transaction or HTTP request. AI provider failures cannot roll back core event changes; failures, task start/completion, and queue saturation are logged. When the AI provider is disabled, existing structured MySQL retrieval continues to work.

Booking, cancellation, and seat inventory changes remain synchronous, locked, and transactional. They are not sent to the async executor.

The executor has two core threads, four maximum threads, and a queue capacity of 100. If full, tasks are logged and rejected rather than run on the request thread; the next event mutation can retry embedding synchronization. This is best-effort indexing, not a durable work queue.

## Logging and secrets

SLF4J/Logback logs registration/login outcomes, event lifecycle changes, booking lifecycle IDs, assistant retrieval counts, and asynchronous indexing. Logs avoid passwords, JWTs, provider keys, user emails, and prompt contents. Avoid enabling HTTP body logging for authentication or assistant routes.

## Actuator

Only these management endpoints are exposed over HTTP:

| Endpoint | Access |
| --- | --- |
| `GET /actuator/health` | Public status only |
| `GET /actuator/health/**` | Public status; component details are shown only to authenticated callers |
| `GET /actuator/info` | `ADMIN` |
| `GET /actuator/metrics` and `/actuator/metrics/{name}` | `ADMIN` |

Health includes Spring's database health indicator when MySQL is configured, allowing an authorized caller to inspect database connectivity. Management metrics and info require an ADMIN JWT and are not enabled as public endpoints.

## Automated tests

`.\mvnw.cmd test` runs the existing Mockito service/controller tests and the added AI-service fallback tests. `PlatformWorkflowIntegrationTests` starts the application with the isolated H2 `test` profile and exercises HTTP registration/login, organizer event creation, admin approval, public discovery, attendee booking, seat decrement, role authorization, invalid/duplicate registration, catalog cache hit/invalidation, and actuator access. A fresh random test-only JWT key is generated at test runtime; no signing key is checked into the repository.

Run only the integration workflows with:

```powershell
.\mvnw.cmd -Dtest=PlatformWorkflowIntegrationTests test
```

The H2 profile does not require production credentials or signing keys.
