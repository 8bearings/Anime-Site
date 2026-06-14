# Feature Roadmap

Implementation spec for the next batch of features. Scoped so each item can be
picked up and built with minimal re-discovery. All endpoints are **Jikan v4**
(`https://api.jikan.moe/v4`) — the `jikan.apib` in the repo root is v3 and only
useful as a capability reference.

## Design principles (keep it lightweight)

- **Disclosure over density.** New detail (trailer, episodes) lives inside the
  card's existing expand state, not on the always-visible face.
- **One filter home.** All filter/sort controls live inside the existing
  collapsible `Suggestion` panel ("Need Some Direction?") — the main view stays
  clean. The only new always-visible element is a single compact "browse bar" row.
- **No new deps.** Reuse the existing `apiFetch` cache/throttle, `debounce`, and
  CSS theme tokens (`#000`, green `#0ec801`).
- **Lazy everything.** Trailer iframes and autocomplete only fetch/load on intent.

---

## Phase 0 — Shared prerequisites (do first)

These unblock multiple features. Small, do them up front.

### [x] 0a. Expand the `AnimeShow` type
**File:** `src/types/interfaces.ts`
Add the fields v4 already returns (we just never typed them):
```ts
trailer?: {
  youtube_id: string | null
  url: string | null
  embed_url: string | null
}
episodes?: number | null
status?: string        // human string: "Finished Airing" | "Currently Airing" | "Not yet aired"
airing?: boolean
studios?: { mal_id: number; type: string; name: string; url: string }[]
season?: string | null
year?: number | null
rank?: number
scored_by?: number
```
No API change — these come free on `/anime/{id}`, `/anime?q=`, `/seasons`, `/top`.

### [x] 0b. Centralized query builder
**File:** `src/services/api.ts` (co-locate with `searchAnime`)
Add a typed builder so search + filters + autocomplete all construct the same way:
```ts
export interface AnimeQuery {
  q?: string
  genres?: string[]        // MAL genre ids
  type?: string            // tv | movie | ova | ona | special
  status?: string          // airing | complete | upcoming
  rating?: string          // g | pg | pg13 | r17
  minScore?: number
  maxScore?: number
  startDate?: string       // yyyy-mm-dd
  endDate?: string         // yyyy-mm-dd
  orderBy?: string         // score | popularity | start_date | title
  sort?: 'asc' | 'desc'
  sfw?: boolean
  limit?: number
}
// returns a param string WITHOUT leading "?", e.g. "q=naruto&order_by=score&sort=desc"
export function buildAnimeQuery(p: AnimeQuery): string
```
Then change `searchAnime` to `/anime?${query}&page=${page}` (note the `?` moves
into `searchAnime`; callers pass the param string only). Update the two callers:
- `Home.performSearch` → `buildAnimeQuery({ q: query, ...activeFilters })`
- `Suggestion.handleSuggest` → `buildAnimeQuery({ ...filterState })`

**Gotcha:** keep `encodeURIComponent` on `q` inside the builder. Empty query is
valid for browse (`/anime?order_by=members&sort=desc`).

### [x] 0c. New endpoint functions
**File:** `src/services/api.ts` (all use `apiFetch`, so cache+throttle are automatic)
```ts
getTopAnime(filter?: 'airing'|'upcoming'|'bypopularity'|'favorite', page = 1)
  -> `/top/anime${filter ? `?filter=${filter}&` : '?'}sfw&page=${page}`
getSeasonAnime(year: number, season: string, page = 1)  // season: winter|spring|summer|fall
  -> `/seasons/${year}/${season}?sfw&page=${page}`
getUpcomingAnime(page = 1) -> `/seasons/upcoming?sfw&page=${page}`
getSeasonsArchive()        -> `/seasons`   // [{ year, seasons: string[] }]
```
All return `AnimeListResponse` (same shape as search/popular).

### [x] 0d. Use real pagination
**File:** `src/pages/Home.tsx`
Replace the `data.length > 0` heuristic for `hasMore` with
`searchResults.pagination?.has_next_page`. `Pagination` is already typed in
`interfaces.ts`. Prevents one dead request at the end of every list.

---

## Phase 1 — Card enrichment (free data, highest wow/effort)

### [x] 1a. Trailer embed
**File:** `src/components/ShowCard.tsx` (+ small CSS in `src/css/ShowCard.css`)
**Data:** `show.trailer?.embed_url` / `show.trailer?.youtube_id` (already in the
object — **no extra request**).
**Approach (lightweight, avoids loading YouTube for every expanded card):**
1. In the expanded details, if `trailer.youtube_id` exists, render a **click-to-play
   thumbnail**: `https://img.youtube.com/vi/{youtube_id}/hqdefault.jpg` with a play
   ▶ overlay.
2. On click, swap the thumbnail for an `<iframe>` using `embed_url` + `?autoplay=1`,
   `allow="autoplay; encrypted-media"`, `loading="lazy"`, 16:9 wrapper.
3. Local `useState` `playing` per card; reset on collapse.
**UI:** sits at the top of `.show-details`, only when expanded. Hidden entirely if
no trailer.
**Effort:** Low. **Gotcha:** stop event propagation so clicking the player doesn't
collapse the card; constrain iframe with `aspect-ratio: 16/9`.

### [x] 1b. Episode count + airing status
**File:** `src/components/ShowCard.tsx`
**Data:** `show.episodes`, `show.status`, `show.airing`.
**UI:** one compact line in the existing `.not-synopsis-details` block, e.g.
`{episodes ?? '?'} eps · {status}`. Optionally a small colored dot (green
`#0ec801` when `airing` is true). No new section.
**Effort:** Low.

---

## Phase 2 — Finding (filters & sort, all inside the Suggestion panel)

All of these extend `AnimeQuery` (Phase 0b) and render as controls **inside the
existing collapsible `Suggestion` panel** to avoid main-UI bloat.

### [x] 2a. Sort control
**File:** `src/components/Suggestion.tsx` (+ apply to text search via `performSearch`)
Dropdown → maps to `{ orderBy, sort }`:
| Label | orderBy | sort |
| --- | --- | --- |
| Score | `score` | `desc` |
| Popularity | `popularity` | `asc` (rank 1 = most popular) |
| Newest | `start_date` | `desc` |
| Title (A–Z) | `title` | `asc` |
**Note:** `/top` and `/seasons` ignore `order_by` — sort only applies to `/anime`
(search/filter mode). Disable/hide the sort control in Top/Season browse modes.

### [x] 2b. Status filter
`status=airing|complete|upcoming`. Small select or 3 pills in the panel. Map
labels Airing/Completed/Upcoming → enum values (different from the display string
in 1b — keep a tiny map).

### [x] 2c. Type filter
`type=tv|movie|ova|ona|special`. Select in the panel. (We still client-side
exclude Music/PV in `helper.ts`; this lets users positively choose a type.)

### [x] 2d. Score range + end date
Add `maxScore` (second slider or numeric) and `endDate` (year input) next to the
existing `min_score` / `start_date` controls. Builder emits `max_score` /
`end_date=yyyy-mm-dd`.
**Gotcha:** validate `minScore <= maxScore` and `startDate <= endDate` before firing.

**Effort for Phase 2:** Low each, mostly form wiring once 0b exists.

---

## Phase 3 — Browse modes (the "browse bar")

Turns Home from a single feed into tabs, using one tidy row of pills placed where
the lone "Refresh Popular" button is now.

### [x] 3a. Home feed "mode"
**File:** `src/pages/Home.tsx`
Introduce a `feedMode` state: `'season-now' | 'top' | 'season' | 'search' |
'suggestion'`. The existing `loadPopularAnime`/`loadSearchAnime` become cases of a
`loadFeed(page)` switch that calls the right endpoint (0c). Keep infinite scroll +
throttle/cache unchanged. This is the one piece of real refactor — keep it small
and well-typed.

### [x] 3b. Top tabs
Pills: **Airing Now** (`getTopAnime('airing')`), **Popular**
(`getTopAnime('bypopularity')`), **Upcoming** (`getUpcomingAnime` or
`getTopAnime('upcoming')`), **Top Rated** (`getTopAnime()`), plus **This Season**
(default `/seasons/now`). Selecting a pill sets `feedMode` + resets page/shows.
**UI:** single horizontal scrollable row, active pill uses the green accent.

### [x] 3c. Seasonal browser
A **Season ▾** pill opens a tiny inline picker: year `<select>` + season
(Winter/Spring/Summer/Fall) populated from `getSeasonsArchive()`. Choosing →
`feedMode='season'`, `getSeasonAnime(year, season)`.
**UI:** picker is a small popover/disclosure, not a full page. Collapses after pick.
**Effort:** Phase 3 is Medium (the mode refactor); 3b/3c are small once 3a lands.

---

## Phase 4 — Live search autocomplete

### [ ] 4. Debounced search dropdown
**File:** `src/pages/Home.tsx` or a small new `src/components/SearchAutocomplete.tsx`
**API:** `buildAnimeQuery({ q, limit: 5, orderBy: 'popularity', sort: 'asc', sfw: true })`
on the `/anime` endpoint, debounced.
**Approach:**
- Reuse `debounce` from `helper.ts` (500ms) on the search input's `onChange`.
- Only fire when `q.trim().length >= 3` (MAL requirement).
- Render a dropdown under the input: thumbnail + title + year, max 5.
- Select → navigate to the detail route (Phase 5a) once it exists; until then, run
  the full search.
- Press Enter / Search button → existing full search (unchanged).
**UI:** absolutely-positioned list under `.search-input`; dismiss on blur/escape/select.
**Effort:** Medium. **Gotchas:**
- **Out-of-order responses:** track a `requestId`/latest-query ref and ignore stale
  results, or rely on the URL cache (still guard with latest-query check).
- Don't show the dropdown once a full search has been submitted.

---

## Phase 5 — Routing & sharing

### [ ] 5a. Real detail route `/anime/:id`
**Files:** new `src/pages/AnimeDetail.tsx`, route in `src/App.tsx`, links in
`src/components/ShowCard.tsx`.
- Add `<Route path='/anime/:id' element={<AnimeDetail />} />`.
- `AnimeDetail` reads `:id` via `useParams`, calls `getAnimeById` (or
  `/anime/{id}/full` for relations/recommendations later), renders a richer view
  (big poster, trailer, synopsis, episodes/status/studios, streaming).
- **Backward-compat:** the current permalink handler in `Home.tsx` reads
  `?id=`. Replace with a redirect: if `?id=` present on Home, `navigate('/anime/' + id, { replace: true })`. Keep `?q=` search permalinks on Home.
- **Routing already supports this:** basename `/Anime-Site` + `public/404.html`
  (`pathSegmentsToKeep=1`) already handle `/Anime-Site/anime/123` deep-link refreshes.
**Effort:** Medium. **Gotcha:** make `ShowCard` link to `/anime/:id` (wrap title or
add a "Details" affordance) without breaking the existing expand-on-click — e.g.
the card still expands inline; the detail route is reached via title link / "Details".

### [ ] 5b. Native Web Share API
**File:** `src/components/ShowCard.tsx` (`onShareClick`) + detail page.
```ts
const shareData = { title: displayTitle, url }
if (navigator.share) { try { await navigator.share(shareData) } catch {} }
else { /* existing clipboard copy + "Copied!" */ }
```
**Effort:** Low. **Gotcha:** must stay inside the click handler (user gesture);
HTTPS only (GitHub Pages is fine). Keep clipboard fallback for desktop.

### [ ] 5c. Shareable favorites list
**Files:** `src/pages/Favorites.tsx`, `src/contexts/ShowContext.tsx` (read-only helper).
- **Share:** "Share my list" button builds `/anime-site/favorites?ids=<mal_id,mal_id,...>`
  from current favorites.
- **Open:** if `Favorites` sees `?ids=`, fetch each via `getAnimeById` (throttled +
  cached automatically) and render a **read-only "Shared list"** view with a
  "Save these to my favorites" button — don't silently merge into the user's list.
**Effort:** Medium. **Gotchas:**
- No batch-by-ids endpoint in v4 → N requests. **Cap at ~24 ids** and show a count;
  the 350ms throttle means a 24-item list takes ~8s — show skeletons/progress.
- URL length: ids are short, 24 is well within limits.

---

## Suggested build order

1. **Phase 0** (type, query builder, endpoints, pagination) — unblocks everything.
2. **Phase 1** (trailer + episodes/status) — fast, visible payoff, no refactor.
3. **Phase 2** (filters/sort in the panel) — pure form wiring on top of 0b.
4. **Phase 5a** (detail route) — needed before autocomplete can deep-link.
5. **Phase 4** (autocomplete) — links into the detail route.
6. **Phase 3** (browse modes) — the one meaningful Home refactor; do when ready.
7. **Phase 5b/5c** (Web Share, shareable favorites) — independent polish, any time.

## Verification per phase
- `npm run build` (tsc + vite) and `npm run lint` after each phase.
- Manually: expand a card (trailer plays, episodes/status show), run a filtered +
  sorted search, switch browse tabs, open a shared `/anime/:id` and `?ids=` link.
