# Landing → Profile Pivot

**Status:** Done
**Owner:** Dominick
**Date:** 2026-04-28

## Goal
Reframe the xomware.com landing page from a generic "AI-powered apps" hero into a personal profile for Dominick. Add iOS variants of Xomify and XomFit (TestFlight), split apps by platform (web vs iOS), and add a footer "Report an issue" link.

## Non-goals
- Live Spotify/Xomify integration (recently played, top tracks). Deferred — see Follow-ups.
- Per-app bug-report form with repo routing. Deferred to its own plan — see Follow-ups.
- Touching the command center, agent scene, monster component, or any other route.
- Backend/API work.

## Scope

### 1. Hero → Profile section
Replace the current "Building the future, one app at a time" hero with a profile block. Keep the ambient blobs (`<app-monster>`) and lightning behind it — those stay.

**Content:**
- Headshot: hotlink `https://github.com/dominickgiordano.png` (work GitHub avatar). GitHub serves avatars with caching, no CORS issues for `<img>` tags. Round mask, sized ~140px.
- Name: **Dominick Giordano**
- Role line: Senior Software Engineer @ [Arete Capital Partners](https://aretecapitalpartners.com/team/dominick-giordano/)
- Bio: short — building personal apps under the Xomware brand. ~2 lines max.
- Link row (icon buttons, opens in new tab):
  - LinkedIn → `https://www.linkedin.com/in/dominick-giordano`
  - GitHub (Xomware org) → `https://github.com/Xomware`
  - GitHub (personal) → `https://github.com/domgiordano`
  - GitHub (work) → `https://github.com/dominickgiordano`
- Single CTA below: "Explore Apps" → `#apps` anchor (drop the "View on GitHub" CTA — it's now in the link row).

**Drop:**
- The "AI-Powered Development" badge
- The hero gradient title text
- The "@domgiordano" subtitle line (now in link row)

### 2. App cards: web vs iOS split
Today: one flat `apps[]` grid. After: two subsections under the same `#apps` anchor — **Web Apps** and **iOS Apps (TestFlight)**.

**Data model:** add `platform: 'web' | 'ios'` to the `AppCard` interface. Render two grids by filtering on platform. Same card visual treatment in both.

**iOS subsection note** (renders once above the iOS grid): "TestFlight builds — email [dominickj.giordano@gmail.com](mailto:dominickj.giordano@gmail.com) to be whitelisted."

**Card list after change:**

| Name | Platform | Status | URL | Tag |
|---|---|---|---|---|
| Xomify | web | live | https://xomify.xomware.com | Web App |
| XomCloud | web | live | https://xomcloud.xomware.com | Web App |
| Xomper | web | live | https://xomper.xomware.com | Web App |
| Xomify | ios | live | https://testflight.apple.com/join/5CQaJ2mB | iOS · TestFlight |
| XomFit | ios | live | https://testflight.apple.com/join/xttcUQwT | iOS · TestFlight |
| Float | ios | coming-soon | https://float.xomware.com | iOS · Coming Soon |

Notes:
- Xomify gets two cards (web + iOS) — distinct URLs and audiences. Reuse the same logo asset.
- XomFit web card removed (it was a `coming-soon` placeholder). iOS is what's live now.
- Float stays as iOS coming-soon (matches its current data + repo confirms it's a Swift/iOS project).

### 3. Footer: Report an issue
Add a footer link next to the existing GitHub link: **"Report an issue"** → `https://github.com/Xomware/xomware-frontend/issues/new`. Single repo target for v1. The full per-app form lives in the follow-up plan.

## Files Touched
- `src/app/components/landing/landing.component.ts` — `AppCard` interface (add `platform`), update `apps[]` data
- `src/app/components/landing/landing.component.html` — hero rewrite, apps section split, footer link
- `src/app/components/landing/landing.component.scss` — profile section styles, headshot frame, iOS note style

No new assets needed (avatar hotlinked).

## Risks
- **GSAP scroll selectors:** `initScrollAnimations()` targets `.hero-content`, `.section-header`, `.app-card`, `.footer-inner`, `.cards-container`. Keep these class names on the new structure so animations don't silently break.
- **Two `.cards-container` instances** (web + iOS): GSAP currently triggers a single stagger on `.cards-container`. With two grids, either (a) target both via `gsap.utils.toArray('.cards-container')` and run a stagger per-grid, or (b) keep a single stagger over all `.app-card` elements. Pick whichever looks better; (a) is cleaner.
- **`<app-monster>` / lightning:** confirmed staying. No changes.
- **Avatar hotlink failure mode:** if GitHub serves a 404 (e.g. account renamed), the headshot breaks silently. Acceptable for v1; can self-host as a follow-up if it becomes a problem.

## Repo mapping (for the bug-report follow-up plan)
Documented here so the follow-up doesn't have to re-derive it.

| App | Platform | Repo |
|---|---|---|
| Xomify | web | `Xomware/xomify-frontend` |
| Xomify | ios | `Xomware/xomify-ios` |
| XomCloud | web | `Xomware/xomcloud-frontend` |
| Xomper | web | `Xomware/xomper-front-end` *(note: hyphenated, different convention)* |
| Xomper | ios | `Xomware/xomper-ios` |
| XomFit | ios | `Xomware/xomfit-ios` |
| Float | ios | `Xomware/Float` *(capitalized, no suffix)* |
| xomware.com | web | `Xomware/xomware-frontend` |

Convention: `<app>-frontend` / `<app>-backend` / `<app>-infrastructure` for web; `<app>-ios` for iOS. Xomper-frontend and Float break the convention — flagged.

## Follow-ups (separate plans)
- **Bug-report form** — modal or `/report` route with app picker + body field. Builds prefilled `github.com/<repo>/issues/new?title=...&body=...` URL, opens in new tab. Repo mapping above. No backend, no token storage.
- **Live Xomify listening card** — recently played / top 5 rotation on the profile. Needs a backend with a stored Spotify refresh token (small Lambda or similar). Track separately.

## Test Plan
- [x] `npm start`, load `localhost:4200`, profile section renders with all four links clickable and opening in new tabs
- [x] Headshot loads from `github.com/dominickgiordano.png`
- [x] Apps section shows Web Apps (3 live) and iOS Apps (2 live + Float coming-soon), both grids responsive
- [x] iOS section shows the whitelist note above the grid
- [x] TestFlight links open in new tab
- [x] Footer "Report an issue" link points to xomware-frontend issues/new
- [x] GSAP animations still fire on scroll (hero/profile fades, section headers slide in, cards stagger in both grids)
- [x] Mobile menu still works
- [x] `npm run build:prod` succeeds with no new TS errors
- [x] `npm test` passes

## Execution order
1. [x] Update `AppCard` interface + `apps[]` data in `.ts` (add `platform`, add iOS variants, drop XomFit web)
2. [x] Rewrite hero in `.html` (profile block with headshot + links)
3. [x] Split apps section in `.html` (two grids + iOS whitelist note)
4. [x] Add footer "Report an issue" link
5. [x] Style new profile + iOS note + two-grid layout in `.scss`
6. [x] Verify GSAP selectors still match; adjust stagger to handle both grids
7. Manual browser test (desktop + mobile widths)
8. [x] `npm run build:prod` + `npm test`
