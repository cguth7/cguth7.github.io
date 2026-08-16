# data.json — contract v1

**This file is the only seam between the engine and the site.**

`engine/export.py` writes `docs/data.json`. `docs/app.js` reads it. Neither side may
reach past this document. The engine can be rewritten in another language, the site can
be rebuilt in another idiom — as long as both honor contract v1, they keep working.

- **Producer:** `engine/export.py` (ported from `event_wizard_chicago/export.py`; the
  bundle is byte-compatible with Chicago's, so tooling is shared).
- **Consumer:** `docs/app.js`, loaded by `index.html` and `map.html`.
- **Transport:** a single JSON file, `docs/data.json`, fetched with a relative path from
  the same directory. No API, no build step, no query language.
- **Second file:** `docs/philly_hoods.geojson` — see [Neighborhoods](#neighborhoods).

## Versioning

This is **contract v1**. Rules:

- **Adding** a key to an object is a *minor* change. The site must ignore unknown keys.
- **Removing or retyping** a key is a *breaking* change. It requires contract v2, a note
  in this file, and a site change in the same commit.
- **Nullability is part of the type.** A field documented `string|null` may be null in any
  export; the site must render without it. Widening a non-null field to nullable is
  breaking.
- **Date fields are not uniform.** `events[].date` is a bare `YYYY-MM-DD`; `generated` and
  `series[].first_date`/`last_date` are full ISO datetimes. Every consumer reduces to a day
  key before comparing. Don't "fix" this without a version bump — the datetimes are what
  keeps the bundle byte-compatible with Chicago's export.
- The site never assumes a collection is present. `bundle.series` in particular is absent
  from pre-v1 fixtures and is read as `bundle.series || []`.

## Top level

```json
{ "generated": "...", "city": "...", "weights": {...}, "meta": {...},
  "sources": [...], "groups": [...], "venues": [...], "events": [...], "series": [...] }
```

| key | type | notes |
|---|---|---|
| `generated` | `string` | ISO 8601 local datetime of the export, e.g. `2026-08-16T19:16:58.608782`. No timezone suffix. Site renders it as a date only. |
| `city` | `string` | `"Philadelphia"`. |
| `weights` | `object` | dim name → weight (`number`, 0–1). The six keys below; sums to ~1.0. Drives the composite and the display order of dimensions in the detail overlay. |
| `meta` | `object` | Counts, for the ops view and the footer. Advisory only — **never** the basis of a render decision; the site counts the arrays itself. |
| `sources` | `array` | Where events come from. Not shown on the human pages. |
| `groups` | `array` | Presenters/organizers. Not shown on the human pages. |
| `venues` | `array` | See below. Drives the map. |
| `events` | `array` | See below. The product. |
| `series` | `array` | See below. **May be absent** in older exports. |

### `weights`

Exactly these six keys, which are also the six score dimensions:

`social_quality`, `serendipity`, `uniqueness`, `community_building`,
`solo_friendliness`, `value_for_price`

### `meta`

`events`, `scored`, `venues`, `sources`, `flyers`, `duplicates_suppressed`,
`scrapers_built`, `scrapers_todo`,
`venues_no_pipeline`, `venues_with_feeds`, `feed_links`, `groups`, `series` — all
`number`. `series` is absent when `series` is absent. Additive; treat every key as
optional.

`duplicates_suppressed` counts same-real-venue/day event observations retained in the DB
but omitted from this export by the conservative cross-source identity layer. Storage is
source-scoped; a source observation is evidence even when the public site serves another
source's version of that event.

## `events[]`

The unit of the product. One row per event *instance* (a weekly series produces many).

| field | type | notes |
|---|---|---|
| `id` | `number` | Stable within one export only. Used as the DOM key and the overlay target. |
| `name` | `string` | Display title. Not empty. |
| `start` | `string\|null` | ISO 8601 local datetime, no zone. `null` if unknown. |
| `all_day` | `boolean` | When true, `time` is `null`. |
| `date` | `string\|null` | `YYYY-MM-DD`, local. **The site sorts, groups and range-filters on this as a plain string** — lexicographic order is chronological order, no `Date` objects on the hot path. |
| `time` | `string\|null` | `HH:MM` 24h, local. `null` for all-day or unknown-time events. |
| `venue_id` | `string\|null` | Slug FK into `venues[]`. |
| `venue` | `string\|null` | Denormalized venue name. Null when `venue_id` doesn't resolve. |
| `venue_kind` | `string\|null` | `bar`, `library`, `park`, `church`, `gallery`, `community_center`, `other`, … Open vocabulary — the site must not switch on an exhaustive list. |
| `lat` | `number\|null` | Denormalized from the venue. Null means **not mappable**; the map skips it, the list does not care. |
| `lng` | `number\|null` | Same. |
| `group_id` | `string\|null` | FK into `groups[]`. |
| `group` | `string\|null` | Denormalized group name. |
| `source_id` | `string\|null` | FK into `sources[]`. Internal; never surfaced on a human page. |
| `category` | `string\|null` | Free text from the source, e.g. `"Music, Theater, Fringe"`. Not a controlled vocabulary — **do not build filters on it.** |
| `tags` | `array\|string\|null` | Source-dependent, often null. Unused by the site. |
| `cost` | `string\|null` | Human cost string as published: `"$20"`, `"Free"`, `"Paid"`, `"$10–$25"`. Display verbatim; never parse it for logic. |
| `cost_min_cents` | `number\|null` | Parsed floor in cents. `0` means free, `null` means no signal in the text. |
| `is_free` | `boolean\|null` | **Tri-state.** `true` = confirmed free, `false` = confirmed paid, `null` = unknown. The Free filter matches `true` only (plus a `cost === "Free"` fallback, below). Most events are `null`; that is expected, not a bug. |
| `series_id` | `string\|null` | FK into `series[]`. Null = one-off. |
| `description` | `string\|null` | Plain text, **truncated server-side to ~400 chars**. HTML and CSS are stripped in the adapter, not here. |
| `image` | `string\|null` | Absolute URL. Unused by the site in v1. |
| `url` | `string\|null` | Canonical event page. The only outbound link the site offers. |
| `discovered_via` | `string\|null` | `flyer`, `scrape`, `api`, … Provenance. Internal. |
| `scores` | `object\|null` | **Null when unscored.** See below. |
| `quality` | `number\|null` | The weighted composite, 0–10, one decimal. **Null when unscored.** Null is not zero — an unscored event sorts last and shows no badge, it does not show `0.0`. |
| `score_category` | `string\|null` | Coarse bucket from the scorer. Advisory. |
| `description_quality` | `string\|null` | `rich` \| `thin` \| `missing`. Ops signal. |

### `events[].scores`

`null`, or an object keyed by dimension name. **Dimensions may be individually
missing** — the site iterates `weights` and skips absent dims rather than assuming six.

```json
"scores": {
  "social_quality":     { "score": 8, "reason": "People come to talk while they work…" },
  "serendipity":        { "score": 6, "reason": "…" },
  "uniqueness":         { "score": 8, "reason": "…" },
  "community_building": { "score": 3, "reason": "…" },
  "solo_friendliness":  { "score": 5, "reason": "…" },
  "value_for_price":    { "score": 6, "reason": "…" }
}
```

| field | type | notes |
|---|---|---|
| `score` | `number` | Integer 0–10. |
| `reason` | `string` | One or two sentences from the scorer, referencing *this* event. **May be `""`.** |

**`reason` is the product's voice, not debug output.** The detail overlay renders all six
reasons as the main body of the panel. An empty reason renders as nothing, never as a
placeholder.

## `series[]`

A recurring thing you can join. **The whole `series` key may be absent** — read it as
`bundle.series || []`.

| field | type | notes |
|---|---|---|
| `id` | `string` | FK target for `events[].series_id`. |
| `name` | `string` | Series name. May be `""`. |
| `venue_id` | `string\|null` | FK into `venues[]`. |
| `venue` | `string\|null` | Denormalized venue name. |
| `neighborhood` | `string\|null` | Denormalized from the venue. Usually null. |
| `cadence` | `string` | `run` \| `weekly` \| `biweekly` \| `monthly` \| `irregular`. |
| `n_dates` | `number` | Distinct dates observed. |
| `median_gap_days` | `number` | Median gap between dates. |
| `first_date` | `string\|null` | **Full ISO datetime**, e.g. `2026-08-19T19:00:00` — *not* `YYYY-MM-DD`, unlike `events[].date`. Kept in this shape for byte-compatibility with Chicago's export. The site reduces it with `dayOf()` (slice to 10) before any comparison or formatting. |
| `last_date` | `string\|null` | Same — full ISO datetime. |

**Joinable** is defined by the site as `cadence ∈ {weekly, biweekly, monthly}`. `run` (a
limited run) and `irregular` are *not* joinable — a run isn't a habit. The `↻` glyph
means joinable, not merely "recurring".

## `venues[]`

| field | type | notes |
|---|---|---|
| `id` | `string` | Slug. |
| `name` | `string` | |
| `kind` | `string\|null` | Same open vocabulary as `venue_kind`. |
| `address` | `string\|null` | |
| `neighborhood` | `string\|null` | **Unreliable — null for most venues.** The map derives neighborhood geometrically from `philly_hoods.geojson` instead of trusting this field. |
| `lat` | `number\|null` | Null = not mappable. |
| `lng` | `number\|null` | |
| `website` | `string\|null` | |
| `hosts_events` | `string\|null` | `regular` \| `occasional` \| `no` \| `unknown`. Ops. (Corrected 2026-08-16, Job H: this said `yes` \| `no` \| `unknown`, a value the engine has never written — `models.Venue.hosts_events` defaults to `unknown` and the real export carries unknown 387 / regular 139 / occasional 35 / no 5. Open vocabulary in practice; ops-only, no page switches on it.) |
| `status` | `string\|null` | `candidate` \| `confirmed` \| … Ops. |
| `verified_by` | `string\|null` | Ops. |
| `maybe_fake` | `boolean` | Ops. |
| `pipeline` | `string` | `built` \| `planned` \| `broken` \| `none` — the best status among sources that actually produced events here. Ops. |
| `feeds` | `array` | Coverage rows. Ops. |
| `event_count` | `number` | Events in this export at this venue. |

## `sources[]` and `groups[]`

Ops collections. `tables.html` renders them; the three human pages do not.

- **`sources[]`**: `id`, `name`, `kind` (adapter), `has_api`, `website`,
  `scraper_status`, `scraper_ref`, `last_scraped`, `publisher_kind`, `publisher_id`,
  `is_aggregator`, `event_count`.
- **`groups[]`**: `id`, `name`, `kind`, `website`, `status`, `verified_by`, `feeds`,
  `event_count`.

## Neighborhoods

`docs/philly_hoods.geojson` — a `FeatureCollection` of 25 `MultiPolygon` features.
Coordinates are GeoJSON order (`[lng, lat]`).

| property | type | notes |
|---|---|---|
| `name` | `string` | Display name, e.g. `"Fishtown - Lower Kensington"`. Also the selection key. |
| `order` | `number` | Tour order, West Philly → South Philly → Fishtown. Drives the hood strip order. |

Features may contain interior rings; the point-in-polygon test XORs across all rings of a
polygon so holes are handled. The spotlight mask uses outer rings only.

## What the site guarantees

The engine may ship a partial export at any time — early runs are partially scored, and
that is a normal state, not an error. The site therefore holds these invariants:

1. **Unscored renders.** `scores: null` / `quality: null` → the listing appears with no
   badge, sorts after every scored event, and its overlay says so plainly. It is never
   hidden and never shown as `0.0`.
2. **Missing collections render.** `series` absent → no `↻` anywhere, the Joinable filter
   yields nothing, no crash.
3. **Missing coordinates render.** `lat`/`lng` null → the event is absent from the map and
   present in the list.
4. **Missing text renders.** Null `description`, `url`, `cost`, `venue`, `time` each drop
   their element rather than printing a placeholder.
5. **Free is inferred conservatively.** `is_free === true`, or `is_free` is null *and*
   `cost` matches `/^\s*free\b/i`. `is_free === false` is never treated as free.
6. **Stale exports degrade quietly.** If nothing falls in the next 7 days, the site widens
   to the next window that has listings — or, if every event is in the past, shows the
   most recent week and says so in one mono line.

## Non-goals for v1

No pagination, no incremental fetch, no server. The whole bundle is downloaded once per
page load. The seven-day Philadelphia export is 258 events / 969 KB as of 2026-08-16,
which is comfortable for this shape. If the bundle passes ~8 MB, split by window and
revisit this contract.

**Export window.** `export.py` ships events in `[today 00:00, today + --days)`, default 7
days, half-open. Events on the horizon date itself are excluded. The window is a producer
default, not part of the contract — a consumer must never assume the bundle covers any
particular span.
