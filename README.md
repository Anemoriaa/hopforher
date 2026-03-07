# hopforher

## Dates / OpenTable

The Dates tab now loads nearby spots through a Cloudflare Pages Function at `functions/api/date-spots.js`.

### Server-side env

Copy `.dev.vars.example` to `.dev.vars` and fill in your partner settings:

- `OPENTABLE_DIRECTORY_API_URL`
- `OPENTABLE_API_KEY` or `OPENTABLE_BEARER_TOKEN`
- optional param/header overrides if your partner endpoint uses different names

Without those values, the Dates tab falls back to generic OpenTable lanes instead of fake nearby inventory.

### Client-side env

Copy `apps/web/.env.example` to `apps/web/.env.local` if the client should call a different API origin in dev:

- `VITE_DATE_SPOTS_API_PATH=/api/date-spots`

That lets local Vite dev talk to a deployed or separately-run proxy instead of assuming the same origin serves Pages Functions.
