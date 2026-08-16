# Philly Bulletin site buildout brief

The visual source of truth is the Reality prototype set recovered from the
Trenton workspace on 2026-08-16: its rendered style guide, city home, source
board, detail pages, sitemap, and handoff. This brief records the parts being
adapted here so the implementation is self-contained.

## Product boundary

- Keep the existing Philly Bulletin identity and its real `data.json` contract.
- Show only the next seven days. The database may retain farther-out history,
  but both ingest and public export default to one week.
- Preserve the three reader surfaces: ranked Bulletin, neighborhood map, and
  About. The ledger remains an explicitly secondary operations view.
- Keep the event score reasons in the detail sheet. They are the product's
  evidence, not decoration.

## Design contract

- Warm paper page plane (`#f7f6f2`) with white card surfaces.
- Newsreader/Iowan-style serif for page and section headings; monospace for
  body, controls, labels, data, and navigation.
- One deep green (`#0c6b2c`) for links, active affordances, bars, and pale tint
  fills. Status never relies on color alone.
- Sentence-case serif headings and uppercase mono micro-labels.
- Rounded, hairline-bordered list/card surfaces; honest counts and freshness
  are visible wherever useful.
- Mobile must reflow instead of clipping. The reference's visual language is
  authoritative, not its narrow-screen overflow bug.

## Page adaptation

### Bulletin

- Compact top navigation with a serif brand and a green week CTA.
- A date-led hero, plain-language lede, and live listing/source counts.
- Pill filters inside the event-list surface.
- Events remain grouped by day and ranked best-first, with rank, time, title,
  venue, neighborhood, cost, recurrence, and score visible in the row.
- Detail opens in an accessible sheet with all six scores and reasons.

### Map

- Keep the working Leaflet behavior and shared filters.
- Restyle map chrome, neighborhood chips, pins, popup, and side panel to the
  same paper/card/green system.

### About

- Lead with “Make real life easier than the feed.”
- Keep the existing human explanation of discovery, scoring, recurring events,
  and limitations, composed with the shared design components.

## Acceptance

- Engine tests remain green.
- Export defaults to seven days and contains no event outside the half-open
  `[today, today + 7 days)` window.
- Index, map, about, and event detail render without console errors at desktop
  and 390px mobile widths.
- No horizontal page overflow at 390px.
