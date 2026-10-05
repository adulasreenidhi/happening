# HAPPENING

HAPPENING is a city event discovery, booking, and management platform. Attendees discover and book approved events; organizers manage their own events; administrators moderate the platform. Its optional AI assistant recommends events using approved MySQL records and server-side provider configuration.

## Features

- Public event discovery by title, city, category, date, price, and seat availability, with sorting and pagination.
- USER registration, sign-in, profile, bookings and cancellation, favorites, reviews, and an AI event assistant.
- ORGANIZER dashboard, event creation and ownership-scoped editing, registration list, and operational summaries.
- ADMIN dashboard, user/organizer management, event moderation, catalog management, and booking visibility.
- JWT authentication, BCrypt password hashing, backend role/ownership checks, and server-calculated booking totals.
- MySQL persistence, catalog caching, after-commit asynchronous embedding updates, SLF4J logging, and restricted Actuator endpoints.
- Optional AI chat and semantic recommendations. MySQL remains authoritative; embeddings are stored and searched in MySQL.

## Technology and architecture

| Area | Technology |
| --- | --- |
| Backend | Java 21, Spring Boot, Spring MVC, Spring Data JPA/Hibernate, Maven, Spring Security, JWT |
| Database | MySQL 8.4 |
| Frontend | React 19, Vite, React Router, Axios |
| AI | OpenAI-compatible chat and embedding API; API keys remain backend-only |
| Local deployment | Docker Compose, Nginx, MySQL named volume |

The React app sends `/api` requests through Nginx to Spring Boot. Spring services apply business rules and access MySQL through repositories. Authentication and role/ownership checks are enforced by the backend. Read [the architecture](docs/architecture.md) and [the ER diagram](docs/er-diagram.md) for more detail.

## Project structure

```text
happening/
├── backend/       Spring Boot API, tests, and backend Dockerfile
├── frontend/      React/Vite application, Nginx config, and frontend Dockerfile
├── database/      MySQL database setup
├── docs/          API, architecture, ER/use-case diagrams, and demo guide
├── docker-compose.yml
└── README.md
```

## Requirements

For local development without containers: Java 21, MySQL 8, Node.js 22+, and npm.
For the Compose setup: Docker Engine and the Docker Compose plugin.

## Run locally without Docker

1. Create the `happening_db` database by running [`database/create-database.sql`](database/create-database.sql).
2. In the backend terminal, configure `DB_USERNAME`, `DB_PASSWORD`, and a strong Base64-encoded `JWT_SECRET` of at least 32 bytes. Optionally configure the AI provider key. For example, in PowerShell:

   ```powershell
   $env:DB_USERNAME = "your_mysql_user"
   $env:DB_PASSWORD = "your_mysql_password"
   $jwtBytes = New-Object byte[] 32
   [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($jwtBytes)
   $env:JWT_SECRET = [Convert]::ToBase64String($jwtBytes)
   # Optional: $env:OPENAI_API_KEY = "your_server_side_provider_key"
   ```

   `DB_URL` defaults to `jdbc:mysql://localhost:3306/happening_db`. Do not put credentials in tracked property files.
3. Start the backend:

   ```powershell
   cd backend
   .\mvnw.cmd spring-boot:run
   ```

4. In another terminal, install and run the frontend:

   ```powershell
   cd frontend
   Copy-Item .env.example .env.local
   npm ci
   npm run dev
   ```

   The local Vite API base URL defaults to `http://localhost:8080/api`; configure `VITE_API_BASE_URL` in `frontend/.env.local` only when it differs.

Hibernate uses `ddl-auto=update` for development. The test profile uses isolated in-memory H2. Production schema creation/update is configurable with `JPA_DDL_AUTO`; use `update` for a first clean Compose launch, and use a reviewed schema migration plus `validate` for a managed production database.

## Environment variables

Copy [`.env.example`](.env.example) to `.env` for Compose and replace the blank required values. `.env` is ignored by Git.

| Variable | Required | Purpose |
| --- | --- | --- |
| `MYSQL_ROOT_PASSWORD` | Yes | MySQL root password for container initialization/health checking |
| `DB_USERNAME` | Yes | MySQL application user (also created by the MySQL image) |
| `DB_PASSWORD` | Yes | Application user password |
| `JWT_SECRET` | Yes | Base64-encoded JWT signing key material, at least 32 bytes |
| `OPENAI_API_KEY` | No | Backend-only AI provider key; leave blank to run without live provider calls |
| `AI_ASSISTANT_ENABLED` | No | Enables/disables provider use; Compose defaults to `false` until configured |
| `OPENAI_BASE_URL` | No | OpenAI-compatible provider URL |
| `OPENAI_CHAT_MODEL` | No | Chat model name |
| `OPENAI_EMBEDDING_MODEL` | No | Embedding model name |
| `FRONTEND_ORIGIN` | No | Browser origin allowed by backend CORS |
| `JWT_EXPIRATION_MS` | No | JWT lifetime; defaults to 3,600,000 ms |
| `JPA_DDL_AUTO` | No | Hibernate schema behavior; defaults to `update` in the Compose `prod` profile |
| `FRONTEND_BIND_ADDRESS` | No | Frontend host binding; defaults to `127.0.0.1` for use behind a local TLS proxy |
| `FRONTEND_PORT`, `BACKEND_PORT`, `MYSQL_HOST_PORT` | No | Host ports; defaults to 8081, 8080, and 3307 |

Never add populated environment files, API keys, database passwords, or signing secrets to source control. In hosted production, use the hosting provider's secret manager and terminate TLS at a trusted reverse proxy/load balancer.

For a local demo, self-register the initial administrator and organizer accounts as USER accounts, then have a trusted database operator promote only those known rows. For example, connect to the MySQL service interactively and run:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
UPDATE users SET role = 'ORGANIZER' WHERE email = 'organizer@example.com';
```

Verify each update affected exactly one intended account. Never add public self-promotion or a default admin password. The administrator can then create the categories and cities organizers need when submitting events.

## Docker Compose

The Compose stack builds the API and production frontend, waits for MySQL and backend health checks, publishes the frontend, and persists MySQL data in `mysql-data`. The backend and database host port bindings default to loopback; the browser reaches the backend through the frontend Nginx `/api` reverse proxy.

```powershell
Copy-Item .env.example .env
# Edit .env; set MYSQL_ROOT_PASSWORD, DB_PASSWORD, and JWT_SECRET to strong unique values.
docker compose config
docker compose up --build -d
docker compose ps
docker compose logs -f backend
```

Smoke-check `http://localhost:8081/healthz` and `http://localhost:8080/actuator/health` from the host. Public event browsing is available at `http://localhost:8081`; the API is also reachable locally at `http://localhost:8080/api`. Nginx does not proxy Actuator paths. Actuator health is public; other exposed Actuator endpoints require an ADMIN JWT.

Stop the containers with `docker compose down`. The named MySQL volume remains. `docker compose down -v` deletes that database volume and its data; use it only when data removal is intended.

For a public deployment, provide secrets through the host's secret manager, set the actual frontend origin and schema policy, put HTTPS in front of the frontend, and keep MySQL private. No cloud provider is assumed by this repository; follow [deployment notes](docs/deployment.md) and adapt the reverse-proxy/network binding to the selected host.

## API summary

| Area | Representative endpoints | Access |
| --- | --- | --- |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login` | Public |
| Events | `GET /api/events`, `GET /api/events/{id}` | Public; only approved public events |
| Organizer events | `POST /api/events`, `PUT /api/events/{id}`, `DELETE /api/events/{id}` | ORGANIZER/ADMIN; ownership enforced |
| Catalog | `GET /api/categories`, `GET /api/cities` | Public |
| Organizer | `/api/organizer/dashboard`, `/api/organizer/events`, `/api/organizer/bookings` | ORGANIZER/ADMIN |
| Administration | `/api/admin/dashboard`, `/api/admin/users`, `/api/admin/events`, `/api/admin/bookings`, `/api/admin/categories`, `/api/admin/cities` | ADMIN |
| Booking | `POST /api/bookings`, `GET /api/bookings/me`, `POST /api/bookings/{id}/cancel` | USER |
| Favorites | `GET /api/favorites`, `POST /api/favorites/{eventId}`, `DELETE /api/favorites/{eventId}` | USER |
| Reviews | `GET /api/events/{eventId}/reviews`, `POST /api/events/{eventId}/reviews`, `GET /api/reviews/me` | Public reads; USER writes/own list |
| AI assistant | `POST /api/assistant/chat` | Authenticated |
| Monitoring | `/actuator/health`, `/actuator/info`, `/actuator/metrics` | Health public; others ADMIN |

For request/response details, filters, paging, and authorization, see [API documentation](docs/api.md).

## Frontend pages

- Public: Home, Events, Categories, Cities, Event Details, About, Login, Register.
- USER: Dashboard, Profile, My Bookings, My Favorites, My Reviews, AI Assistant.
- ORGANIZER: Organizer Dashboard (event creation/edit/delete, own events, registrations, summary metrics), Profile.
- ADMIN: Admin Dashboard (users/organizers, event review, categories/cities, and booking visibility), Profile.

Role-aware navigation and route protection improve the UI experience; backend authorization remains authoritative.

## Tests and production build

```powershell
cd backend
.\mvnw.cmd test

cd ..\frontend
npm ci
npm run lint
npm run build
```

Backend tests include service-level Mockito tests and HTTP integration workflows using H2 under the test profile. Production builds use `npm run build` and the frontend Docker image. See [Phase 5 notes](docs/phase-5.md) for cache keys, async behavior, logging, and Actuator details.

## Demo sequence

Use the [12-step demo guide](docs/demo.md) for the public, USER, ORGANIZER, ADMIN, AI/RAG, monitoring, and Docker walk-through.

## Release and deployment status

Compose files and instructions provide a reproducible local container deployment. Public cloud deployment requires choosing a host and configuring its secret manager, DNS, TLS, networking, and database backup policy. Do not treat a successful build or local Compose start as evidence of a public deployment; record the host URL and smoke-test results when a deployment is actually performed.
