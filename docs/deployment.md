# Deployment notes

## Local Compose

1. Install Docker Engine and the Compose plugin.
2. Copy `.env.example` to `.env`, supply unique strong database passwords and a random Base64 JWT key of at least 32 bytes, and optionally add the backend-only AI key.
3. Run `docker compose config` to validate interpolation, then `docker compose up --build -d`.
4. Check `docker compose ps`, `docker compose logs -f backend`, and the frontend health endpoint at `http://localhost:8081/healthz`.
5. Verify public API access through Nginx, for example `http://localhost:8081/api/events`, and host-local backend health at `http://localhost:8080/actuator/health`.

The Compose file holds MySQL data in the `mysql-data` named volume. A normal `docker compose down` preserves it; `docker compose down -v` removes it. Back up MySQL data before upgrades or volume changes.

## Public host checklist

- Select a host and define DNS and HTTPS/TLS termination; this repository does not assume a cloud vendor.
- Store `MYSQL_ROOT_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET`, and optional `OPENAI_API_KEY` in the host's secret manager, not in the repository or image.
- Keep `AI_ASSISTANT_ENABLED=false` unless a valid server-side provider key and approved provider configuration are available.
- Set `FRONTEND_ORIGIN` to the real browser origin; configure frontend/backend host bindings and the TLS reverse proxy for that host.
- Keep MySQL on a private network and restrict management ports. The Compose defaults bind DB/backend ports to host loopback and publish the frontend at loopback for a same-host TLS proxy; expose a different frontend binding only when the trusted host network requires it.
- Decide and validate a schema migration/backup/restore policy. `JPA_DDL_AUTO=update` is convenient for a clean demo database, not a substitute for reviewed production migrations.
- Use a persistent database service/volume with backups. The in-process cache and async embedding executor are instance-local; embedding sync is best-effort.
- Deploy frontend, backend, and database, then verify registration/login, approved discovery, role restrictions, booking/cancellation and seat counts, favorites/reviews, organizer ownership, admin moderation, AI/RAG (if configured), and health.
- Record the deployed URL, release revision, tested user roles, and smoke-test date.

No public deployment can be claimed until a hosting provider, credentials/secrets, network policy, and a reachable application URL are available and those smoke checks pass.
