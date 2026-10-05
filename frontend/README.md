# HAPPENING frontend

React and Vite event discovery frontend. Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the backend API base URL (default: `http://localhost:8080/api`).

Run `npm install`, then `npm run dev`. Use `npm run lint` and `npm run build` to check the frontend.

The login access token is held in memory and attached to API requests as a Bearer token. Reloading the page clears the session; no credentials or tokens are written to browser storage.
