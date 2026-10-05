# Phase 4: AI event assistant and retrieval

## Architecture

The React assistant calls the authenticated `POST /api/assistant/chat` endpoint. Spring validates the message and optional conversation history, retrieves approved event records from MySQL, optionally performs semantic vector ranking, sends only those event records as context to the configured chat provider, and returns the generated explanation separately from authoritative event DTOs.

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/assistant/chat` | Authenticated |

Request:

```json
{
  "message": "Find affordable music events this weekend",
  "history": []
}
```

The response has `answer`, `databaseEvents`, `filtersApplied`, and `semanticSearchUsed`. Event title, city, category, venue, date, time, price, availability, and review facts are returned only as event database records. The generated explanation is not a booking confirmation or source of event facts.

## Retrieval and embeddings

Structured retrieval runs first and restricts results to future `APPROVED` events. The backend recognizes known city/category names, today/tonight/tomorrow/weekend/next-week or ISO date constraints, numeric maximum budgets, and availability requests. It then queries an OpenAI-compatible embedding endpoint when configured, compares the query vector with vectors in the MySQL `event_embeddings` table by cosine similarity, and re-fetches semantic candidates from MySQL with approved-status and structured-constraint checks. MySQL remains authoritative; a stale, pending, rejected, deleted, or otherwise mismatched event cannot be surfaced from the vector table alone.

Approved event creation, edits, and moderation publish a transaction-bound change notification. After commit, the backend updates the embedding. Events that are deleted or no longer approved have their stored vector removed. Indexing is best-effort so provider outages cannot undo core event changes. When vector retrieval fails, the assistant uses the structured result set.

Vectors are JSON-encoded values stored by event ID and model in MySQL. Exact cosine similarity scans stored rows; this deliberately avoids a new vector-database deployment but is not an approximate-nearest-neighbor index and will not scale as well as a dedicated vector engine.

## Provider configuration and security

Set `OPENAI_API_KEY` in the backend process environment. Never add it to frontend variables, source control, or browser requests. Optional backend variables are:

| Variable | Default |
| --- | --- |
| `AI_ASSISTANT_ENABLED` | `true` |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` |
| `OPENAI_CHAT_MODEL` | `gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` |

The backend uses a bounded request timeout and returns sanitized messages for provider timeout, rate-limit, invalid-configuration, and invalid-response failures. Missing API configuration returns a service-unavailable response; the core HAPPENING APIs do not depend on AI availability.

The assistant route requires login to reduce unauthenticated use of the server-side provider key. Conversation turns remain in the browser and are sent only with the next assistant request; they are limited in size and are treated as untrusted prompt content.
