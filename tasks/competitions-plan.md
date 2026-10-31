# Implementation Plan: Public competitions catalogue

## Overview

Create the public `/competitions` page from the supplied mockup. Reuse the landing header, stadium hero treatment, and footer while leaving the authenticated `/competiciones` dashboard intact.

## Design contract

- Purpose: browse the six supported competitions and understand their fixtures, coverage, and sources.
- Keep the existing GlorIA typography, purple accent, football wallpaper, and footer background.
- Desktop: three competition columns; four fixture cards; coverage and sources side by side.
- Tablet: two competition columns and two fixture columns; coverage and sources stack when needed.
- Mobile: single column, usable search/select controls, readable coverage grid, same public header/footer.
- Data integrity: show historical model coverage only for the five leagues that have local datasets; don't invent future kickoff times.

## Tasks

### Phase 1: Public route and shared navigation
- [x] Add `/competitions` without changing authenticated `/competiciones`.
- [x] Point public header/footer and the home catalogue link at `/competitions`.

### Phase 2: Catalogue and evidence
- [x] Render the six requested competitions with working search, region filter, and popularity ordering.
- [x] Render the four classic matchups as editorial examples without fabricated dates.
- [x] Explain provider support, local historical coverage, and six-hour API cache behavior accurately.

### Phase 3: Responsive review
- [x] Check 1440, 768, and 390 pixel layouts for overflow, hierarchy, focus, and menu behavior.
- [x] Run focused type/lint verification and resolve regressions caused by this feature.

## Verification

- `npm run typecheck`
- `npm run lint`
- Build not run: an existing Next dev server is using the same workspace's `.next` output.
- Real-browser screenshots at desktop, tablet, and mobile widths.

## Risks

| Risk | Mitigation |
|---|---|
| `/competiciones` is already authentication-protected | Add separate public `/competitions`; do not move or replace the protected route. |
| Live fixtures require `FOOTBALL_DATA_KEY` | Do not claim sample matchups are scheduled; link each to the official agenda view. |
| Champions League has no local historical dataset | Mark historical/statistical coverage unavailable for that row. |
