# hopforher

## Dates / Nearby Places

The Dates tab now loads nearby spots through a Cloudflare Pages Function at `functions/api/date-spots.js`.

### Server-side env

Copy `.dev.vars.example` to `.dev.vars`.

For the immediate path, use Google Places:

- `DATE_SPOTS_PROVIDER=google-places`
- `GOOGLE_PLACES_API_KEY`
- optional tuning: `GOOGLE_PLACES_SEARCH_RADIUS_METERS`, `GOOGLE_PLACES_RANK_PREFERENCE`
- optional override: `GOOGLE_PLACES_FIELD_MASK`

The default Google field mask is set up to support richer Dates cards:

- ratings and review count
- price level
- open-now / next-open / next-close status
- venue website when Google returns one

The function auto-prefers Google Places when `GOOGLE_PLACES_API_KEY` is present. If you later get partner access, you can switch to OpenTable with:

- `DATE_SPOTS_PROVIDER=opentable`
- `OPENTABLE_DIRECTORY_API_URL`
- `OPENTABLE_API_KEY` or `OPENTABLE_BEARER_TOKEN`
- optional param/header overrides if your partner endpoint uses different names

Without provider credentials, the Dates tab falls back to generic nearby date lanes instead of fake live inventory.

### Client-side env

Copy `apps/web/.env.example` to `apps/web/.env.local` if the client should call a different API origin in dev:

- `VITE_DATE_SPOTS_API_PATH=/api/date-spots`

That lets local Vite dev talk to a deployed or separately-run proxy instead of assuming the same origin serves Pages Functions.

The UI stays provider-agnostic: it ranks nearby spots from the server response, then opens Google Maps, the venue site, or OpenTable depending on which provider is active.
