# Session manifest

Running log of what's been done and the ongoing plan. Newest session first. Each session appends: **done / decided / next**. Keep entries dense — this file is the cross-session memory.

---

## Current state (as of 2026-07-17)

**The registry works end-to-end and is live.** Edit source → `npm run registry:build` → commit + push → any repo runs `npx shadcn add @astro-shad/<name>` against `https://raw.githubusercontent.com/sethsticle/astro-shad/main/public/r/{name}.json`. Confirmed by adding `card` into `spike-consumer` from the public GitHub repo.

Live items: `theme`, `utils`, `button`, `badge`, `card`, `tabs`, `accordion` (accordion = first multi-file item). Repo is an Astro 7 app; playground at `/dev`; astro-icon installed for future icon-prop components.

## Ongoing plan

1. **Component aggregation sweep** (next session): go through prior projects and aggregate the components built individually across them, converting to neutral primitives per `docs/standards.md`:
   - `~/KCA_DD_System_Ops/kca-astro` — ~37 converted components already following the recipe (see `docs/investigation.md` §2 for the inventory); richest source, start here.
   - `~/localProjects/astro-boilerplates/prod-builds/jmn_world-astro`
   - `~/localProjects/astro-boilerplates/prod-builds/pcl-astro`
   - Work in category batches: primitives → text FX → visual FX → sections. De-brand tokens on the way in; source repos keep their customised copies untouched.
2. **`/create` token studio** — mapped plan in `docs/plans/create-page.md`. Depends on a healthy primitive set to preview against.
3. **Brand variant collections** — mapped plan in `docs/plans/brand-variants.md`. Depends on the aggregation sweep surfacing real variants.
4. **Icon convention migration** — components with icon props adopt astro-icon string names as they're converted (standards.md §2); no separate migration pass needed if enforced during the sweep.
5. **Spike-2: `@/` alias delivery test** — one test component with a `@/lib/utils` import, `add` into spike-consumer, diff. If byte-safe (or correctly rewritten), imports could switch from relative paths; until then relative is law. Cheap; fold into any session.
6. **Split `registry.json`** via `include` composition (`registry/primitives.json`, `registry/sections.json`, …) once item count makes the single file unwieldy (~15+).
7. **Later:** doc site, licence check on tailark-derived sections before they join the public repo, blocks/layouts tier (SiteHeader, Footer, page skeletons).

---

## Sessions

### 2026-07-19 (h) — @astro-shad/forms: shared honeypot/escapeHtml/mailer/captcha registry lib

**Done:**
- New registry item `forms` (`registry:lib`, inserted after `motion`): `src/lib/forms/{index,honeypot,escape-html,mailer,captcha}.ts`, zero runtime deps, barrelled through `index.ts`. `isHoneypotTripped(formData, field)` and `escapeHtml(value)` are the always-on, no-external-setup helpers. `createResendMailer(apiKey)`/`createCloudflareMailer(binding)` both return the same `Mailer` (`{ send(message): Promise<void> }`) shape, so an endpoint's `mailer.send(...)` call site is identical regardless of provider — swapping is swapping which factory built it. `verifyTurnstile(token, secret)`/`verifyRecaptcha(token, secret)` share one `siteverify`-POST implementation (`verifyCaptchaToken`) since both providers verify a challenge token the same way. Deliberate design boundary stated in the header comments: this is NOT a generic form-handler framework — each form endpoint (contact today, a newsletter/story-submission form later) keeps its own POST handler and field shape; only the safety net is shared. `registry:validate` passed (45 items).
- Closed a real gap found while auditing the two reference projects from the previous session: `pcl-astro`'s `contact.ts` (Option B, Cloudflare Email Sending) has **no honeypot and no HTML-escaping** — user-supplied fields land unescaped in an internal team's inbox. `jmn_world-astro` (Option A, Resend) has both, but hand-rolled per-project rather than shared. This repo's dummy `src/pages/api/contact.ts` now wires `isHoneypotTripped`/`escapeHtml` for real (not just documented) — honeypot check runs first and replies with a plain success on trip (never a distinct signal a bot could learn from); every field is escaped into an `htmlPreview` string before the dummy logs it, standing in for what a real mailer's `html` argument would be. `/dev` board 6's `Form` instance gained the matching hidden `_trap` input so the live demo actually exercises it.
- Mailer/captcha are documented as commented-out toggle-line blocks in `contact.ts`'s header comment (exact import + two commented factory-call lines + one commented `mailer.send(...)`) rather than live-wired — both need real per-domain credentials (a Workers secret, a Cloudflare binding, or a Turnstile/reCAPTCHA site+secret keypair) that a local playground can't fabricate.
- `docs/forms-and-submissions.md` renumbered §5 onward to insert a new §5 ("The shared toolkit — `@astro-shad/forms`"); §4's code sample and bullets now show the honeypot check and `escapeHtml` call for real; §7 (safety notes, was §6) updated to say honeypot/escaping are live, not just flagged, and adds the Turnstile/reCAPTCHA-exists-but-not-wired note; §8 (was §7) points to the mailer + captcha section of the companion doc.
- `docs/forms-email-providers.md` gained two new sections: "The shared abstraction: `@astro-shad/forms`'s `mailer.ts`" (shows both factories + the toggle-line call site) and "Bulk/bot spam protection: Turnstile and reCAPTCHA" (setup steps for both, per explicit user request to cover both widgets, not just one) — plus rewrote the closing "Applying this to the dummy endpoint" section to reference the real toggle-line comments now in `contact.ts` instead of describing a hypothetical swap.
- `docs/graduation-queue.md`: new `forms` row, status `built` (design-intent + wiring notes for a future docs-session pass; no `/docs/components/*.astro` sidebar page written yet — this session's docs work went into the two markdown files instead, same precedent as the `motion`/`gsap-hero-01` split).

**Decided:** the module stays a flat toolkit of independent helpers (no `FormEndpoint` class or generic handler wrapper) — confirmed against the user's explicit framing ("all forms can use their own post methods... simple toggleable lines"). Mailer/captcha are real, tested-shape code but deliberately left uncalled in this repo's own endpoint (no fabricated credentials); only honeypot + escaping — the two gaps that don't need external setup — are actually exercised end-to-end here.

**Next:** whenever a real form ships from this registry (or a future consumer project), the toggle-line comments in `contact.ts` are the copy-paste starting point. A formal `/docs/components/forms.astro` sidebar docs page is still open (this session's docs stayed in the two top-level markdown files) — future docs session.

### 2026-07-19 (g) — forms-email-providers.md: Resend vs Cloudflare Email Sending, from real deployed projects

**Done:**
- New `docs/forms-email-providers.md`, companion to `forms-and-submissions.md` §7. Documents two email-sending patterns that already run in production, sourced from two live client boilerplates (`localprojects/astro-boilerplates/prod-builds/jmn_world-astro` and `.../pcl-astro`, both `@astrojs/cloudflare` Workers deployments) rather than invented from scratch: **Option A** — Resend, a plain `fetch` to `api.resend.com` authenticated by a `RESEND_API_KEY` Workers secret, portable off Cloudflare, includes the honeypot (`_trap`) and HTML-escaping (`h()`) details from `jmn_world-astro`'s handler; **Option B** — Cloudflare's native `send_email` binding (`env.EMAIL.send(...)`), no third-party account, authenticated by Worker identity, requires `wrangler email sending enable <domain>` and a `wrangler.jsonc` binding, sourced from `pcl-astro`. Comparison table + a documented real-world reversal (`jmn_world-astro` tried the CF binding first, moved to Resend because the CF free tier's recipient-verification restriction doesn't scale across client handovers — captured from the archived comment block left in that project's own `contact.ts`/`wrangler.jsonc`).
- Cross-linked from `forms-and-submissions.md` §7.

**Decided:** doesn't touch this repo's dummy `/api/contact.ts` or the `/dev` board 6 demo — explicitly scoped as a docs-only reference for when a real form needs real email later (per user instruction).

**Next:** none — reference doc, no registry/queue impact.

### 2026-07-19 (f) — Card imageSide prop; forms-and-submissions learning doc + real /api/contact wiring

**Done:**
- `Card.astro` gained `imageSide?: 'top' | 'right' | 'bottom' | 'left'` (default `'top'`, backward compatible). `left`/`right` switch the card to `flex-col lg:flex-row lg:items-stretch` (image column `lg:w-1/3 shrink-0`, `right` adds `lg:order-last`); below `lg` it always stacks image-first, same mobile-first-stack rule as `sections/Split-01.astro`'s `reverse`. `top`/`bottom` keep the existing full-width-image-in-flow behaviour. `/dev` board 2 (Cards) gained two new cards exercising `imageSide="left"`/`"right"`.
- User-driven learning exercise on native (non-React) form submission: wrote `docs/forms-and-submissions.md` — walks `Form.astro`'s Constraint Validation API wiring (novalidate + delegated script + reward-early revalidation + `demo` mode), what a zero-JS `<form action method>` actually does on submit (full navigation), the new dummy endpoint, and the dev-board fetch-interception script, plus a safety-notes section (client validation is UX-only, content-type allowlisting, `textContent` not `innerHTML`, same-origin by default, CSRF/rate-limiting/auth explicitly flagged as NOT yet handled).
- New dummy endpoint `src/pages/api/contact.ts` (first API route in the repo): `POST` handler, `prerender = false`, parses `request.formData()`, re-validates server-side independently of the browser, `console.log`s the received submission (the extension point for real actions later — email/DB/notifications), returns JSON (`{ok, data}` / `{ok:false, errors}`, 200/422/415).
- `/dev` board 6 (Forms) reworked: two-column layout, `demo` removed from the `Form` (now a real `action="/api/contact" method="post"` submission), right column is a live request/response log panel (`<pre id="dev-contact-log">` + Clear button). New page-level script in `dev.astro` (separate from and independent of `Form.astro`'s own listener — it does its own `form.checkValidity()` check rather than relying on listener ordering) intercepts the valid-submit case via `fetch` so the round trip prints on screen instead of navigating away.

**Decided:** the fetch-interception + log panel is dev-board-only teaching scaffolding, not added to the shipped `Form.astro` registry component — a real consumer form either does the native full-page POST (zero JS) or wires its own fetch handler; `Form.astro`'s contract (validate → demo-or-native-submit) stays unchanged. `output`/adapter left untouched (still no adapter configured) — `astro dev` runs the endpoint fine locally; production deploy of a real form needs one, noted in the doc rather than solved now.

**Next:** user to try board 6 live (empty submit, valid submit, watch the log panel + terminal `console.log`) and read `docs/forms-and-submissions.md`. `Card` `imageSide` and the `/api/contact` dummy are both build-session output — neither has a `docs/graduation-queue.md` row yet (Card is a prop addition to an already-shipped item, not a new registry item; the API route isn't a registry item at all). `registry:build` + commit + push still pending (user-run).

### 2026-07-19 (e) — replayMotion() + Replay button in docs/dev previews

**Done:**
- `lib/motion.ts` gained a new export, `replayMotion(root?)`: cancels every `Animation` on `[data-motion]` elements within `root` (collapsing `fill: forwards` back to the underlying CSS cascade -- the pre-hide rule for load/in-view, natural visible state otherwise) and replays from the same data-attributes `initMotion()` already wired, bypassing triggers entirely so `in-view`'s one-shot `IntersectionObserver` never needs to re-observe. Baked-in `motionStagger` delays survive untouched (already sitting in `data-motion-delay`). Docs/dev tooling only -- not something a shipped consumer page needs to call.
- `ComponentPreview.astro` (docs) and `DevBoard.astro` (/dev) both gained a small "Replay" button, shown only when the preview/board actually contains `[data-motion]` (checked client-side, hidden otherwise -- most previews have none and stay clean). Each scopes its `replayMotion()` call to just its own preview/board root, so replaying one never disturbs another's in-view state. `VariantBlock.astro`-based family pages (accordion, map, ...) get this for free since they wrap `ComponentPreview`.
- `/docs/components/motion.astro` gained a short section documenting the new export.

**Decided:** this ships inside the registry-published `lib/motion.ts` (not a dev-only fork) since it's small and harmless for real consumers to have available too, even though its primary use is this repo's own preview tooling.

**Next:** user eyeballs the Replay button on `/docs/components/motion` (all four demo groups) and a couple of `/dev` boards (13's gsap-hero-01 won't show one -- it's not `data-motion`-based; 17's Motion pilot will) before `registry:build` + commit + push.

### 2026-07-19 (d) — /docs-session: motion documented (gsap-hero-01 deliberately deferred)

**Done:**
- Retroactively added a `docs/graduation-queue.md` row for `motion` (it had been registry-published directly in an earlier session without going through the ledger — fixed for completeness) and flipped it to `documented 2026-07-19` at the end of this session.
- Cold-read `src/lib/motion.ts` against `frontend-contract.md` — zero violations, nothing fixed. Well-scoped, well-commented, matches the plan doc exactly.
- New docs page `src/pages/docs/components/motion.astro`: leads with a "Before you start" callout (map.astro's pattern) stating the two-piece bootstrap requirement plainly — forgetting `initMotion()` while the pre-hide CSS is active leaves elements at `opacity: 0` permanently, called out as a content-disappears bug, not a degraded-animation one. Covers all three triggers, the stagger helper, the full preset table with per-family modifier semantics (length/percent/degrees/color), and notes the three documented-but-not-built future presets (`blur-out`, `flip`, SVG stroke draw-in) without implying they exist. Explicitly scoped OUT: GSAP/tier-2 coverage, deferred per the user's instruction — `gsap-hero-01` stays out of docs for now.
- Four new demo files under `src/components/docs/demos/motion/`: `Basic` (load), `Hover` (hover, no-modifier + bracket), `Stagger` (in-view + `motionStagger`, all three modifier forms on one family), `ColorBg` (bracket-only family). All lifted from the hand-verified `/dev` board 17 content, not newly invented.
- **`DocsLayout.astro` now wires the motion bootstrap site-wide** (`MOTION_PREHIDE_CSS` + `initMotion()` in `<head>`, same precedent as the existing theme-restore inline script) — required for the new docs page's live demos to actually animate; harmless on every other page (inert sweep, finds nothing). Resolves the "global injection" question from an earlier session in the one place it was actually blocking — /dev stays page-level bootstrap (bare page, no shared layout) with its comment updated to stop saying "no registry.json entry yet."
- `docs-nav.ts`: new "Motion" group, one item.
- Applied the `interface Props {}` guard (session manifest 2026-07-17 f gotcha) since the new docs page's frontmatter holds a bootstrap-snippet template literal with tag-strings.
- Did not touch `registry.json` — no violations found, so `registry:validate` was not re-run per the skill's boundary (only required when a registry.json fix is made).

**Decided:** `gsap-hero-01` stays undocumented and its queue row untouched (`built`) — explicit user instruction, GSAP docs are a separate future session.

**Next:** whenever GSAP docs happen — `gsap-hero-01`'s docs page needs the npm-dependency callout + sidebar badge from the Phase 2 plan (applies retroactively to `map` too). User to eyeball `/docs/components/motion` live (theme toggle, all four demo groups actually animating) before commit + push.

### 2026-07-19 (c) — @astro-shad/motion registry publish + GSAP Phase 2 grilled + gsap-hero-01 built

**Done:**
- `@astro-shad/motion` registry-published: `registry.json` gained a `registry:lib` entry (`motion`, `src/lib/motion.ts`, no dependencies), inserted right after `utils`. `lib/motion.ts` header comment updated from "not yet a registry item" to "Registry item: @astro-shad/motion". `registry:validate` passed.
- `docs/plans/motion-system.md` gained: bootstrap-script requirement section (pre-hide CSS + `initMotion()` must ship/be documented together — a forgotten call leaves elements permanently `opacity: 0`, not just unanimated), queued for a docs session; three documented-but-not-built tier-1 additions (`blur-out`, `flip`, SVG stroke draw-in — the last explicitly NOT treated as a tier boundary, since WAAPI gives draw and GSAP gives draw+morph, both intentionally exist); `initMotion()` self-invoke-on-import polish deferred to *after* Phase 2, not before (touching the bootstrap contract mid-GSAP-work risks destabilizing what tier 2 depends on).
- **Phase 2 (GSAP) fully grilled and locked** (`docs/plans/motion-system.md`, "Phase 2" section rewritten). Corrected a factual error in the original draft: it cited Hero-01..04/Accordion numbered-variant convention as version-pinning precedent — checked `registry.json`, that's wrong (`map`'s `dependencies` is a bare unversioned `["maplibre-gl"]`; the Hero/Accordion numbering is a design-variant convention with zero npm deps involved). Decisions locked: caret-floor versioning (`gsap@^3.13.0`, not exact-pinned — GSAP 3 has had no breaking major in years); numbered-variant rule kept anyway as cheap backstop; bespoke-per-component architecture (Map.astro precedent, no shared tier-2 lib); stock-GSAP porting philosophy (deliberately NOT funneled through `motion.ts`'s preset vocabulary, so found GSAP templates can be pasted in with minimal translation — different from tier 1's full-rewrite conversions); standing naming rule `gsap-<family>-NN` (not the originally-suggested `parallax-hero-01`); written pass bar for a second GSAP item to ship; npm-dependency docs callout + sidebar badge (applies retroactively to `map` too, docs-session follow-up).
- **Built `gsap-hero-01`**, first tier-2 item: `src/components/astro-shad/sections/GsapHero-01.astro`. Ships populated like Hero-01 (same content-block-comment convention), but the `background` slot wrapper is a real ScrollTrigger scrub target (`yPercent -10→10`, oversized `inset-x-0 -top-[15%] -bottom-[15%]` to cover both scroll extremes) — genuine continuous scroll-linked animation, not something WAAPI/`@astro-shad/motion` could do, so it doesn't undercut the tier split. Code is stock ScrollTrigger boilerplate (`registerPlugin` + one `gsap.fromTo` with a `scrollTrigger` config), no custom abstraction, per the porting-philosophy decision. `resolveScroller()` walks up for the nearest scrollable ancestor before falling back to `window` (needed because `/dev`'s board preview area is its own `overflow-y: auto` container) — same ancestor-walk shape as `Map.astro`'s `resolveTheme()`. `prefers-reduced-motion` skips ScrollTrigger creation entirely. Known, stated-honestly gap: no `.kill()` cleanup, acceptable today since this repo has no Astro view-transitions anywhere (plain MPA nav), flagged for whenever that changes.
- `registry.json`: new item `gsap-hero-01` (`dependencies: ["gsap@^3.13.0"]`, `registryDependencies: [utils, badge, button]`), inserted after `hero-04`. `package.json` gained `"gsap": "^3.13.0"` in `dependencies` (same pattern as `map`'s `maplibre-gl`, needed for `/dev` to run locally). `/dev` board 13 ("Layout sections") gained a `gsap-hero-01` group. `registry:validate` passed — 44 items total.
- `docs/graduation-queue.md`: appended `gsap-hero-01` row, status `built`, dense notes for the docs writer including the pass-bar status (criteria 1 and 2 not yet closed — see Next).

**Decided:** see the Phase 2 grill summary above — all captured directly in `docs/plans/motion-system.md`, not just this log.

**Next:** user runs `npm install` (picks up `gsap`), then `npm run dev` and eyeballs board 13's `gsap-hero-01` group (scroll to see the parallax scrub, both themes) — this is untested live, only validated structurally. Pass-bar item 1 (registry install path tested end-to-end via `spike-consumer`) is still open — do that before a second GSAP item gets built. Docs session still owed: motion.ts bootstrap-script requirement, npm-dependency badge (new, applies to `map` too), gsap-hero-01 itself once its queue row is reviewed. After user eyeballs: `registry:build` + commit + push (user's to run).

### 2026-07-19 (b) — motion system Phase 1b (full WAAPI expansion) + dev.astro fixes

**Done:**
- 1a pass bar confirmed by the user -- board 17 verified live (all four cases, both themes, reduced-motion). Two bugs found during that check, fixed in `lib/motion.ts`: (1) hover trigger was calling `cancel()` on every `mouseenter`, which snaps a scaling element instantly back to full size -- if the cursor sat right at the border, the snap moved the edge back under it, firing another `mouseenter` and looping as fast as the browser could dispatch events; fixed by ignoring re-entrant triggers while one is still playing instead of cancelling it. (2) reported "static, not triggering" on the `load` case was not a bug -- `load` fires once, immediately, when the script runs after parse, regardless of scroll position; by the time a user pages over to board 17 the transition had long finished. Added `DEFAULT_BOARD` (0-based board index) to `dev.astro`'s token-controls script so a board can be loaded directly for testing instead of always starting at board 1.
- Also fixed the standing pagination TODO: pill row now lives in a max-width, horizontally-scrollable `#pagination-scroll` strip (hidden scrollbar, same treatment as `#preview-scope`) instead of growing unbounded; `syncPills()` scrolls the active pill into view.
- **Phase 1b**: `lib/motion.ts` expanded to the plan's full tier-1 preset territory -- fade family (4 directions, was 1 in 1a), slide family (4 directions, translate-only, no opacity change), `scale-in`/`scale-out` (was just `scale-in`), `rotate`, `blur-in`, `color`/`bg` (bracket-only, resolves to the element's own computed color/background as the end keyframe). Preset dispatch moved from an ad hoc base list to a `PRESET_REGISTRY` mapping each base to its modifier kind (`none`/`length`/`percent`/`degrees`/`color`), which is what makes `fade` correctly reject any modifier and `color`/`bg` correctly require the bracket (no bare, no bare-less default -- there's no sensible default color). `MOTION_PREHIDE_CSS` narrowed to exclude `slide-*`/`color`/`bg` from the opacity pre-hide, since those families never touch opacity and hiding them would blank content that was never meant to disappear (documented trade-off: their transform/color-only start state may show a small initial-frame pop, judged acceptable vs. a full content flash). Added `motionStagger(amountMs)` -- spread onto a parent, bakes `index * amount` into each direct `[data-motion]` child's own `delay` in a pre-pass before the main sweep, replacing the manual per-index `delay` math the 1a demo used.
- Board 17 rebuilt to demonstrate all of it: Card grid now uses `motionStagger(100)` instead of manual delays; new groups for the fade/slide direction families, rotate + blur-in, and color/bg -- each staggered, each behind a spacer so `in-view` requires an actual scroll (per the earlier fix).
- Logged two user-requested future features into the plan doc's "Supporting work" section as backlog, **not built**: retrigger-on-scroll-back for `in-view` (currently fires once by design), and a view-progress/scrub timeline positioned as tier 1's answer to GSAP's timeline tooling -- natural home is the not-yet-built motion playground page.
- Still no `registry.json` entry -- motion.ts stays unpublished pending the user's decision on when to graduate it.

**Next:** user eyeballs board 17's 1b additions (all preset families, both themes) → decide when `@astro-shad/motion` gets its `registry.json` entry (Supporting work item, not gated on anything further per the plan) → registry:build → commit + push. Phase 2 (GSAP) stays out of scope until 1b is judged as complete as reasonably possible.

### 2026-07-19 — motion system Phase 1a pilot (docs/plans/motion-system.md)

**Done:**
- `src/lib/motion.ts` built for real (not a prototype): typed `motion(preset, options)` helper (`Preset` template-literal type over `fade | fade-up | scale-in`, `MotionOptions` with `trigger/duration/delay/easing`) returning a `data-motion-*` attribute object; `initMotion()` runtime sweeping `[data-motion]` via WAAPI `Element.animate()`; Tailwind-style modifier parser (bare-number, `[...]` bracket-arbitrary, no-modifier) with per-family bare-number units (px for `fade-up`, percentage-points of scale delta for `scale-in`); three triggers (`load` immediate, `in-view` via `IntersectionObserver` disconnecting after first fire, `hover` replaying the entrance keyframes on `mouseenter`+`focus` from the element's natural visible state); `MOTION_PREHIDE_CSS` (scoped to `load`/`in-view` only, with a `prefers-reduced-motion` override) plus a matching JS-side reduced-motion check that reveals instantly instead of animating.
- New `/dev` board 17 "Motion pilot" (page-level `<style set:html={MOTION_PREHIDE_CSS}>` + one bootstrap `<script>` calling `initMotion()`): whole-block `fade-up` heading/paragraph on `load`; two `Button`s on `hover` (`scale-in` default + `scale-in-[0.8]` bracket); a 4-up `Card` grid on `in-view` with increasing `delay` (0/100/200/300ms stagger) covering `fade-up` (no-modifier, `-24` bare, `-[3rem]` bracket) and `scale-in-20` (bare); `Cta-01` full section on `in-view` with plain `fade`. Zero edits to `Button.astro`, `Card.astro`, or `Cta-01.astro` — all three already spread `{...rest}` onto their root element.
- **Not** added to `registry.json` — stays unpublished per the plan until the user eyeballs board 17 against the five-point pass bar below. `BubbleMenu`/`PixelTransition`/`MagicBento`/`Folder`/`GlassIcon`/`SplitText`/`HighlightedText`/`TextType`/`RotatingText`/`CountUp` untouched, per the plan's addressable-surface boundary.

**Pass bar (plan §Phase 1a) — self-assessed from source, needs the user's live eyeball to confirm:**
1. Parser: bare-number, bracket-arbitrary, no-modifier all implemented and exercised across `fade`/`fade-up`/`scale-in` on board 17 (`fade` only takes no-modifier by design — a pure-opacity preset has no spatial dimension to modify).
2. Zero component edits: confirmed by reading `Button.astro`/`Card.astro`/`Cta-01.astro` — all three spread `{...rest}`, `motion()`'s attrs ride that spread.
3. All three triggers wired and exercised on board 17 (load = heading block, in-view = Card grid + Cta-01, hover = the two Buttons).
4. Stagger: Card grid uses `delay: 0/100/200/300` via the existing `MotionOptions.delay` — no separate stagger API invented, per the plan not specifying one for 1a.
5. TS autocomplete: `Preset` is a template-literal type over the three bases (`PresetBase | \`${PresetBase}-${number}\` | \`${PresetBase}-[${string}]\``) — needs the user's editor to confirm autocomplete actually surfaces, not just type-checks.

**Next:** user eyeballs board 17 live (all four cases, both themes, reduced-motion OS setting) and confirms the pass bar → only then does `registry.json` get an entry + `registry:build`. Phase 1b (full WAAPI preset expansion) doesn't start until then.

### 2026-07-17 (v) — /docs-session: queue cleared (10 items)

**Done:**
- New docs pages: `logos-carousel` (cross-links logo-loop, markup-is-the-grouping note), `highlighted-text` (Basic + Edges/delay demos, blend-literal note), `button-group` (Basic + Mixed demos, three per-file PropsTables), `map` (FAMILY PAGE covering map + map-route + map-geojson as VariantBlocks: "Before you start" section carries the four load-bearing facts — consumer owns container height, token-theme basemap tracking, CustomEvents list, canvas-paint-can't-read-tokens; three demos incl. blank-basemap GeoJSON hover zones), `pulse-grid` (Basic + MultiColor, full props table, background-slot + init-time-only-props notes), `pixel-transition` (dual-card demo, inert-second-layer warning).
- `cta.astro` reworked to a two-variant family page (CTA 01 image band / CTA 02 animated band, titled VariantBlocks + pulse-grid cross-link). `rotating-text.astro` refreshed for the width-fit change (stale "fits the longest word" + "ZERO client JS" claims corrected, fonts.ready note added).
- Nav: Button Group → Primitives; Pulse Grid + Pixel Transition → Visual; Logos Carousel + Highlighted Text → Text FX; Map → Components. 13 demo files under demos/{logos-carousel,highlighted-text,button-group,map,pulse-grid,pixel-transition,cta}.
- Queue: all 10 pending rows flipped to `documented 2026-07-17`. **Queue is empty.**

**Contract review findings (cold-read of all 12 files):** everything clean — tokens/ladder/imports/header comments/explicit targets all conform; the sanctioned literals (highlighted-text white, map pin ring, canvas paint hex) are each commented in source. No violations fixed or outstanding.

**Next:** user eyeballs /docs (new pages, both themes; map page is the heavyweight — three live maps per visit) → registry:build → commit + push. Queue empty; next session can build freely.

### 2026-07-17 (u) — /build-session continued: pixel-transition (PixelTransition port, gsap deleted)

**Done:**
- `PixelTransition.astro` (item `pixel-transition`, from user-supplied react-bits PixelTransition): two stacked layers (`first`/`second` named slots) swap under a random-order pixel flash on hover/tap/focus. gsap fully deleted via the contract §4 baked-stagger pattern: per-pixel random `--px-in`/`--px-out` fractions set at build time drive two zero-length `steps(1)` animations (show fills forwards; hide starts one `--px-dur` later and wins by later-in-list precedence); `gsap.delayedCall` became a `--px-dur`-delayed visibility transition on the second layer; retrigger mid-animation = `.px-play` drop + reflow + re-add (≙ killTweensOf). `pixelColor` takes live CSS colors incl. tokens (DOM divs, not canvas — the opposite of pulse-grid's hex rule). Chrome de-branded to tokens, no fixed width; `aspectRatio` = CSS aspect-ratio; reduced-motion = instant swap; second layer inert while shown (source behaviour, documented).
- Registry validates (42 items). Dev board 16: image→text default, gridSize=12 accent-pixel 0.5s reverse card, `once` + 21/9 wide. Queue row appended — **queue at 10 pending, docs-session threshold REACHED: docs session before further building.**

**Next:** user eyeballs board 16 (flash randomness, swap timing at 0.3s vs 0.5s, once staying revealed, focus/tab trigger, touch tap if handy) → registry:build → commit + push. Then /docs-session.

### 2026-07-17 (t) — /build-session: pulse-grid (CursorGrid port, cursor stripped) + cta-02

**Done:**
- `PulseGrid.astro` (item `pulse-grid`, from user-supplied react-bits CursorGrid): canvas grid engine ported near-verbatim (falloff curves, holdTime→fadeDuration cell lifecycle, radial-gradient cell strokes, dpr clamp, wake/idle rAF that self-suspends when nothing is lit), but the pointer listeners are GONE per the user's call — replaced by an autonomous driver: jittered setTimeout averaging `speed` bursts/s at random points, `pulseChance` fraction becoming the source's expanding click-ring. New vs source: `colors` array (per-cell Uint8 color index remembers which burst lit each cell; lattice uses colors[0]), IntersectionObserver gates the timer off-screen, reduced-motion = static lattice only. Root is `pointer-events-none absolute inset-0` — purpose-built for `background` slots; colors are literal hex (canvas can't read tokens, map precedent), default mirrors dark `--accent` #60a5fa. Props travel as one JSON data-attribute; config is init-time only.
- `Cta-02.astro` (item `cta-02`, deps: utils, button, pulse-grid): cta-01's band structure with PulseGrid as the background-slot fallback — first section whose fallback is an animation item, not an image (the §7.8 effects-drop-in model made real). No scrim; needs a light-theme eyeball.
- Registry validates (41 items). Dev board 15 "Pulse Grid" (defaults / multi-color+fill+lattice+rounded / rings-only / dense-fast stress); cta-02 added to board 13. Two queue rows appended — **queue at 9 pending, docs session due next.**

**Decided:** ambient-animation items are their own registry items that sections consume via registryDependencies (one add pulls both); autonomous timers (not pointer events) drive background effects so the layer can stay pointer-events-none.

**Next:** user eyeballs board 15 (all four variants animate, idle CPU drops when cells fade out, stress case stays smooth) + board 13 cta-02 (text legibility over the animation in BOTH themes) → registry:build → commit + push. Then /docs-session — 9 pending rows.

### 2026-07-17 (s) — /build-session: map phase 3 — map-geojson

**Done:**
- `MapGeoJSON.astro` (item `map-geojson`, deps: @astro-shad/map): GeoJSON (inline object or URL) → fill + outline layers on the map-route re-add pattern. `fillPaint`/`linePaint` merge over theme-aware monochrome defaults (or `false` omits the layer); `mergeHoverPaint` ported verbatim — `fillHoverPaint` values become `case` expressions on hover feature-state, requires `promoteId`; `interactive` = pointer cursor + `map:geojson-click`/`map:geojson-hover` CustomEvents with feature payloads (hover fires feature:null on leave, only on feature change). Generics flattened to JSON props.
- **Map.astro change:** stamps the resolved theme on its root as `data-map-theme` (initial + every applyTheme) so layer children re-resolve theme-aware paint defaults at re-add time — deliberately NOT `data-theme`, which would feed back into resolveTheme's closest(). The observer filter (class/data-theme) doesn't see the stamp, no loop.
- Registry validates (39 items). Board 14 gains two groups: districts choropleth on `<Map blank>` (hover accent highlight via promoteId feature-state) and a translucent delivery-zone polygon over the street basemap. Queue row appended — queue at 7 pending, docs session approaching.

**Decided:** layer children read theme from the root stamp rather than resolving it themselves — one resolver (Map's), one source of truth. GeoJSON monochrome defaults stay literal hex per the paint-can't-read-tokens rule.

**Next:** user eyeballs board 14 groups 5-6 (hover highlight + cursor on districts, blank basemap showing the themed container, zone overlay, both survive theme toggle) → registry:build → commit + push. Phase 4 (map-arc + map-cluster) completes the port; queue will then be at 8-9 pending → /docs-session due.

### 2026-07-17 (r) — /build-session: map phase 2 — map-route + MapPopup

**Done:**
- `MapRoute.astro` (item `map-route`, deps: @astro-shad/map): GeoJSON line source+layer from a coordinates prop; color/width/opacity/dashArray/beforeId; interactive hover cursor + `map:route-click/-mouseenter/-mouseleave` CustomEvents. **First layer child — proves the phase-1 re-add hook:** source+layer re-add on the map root's `map:style-load` (theme swap wipes style layers); layer-scoped `map.on(event, layerId, …)` listeners registered once (safe before the layer exists, survive re-adds). This is the wiring template for phase-3/4 layer items.
- `MapPopup.astro` joined the `map` item (4 files now — shares the popup card chrome): standalone popup at lng/lat, slot content, optional close button, `map:popup-close` w/ `id`. Deliberate divergence: `closeOnClick` defaults FALSE (MapLibre default true) — a static popup that closes on a stray map click can never reopen; prop opts back in.
- Registry validates (38 items). Dev board 14 gains a fourth group: solid route + dashed green walking route between two labeled accent pins + MapPopup annotation + top-right controls. Queue: `map` row notes extended (MapPopup), `map-route` row appended — queue at 6 pending.
- Plan doc statuses updated (phases 1-2 built with field notes; phase 3 map-geojson next).

**Decided:** MapPopup lives in the core `map` item, not with map-route (chrome affinity beats phase affinity). Route paint defaults stay literal hex (#4285F4) — MapLibre canvas paint can't read CSS tokens; consumers pass a color string.

**Next:** user eyeballs board 14 group 4 (routes render, pointer on hover, popup annotation, routes SURVIVE the theme toggle — the re-add path's first real test) → registry:build → commit + push. Phase 3 (map-geojson: fill/outline + hover feature-state + mergeHoverPaint port) next build session.

### 2026-07-17 (q) — /build-session: map (mapcn port phase 1) + phased port plan

**Done:**
- Feasibility pass on mapcn's `map.tsx` (2,225 lines, React + MapLibre GL): confirmed the React layer is thin lifecycle glue over MapLibre's imperative vanilla API — portals/context/prop-reconciliation all deletable. Full 5-phase port mapped in **`docs/plans/phased-maps-plan-port.md`** (architecture decisions locked: inert-DOM-children + one wiring script, events-out-not-callbacks-in, instance exposed via `__astroShadMap` + `map:ready`, maplibre-gl as the registry's first vanilla runtime npm dep).
- **Phase 1 built — item `map`, three files:** `Map.astro` (MapLibre init, Carto light/dark basemaps, theme resolved prop > closest `[data-theme]` > doc > system and live-tracked via MutationObserver; theme swap = setStyle diff:false → `map:style-load` re-add hook for future layer children; `blank` tile-less style; globe projection; loader overlay; `map:load`/`map:moveend` events; is:global CSS neutralising MapLibre's white popup chrome), `MapMarker.astro` (mapcn's 5 marker components collapsed into slots: default content w/ primary-dot fallback, popup via inert `<template>` → `setDOMContent` — createPortal's job for free, tooltip, label; drag/click/hover as `map:marker-*` CustomEvents with an `id` prop), `MapControls.astro` (zoom / live compass needle / geolocate w/ 10s timeout + spinner / fullscreen; lucide icons inlined; hover:bg-accent → hover:bg-muted per the accent decision, dark: variant dropped per contract).
- Registry item with `dependencies: ["maplibre-gl"]` (first use of npm `dependencies` in this registry) + utils dep; validate passes (37 items). Dev board 14: business-location demo (marker+label+popup+all controls, Cape Town), custom-content/tooltip/draggable markers, globe projection. Queue row appended (`built`) — queue at 5 pending.

**Decided:** map children self-wire (own scripts, closest() + property-or-event) rather than Map knowing child types — keeps phase 2-4 additions zero-touch on Map.astro. Popup/tooltip chrome ships without animate-in classes (tw-animate-css not in repo). Carto basemap terms fine at free tier w/ attribution kept.

**Fix round (same session, after user's live test):** (1) theme toggle didn't swap the basemap — /dev DELETES data-theme in dark mode, so `closest('[data-theme]')` at init found nothing and the observer never watched the scope; also the system-preference fallback could put a light basemap under dark tokens. Fixed: resolveTheme re-runs per change via ONE subtree MutationObserver on documentElement (attributeFilter data-theme/class), and the fallback is now DARK (token default) — mapcn's matchMedia branch deleted, basemap follows tokens not OS. (2) marker popup didn't open — replaced reliance on MapLibre's marker.setPopup map-click plumbing with our own toggle on the content element: click w/ `stopPropagation()` (load-bearing — without it the same click bubbles to the map and popup closeOnClick removes it instantly, the exact trap maplibre's marker source comments on) + tabindex 0 + Enter/Space. (3) default pin dot bg-primary → bg-accent — primary is near-monochrome in the neutral theme and vanished against tiles. Confirmed working from user test: compass rotation, marker drag, globe.

**Next:** user re-eyeballs board 14 (theme swap on toggle, popup open/close incl. close button + click-away, accent pins) → registry:build → commit + push. Phase 2 (map-route + MapPopup) next build session; spike-consumer delivery test of the npm-dep path noted in the plan as phase 5.

### 2026-07-17 (p) — /build-session: logos-carousel, highlighted-text, button-group; rotating-text width fix

**Done:**
- `logos-carousel` (from a user-supplied react component): rotating alternative to logo-loop — logo groups swap in place, exit upward with blur, next rises in. Markup contract: each direct child = one group (react `count` chunking dropped). Rung-3 vanilla JS: interval flips one `data-state` per group; static enter/exit keyframes in `is:global` CSS; per-logo `--lc-d` stagger from DOM index. First group = no-JS/reduced-motion fallback.
- `highlighted-text` (from motion/react): highlighter mark slides in behind the text from any edge; `mix-blend-difference` + literal `text-white` (commented, contract-sanctioned) inverts text over the `bg-foreground` mark — theme-proof, no second color. Spring ≈ `cubic-bezier(0.22,1,0.36,1)` 500ms off `data-inview`; on-load (double rAF) or `inView` IO mode, `once={false}` replays.
- `button-group` (from shadcn base-ui, 3 files): ButtonGroup + ButtonGroupText (`as` prop replaces useRender) + ButtonGroupSeparator (Separator primitive INLINED as a bg-input line — none exists in the registry). cva → maps; data-slot child selectors → `*:first/last-child` so any children work; radius overrides use `!` to beat the child's own rounded-md (specificity tie otherwise). Zero JS.
- **rotating-text width fix** (user-reported: wrapper snapped to the longest word, short words got dead space): a second per-instance keyframe track animates `width` through `--rt-w0..n` vars on the same clock as the word loop; script measures words after `document.fonts.ready`, sets vars, adds `.rt-fit`. Custom properties in keyframes resolve live, so the width track is phase-locked to the already-running word animations for free. Words `justify-self: start` (grid stretch broke measurement). No-JS/reduced-motion = old behaviour. No longer zero-JS; registry description updated.
- Registry 36 items; dev board 14 (all three new components) + width-fit example on board 9. Queue: 4 rows appended (`built`).

**Decided:** grouping-by-markup beats a `count` prop for slot-based Astro (chunking opaque slot HTML would need parsing); the var-in-keyframes trick is the sanctioned way to sync measured values into a running zero-JS CSS animation.

**Next:** user eyeballs boards 9 + 14 both themes (logos rotation timing, highlight blend in light mode, button-group radii/border collapse incl. vertical + nested) → registry:build → commit + push. Queue at 4 pending.

### 2026-07-17 (o) — first /docs-session: queue cleared (10 items), Layouts nav group established

**Done:**
- Docs for all nine section items as five family pages (accordion-page precedent, VariantBlock per item, `previewClass="p-0"` so sections render full-bleed): `hero.astro` (hero-01..04 + "How sections work" copy-and-own explainer), `split.astro` (basic + reverse, `reverse` PropsTable), `feature-grid.astro` (`columns` PropsTable, cross-link to feature-section), `feature-section.astro` (01+02, FEATURES-array editing section, transitions note), `cta.astro`. Ten minimal demo files under `demos/{hero,split,feature-grid,feature-section,cta}/` (sections ship populated, so demos are bare `<Hero01 />` calls).
- "Layouts" nav group added to docs-nav.ts (Hero / Split / Feature Grid / Feature Section / CTA).
- Accordion docs refresh: `highlight` row added to the AccordionItem PropsTable (demos already used it).
- Queue: all 10 pending rows flipped to `documented 2026-07-17`. Queue is empty.

**Contract review findings (cold-read):**
- FIXED — hero-04's media panel: img filled a `rounded-lg` wrapper without `overflow-hidden`, square corners overflowed the radius.
- REPORTED, not touched — FeatureGrid-01 demo content: the 4th card duplicates card 3 verbatim ("Copy-and-own" ×2) and orphan-wraps 3+1 at default `columns={3}`; also hero-04's media panel reuses hero-03's background image (SpVw8IvJJjE) — both user-added, user's call.
- Everything else clean against the contract (tokens, ladder, imports, targets, header comments).

**Next:** user eyeballs /docs (Layouts group, both themes) → registry:build (accordion demos changed earlier in the day; sections unchanged by docs) → commit + push. Then the carousel primitive build, then the hero-04 design pass.

### 2026-07-17 (n) — feature-section-01/02: fuller-copy feature sections; motion/react conversion pattern settled

**Done:**
- `feature-section-01` (from shadcn-studio): header block + six icon feature cards. Demo content as a frontmatter FEATURES array (inline lucide path strings rendered via `set:html`); Avatar icon tile → token-tinted div; per-card color props → one neutral `hover:border-primary/40`. Zero JS. Deps: utils, button.
- `feature-section-02` (from shadcn-space, motion/react): badge/heading/CTA header row + testimonial card over an image panel (Unsplash eggs, swap-for-local comment) + 2x2 muted icon cards. Entrance animations converted per the SplitText pattern: CSS transitions keyed off `data-inview` flipped once by an IntersectionObserver, source cubic-bezier preserved, 100ms card stagger via `--fs2-d`, prefers-reduced-motion guard. Initials circle stands in for the missing avatar primitive. Deps: utils, badge, button.
- Registry items + dev board 13 groups; validate passes (33 items). Queue rows appended — **queue at 10 pending, docs session threshold reached.**

**Decided (answered user's motion question, now precedent):** entrance-on-view effects need no keyframes — transitions + one data attribute. Duplicate scripts are a non-issue (Astro hoists/dedupes component scripts). If keyframes are ever genuinely needed, they ship via the registry item's `css` block — never by asking consumers to edit globals.css (§6).

**Next:** /docs-session (10 pending). User: eyeball board 13, registry:build, commit + push. Carousel primitive still queued as the next build target (then hero-04 design pass).

### 2026-07-17 (m) — hero demo images + hero-04 (split + feature row)

**Done:**
- Unsplash demo images shipped as `background` slot *fallbacks* (both customisation paths stay open: edit the img src, or fill the slot): hero-01 dark abstract curves (2bfHAKhGn4g) + `bg-background/60` scrim; hero-02 aerial forest (oMgtkpr3Cpg) + bottom gradient scrim (`bg-linear-to-t from-background`); hero-03 volcanic peaks (SpVw8IvJJjE) + scrim; cta-01 telescope/sea (vx_rXh_KTjQ) + `bg-background/70` scrim, with the eggs image (e6W48UPKijo) left as a commented alternate. URLs use the `/photos/<id>/download?w=…` endpoint (redirects to the CDN image; page URLs don't work in img src).
- New `hero-04` — split hero simplified from a shadcn-studio restaurant hero: headline/actions left (rounded-full buttons, inline arrow in Button's icon-right slot), media placeholder right standing in for the source's embla triple-synced carousel, icon-feature card row beneath (plain divs + inline lucide svgs). Deps: utils, button. Registry item + dev board 13 group + queue row. Validate passes (31 items).
- Contract §7.2 updated: background slot may ship a demo image + scrim as fallback; noted the download-URL convention.

**Next (user-stated plan):** rebuild the carousel as a primitive (embla-style, vanilla — scroll-snap is the likely rung), then a design-focused pass on the section skeletons for more advanced hero variants. Queue at 8 pending — /docs-session due before much more building.

### 2026-07-17 (l) — sections model reworked: ships-populated replaces slot-fallback wireframes

**Done:** user reviewed batch 1 and called the slot-fallback wireframe mechanic over-abstracted (structure/rhythm verdict: keep exactly). Reworked all six sections to the shadcn-blocks model the user prototyped in Hero-01: each file ships WITH real demo content (astro-shad primitives + neutral copy), so `<Hero01 />` renders a complete block; customisation is copy-and-own editing, with the content block delimited by a `<!-- content — yours to edit -->` comment. Content slots deleted (`media`/`footer`/`items`/default gone); `background` remains the one named slot (effects pass). Sections now import primitives relatively from `../` and declare them: hero-01 → badge+button, hero-02 → button, hero-03 → button+card, split-01 → button, feature-grid-01 → card, cta-01 → button (+utils on all). Registry descriptions updated; validate passes (30 items). Contract §7 rewritten (populated model, `background`-only slot, new §7.5 primitive-deps rule; the same-day `items` vocabulary entry removed with the vocabulary). Dev board 13 simplified to bare `<Section />` calls (user had already collapsed it; stale wireframe copy fixed). Queue notes for the six rows rewritten to the new model.

**Decided:** demo content in a section is the wireframe — two-in-one; slot indirection cost more than it paid. Split's media placeholder = token-styled surface (`bg-muted` + border) the consumer swaps for their img/video.

**Next:** user eyeballs board 13 → registry:build + commit + push. Queue at 7 pending → /docs-session due.

### 2026-07-17 (k) — first /build-session: six layout skeletons (sections batch 1)

**Done:**
- New `src/components/astro-shad/sections/` batch per contract §7, all slot-fallback wireframes with layout-only props: `Hero-01` (centered stack + background slot), `Hero-02` (bottom-left anchored), `Hero-03` (centered + auto-fit footer feature strip), `Split-01` (half/half media+content, `reverse`), `FeatureGrid-01` (heading block + items grid, `columns` 3|4), `Cta-01` (narrow centered band on card surface, in-band background slot).
- Six registry items (explicit targets, path===target, utils dep); validate passes at 30 items.
- `/dev` board 13 "Layout skeletons": all six as wireframes, plus hero-01 populated (proving fallback replacement), split-01 reverse, feature-grid columns=4.
- Queue: six rows appended (`built`) with docs-writer notes; queue now 7 pending — approaching the ~10 docs-session threshold.
- **Contract change (deliberate):** added `items` to the §7 slot vocabulary — repeated-children grid region where the section owns grid classes; `footer` stays positional. Motivated by feature-grid-01.

**Decided:** hero-03's footer strip uses an auto-fit grid (`minmax(13rem,1fr)`) instead of a columns prop — 3 or 4 children adapt automatically. Sections wrap their container INSIDE the section (mx-auto max-w-6xl px-6) so consumers drop them full-bleed.

**Next:** user eyeballs board 13 both themes → registry:build + commit + push. Then a /docs-session (7 pending rows: accordion highlight refresh + six sections; establish the "Layouts" nav group).

### 2026-07-17 (j) — surgical: header01/header02 duplicates consolidated into top-bar/floating-header

**Done:** the registry had four items over two files — `top-bar`/`floating-header` (semantic, accurate descriptions) AND duplicate `header01`/`header02` items pointing at the same TopBar/FloatingHeader sources+targets, with the docs written against the duplicates. Consolidated on the semantic names (source filenames already matched; hyphen-less `header01` also clashed with the `accordion-02`/`hero-01` numbering convention): deleted the duplicate registry items (24 items now, validate passes); renamed docs pages + demo folders + nav entries to top-bar/floating-header; removed stale `public/r/header01.json`/`header02.json`. **Breaking for anyone who added `@astro-shad/header01|header02`** — items were days old, accepted. Queue rows for both flipped to `documented`.

**Next:** user rebuilds + commits; then first `/build-session` for the six layout skeletons.

### 2026-07-17 (i) — internal contracts: frontend-contract.md + build/docs pipeline + project skills

**Done:**
- `docs/frontend-contract.md` — the canonical rules doc: full graduation of standards.md §1–6 (with §3 gaining the accent-token decision and §6 gaining the variant convention + "publishing never waits for docs"), plus NEW §7 layout contract (slot-fallbacks-are-the-wireframe, fixed slot vocabulary [default/background/media/footer/aside], layout-only props, rhythm rules [min-h-svh heroes, py-16 md:py-24, max-w-6xl px-6, no outer margins], `sections/` placement + `hero-01` naming, effects as separate background-slot items) and NEW §8 session pipeline (build vs docs stages, graduation queue, >10 pending = docs session overdue).
- `docs/graduation-queue.md` — the build→docs handoff ledger; seeded with the real backlog: top-bar (no docs page), floating-header (no docs page), accordion `highlight` prop (docs refresh — page predates the prop).
- Project skills (repo-committed, team-shared): `.claude/skills/build-session/SKILL.md` and `.claude/skills/docs-session/SKILL.md` — thin entry points that load the contract and enforce stage boundaries (build: no docs work; docs: cold-read review against contract, no new components; both: user runs build/commit/push, validate allowed).
- `docs/standards.md` retired to a pointer stub; CLAUDE.md read-first + working rules updated to the contract and pipeline; docs intro Workflow text updated.

**Decided:** two-stage pipeline because build and docs have different tempos — docs written after an item stabilises on /dev are written once; the docs session's cold read doubles as the contract-drift review. Layouts phase (planned, not yet built): boxes-first skeleton set (hero-01 centered, hero-02 bottom-left, hero-03 + footer feature strip, split-01, feature-grid-01, cta-01), gallery used as taxonomy source, population + effects as later passes.

**Next:** first `/build-session` for the six layout skeletons; a `/docs-session` to clear the seeded queue; user to eyeball the new /docs/usage page live.

### 2026-07-17 (h) — /docs/usage: the consumer walkthrough page

**Done:**
- New docs page `src/pages/docs/usage.astro` ("Usage & requirements") under Getting started: fresh Astro + Tailwind v4 scaffold → components.json (full block, tsx:true called out as load-bearing) → tsconfig alias → theme/utils first adds → global.css wiring → usage example → token re-brand → the team workflow (setup → brand tokens → choose layouts → pull components → customise) → troubleshooting mapped from the how-it-works gotchas. Content mirrors docs/how-it-works.md §7; that doc stays canonical.
- Nav: "Usage & requirements" added to Getting started in docs-nav.ts; intro page's Install section links to the walkthrough.
- Page inlines code snippets as frontmatter template literals (tag-strings) — added the `interface Props {}` compiler-panic guard from session (f).

**Why:** team training — colleagues follow this page so every future project starts with the same structure; user is live user-testing it.

**Next:** user user-tests the walkthrough end-to-end from a clean machine/repo; then back to component building, then layouts.

### 2026-07-17 (g) — accordion highlight prop ported to variants 02/03; accordion-03 registered

**Done:**
- Ported the `highlight` optional prop (user hand-added it to AccordionItem earlier: open state gets `border-primary` on the item frame + `text-accent` on trigger text/icons) to `Accordion-02Item.astro` and `Accordion-03Item.astro`. 03 uses the named group (`group-aria-expanded/accordion-trigger`) for the icon accent.
- Added the missing `accordion-03` entry to `registry.json` (user had created Accordion-03/Accordion-03Item manually but not registered them).
- Docs demos: `Boxed02.astro` and `Icons.astro` each show `highlight` on their open item; copy updated to match.

**Follow-up (same session):**
- `Icons.astro` demo imports switched from `@/` aliases to relative (imports law).
- Root-caused the "accent blacks out text" report: `--accent` was #262626 (near-black) in the dark block AND had **no light-mode override**, so both themes rendered highlight text illegibly. Decision: accent is now this theme's chromatic highlight token — a deliberate divergence from stock shadcn where accent ≈ muted hover surface. Values: dark `#60a5fa` / fg `#0a0a0a`; light `#2563eb` / fg `#fafafa`. Pagination (sole `hover:bg-accent` consumer) moved to `hover:bg-muted` — visually identical to before, keeps hovers neutral.
- `registry:validate` run and passing (26 items, accordion-03 included).

**Next:** user runs `registry:build`, checks `/dev`//docs demos in both themes (accordion highlight + pagination hover), then commit + push. Rebuilt items to expect: theme, pagination, accordion-02, accordion-03 (new), plus the earlier demo/doc changes.

**Symptom:** in Zed, astro-shad only — formatting worked but no Emmet/completions/tag auto-close. Zed log showed astro-language-server crash-looping ("cannot read LSP message headers" → "server shut down").

**Root cause (fully reproduced outside Zed):** upstream `@astrojs/compiler` bug, present in BOTH the Zed-bundled 2.13.1 and current 4.0.0. `js_scanner.GetPropsType` panics (`slice bounds out of range`) when a frontmatter string contains a markup-like tag (`'<Badge>x</Badge>'`) AND the bare word `Props` appears as text in the template (`<h2>Props</h2>`): the scanner runs past the frontmatter and slices its buffer with a whole-file offset. Minimal 4-line repro:
```astro
---
const demo = '<Badge>x</Badge>';
---
<h2>Props</h2>
```
Our docs pages are exactly this pattern (demo template literals + Props headings); 5 of 18 panicked (byte-offset dependent — the rest passed by luck). Repeated panics kill the compiler's Go/WASM runtime, which kills the LS process, which kills Emmet/auto-close (they come from the LS in Zed). Quoting style is irrelevant (single-line strings, join() — all panic); `PropsTable` identifier and `Properties` text are safe; only the exact bare `Props` token triggers.

**Fix applied:** an explicit `interface Props {}` "compiler guard" (with do-not-remove comment) in EVERY docs component page's frontmatter — the scanner finds the real Props inside bounds and stops. Verified: 0 panics across all 50 .astro files on both compiler versions. **Rule going forward: any .astro page whose frontmatter holds markup-like strings gets the guard** (only the docs pages pattern does this today).

**Also this session (Zed migration):** removed .vscode/ (wrong editor); added `.zed/settings.json` (prettier formatter + format-on-save for astro/ts/json, tailwindcss-language-server added to Astro), `.prettierrc` (astro + tailwind plugins, `tailwindStylesheet` pointing at global.css so v4 theme utilities sort correctly), prettier/plugins as devDependencies. User must: `npm install`, install Zed Astro + Emmet extensions, reload. Worth reporting the compiler bug upstream (withastro/compiler) with the 4-line repro.

### 2026-07-17 (e) — surgical: Button icon slots, astro-icon demos, two header primitives

**Done:**
- Button: optional `icon-left` / `icon-right` named slots either side of the label (BASE's flex gap spaces them; empty slots render nothing — zero cost when unused). Header comment now documents the consumer customisation path: new looks = one VARIANTS key in the copied file (the "sprite variant" case), not a new component. Docs page updated (icon demo + slots table).
- astro-icon demoed on /dev: board 1 gains an icon-button row, board 3 shows GlassIcon fed by `<Icon name="lucide:...">` alongside the hardcoded-SVG row. Mechanism: string name → SVG data from `@iconify-json/lucide` at build → inline `<svg>` in the HTML, zero runtime (this is why icon *props* use string names per standards §2).
- Two header primitives, extracted from the user's tweaked DocsLayout header: `TopBar.astro` (item `top-bar` — full-width, border-b, contained inner row) and `FloatingHeader.astro` (item `floating-header` — detached pill, `radius` prop lg→full, translucent card fill + blur). Shared slot contract: brand / nav / actions, all optional, justify-between. Props: `sticky` (default true; TopBar top-0, FloatingHeader top-2), `containerClass`, `navClass` (nav defaults to hidden-below-sm). Width stays a class concern.
- DocsLayout now consumes FloatingHeader (identical rendering to the user's tweak; width classes passed via class). /dev board 12 shows TopBar + three FloatingHeader radii, sticky off so demos stack. Registry at 22 items.

**Next:** registry:build + commit. Docs pages for the headers once proven from a consumer repo (per the docs workflow).

### 2026-07-17 (d) — /docs scaffold: hand-rolled documentation front

**Done:**
- Decided against Starlight (its own theming system would mean the docs shell never demonstrates our token contract) in favour of hand-rolled `/docs` pages — **zero new dependencies**: plain .astro pages (no MDX), Astro's built-in Shiki `<Code>` for snippets.
- Scaffold: `src/components/docs/docs-nav.ts` (sidebar manifest — one line per component to document), `src/layouts/DocsLayout.astro` (sticky header, sidebar from the manifest, mobile drawer, theme toggle persisted to localStorage), `Snippet.astro` (single place for the highlight theme), `PropsTable.astro`, `ComponentPreview.astro` (live demo frame + zero-JS details Code disclosure — deliberately not Tabs: multiple previews per page would collide on Tabs' DOM ids).
- `/docs` index: intro, install steps incl. the three consumer gotchas (tsx:true, theme.css import, relative imports), component card grid from the nav manifest, workflow note.
- 18 component pages under `src/pages/docs/components/` — every registry component: preview(s), install command, accurate props tables (incl. slots tables where relevant), notes. CurvedLoop documents the experimental `path` prop with a live custom-path demo and an `exp` sidebar badge.
- **Architecture inversion vs /dev is deliberate:** /dev chrome is fixed and token-immune; the /docs shell is built FROM astro-shad primitives (Button, Badge, Card) and styled entirely by theme.css — the docs site is the registry's first real consumer and its living proof.
- Fixed Tailwind v4 gotcha: leading-bang important (`md:!hidden`) is dead in v4 — replaced with plain `md:hidden` layering in both dev.astro and DocsLayout backdrops.

**Decided:**
- Docs workflow: convert → /dev board (QA) → prove from a consumer repo → add one docs-nav.ts line + one page file. Sidebar/grid update automatically.
- Hosting: Cloudflare Worker (static assets) on a dummy subdomain for now, dedicated domain later. Clean root URL → no base path anywhere. Deploy not yet set up.

**Next:** run `/docs` live (sidebar drawer at mobile width, theme toggle, details code disclosures, DatePicker/BubbleMenu demos); then registry:build + commit. Later: Cloudflare Worker deploy, Pagefind search if wanted, per-page "View source" embeds via ?raw imports.

### 2026-07-17 (c) — /dev rebuilt as the token playground (shadcn/create model)

**Done:**
- Ported the kca-astro DevBoard structure: `src/components/dev/DevBoard.astro` (dev-only, NOT a registry item) + full dev.astro rewrite — sidebar, bordered canvas with a horizontal snap scroller of 11 boards, floating pagination pills, keyboard arrow nav.
- **Chrome/preview split (the big architectural change from kca):** sidebar, canvas frame, board header strips, and pills are chrome — fixed literal colors (`#0b0b0c/#131316/#26262b/#e4e4e7`), never token utilities, styled once. ALL token overrides land as inline custom properties on `#preview-scope` (the scroller), so only the astro-shad components inside the boards respond. Dark/light flips via `data-theme` on the scope too (theme.css uses `[data-theme="light"]`, not `html[...]`), so even mode changes never touch chrome.
- Sidebar controls (shadcn/create-inspired): Mode, Theme preset (default/violet/blue/emerald/rose/amber), Base color (neutral/stone/zinc/slate/gray — full shadcn slot-var maps per mode), Accent (dots + custom color input, sets --primary/--ring with luminance-picked foreground), Heading font, Content font (Google Fonts loaded dev-only; components stay font-free), Radius (0/0.3/0.5/0.75/1.0 rem).
- Collapsible sidebar: off-canvas drawer + backdrop on mobile, hide/show column on desktop — for testing components at mobile width.
- Readout + Copy emits a theme.css-format override block (`:root` + `[data-theme="light"]`, fonts in a commented block) for graduating trials into a consumer theme.

**Decided / learned:**
- Scoped theming is free because every component styles via var(--token): overrides on a wrapper element beat :root. This is the mechanism the /create page will reuse.
- **Radius gotcha:** `--radius-sm/md/lg` are calc()ed at :root, and var() inside a custom property resolves where DECLARED — overriding `--radius` on the scope does nothing; the control sets all four vars directly.
- PRESETS object in dev.astro is paste-friendly: tweakcn/shadcn theme presets drop in as `{ dark: {...vars}, light: {...vars} }` entries whenever the user supplies the list.
- Heading/content font overrides ride two page-level CSS hooks (`--font-heading`/`--font-content` + one scoped h1-h6 rule) since primitives deliberately carry no font-family.

**Next:** user to run `/dev` live — check board snap-scrolling, sidebar collapse at mobile width, and that chrome stays put under every toggle. Then registry:build + commit (includes batch-1 components below).

### 2026-07-17 (b) — kca-astro aggregation sweep, batch 1: primitives + text FX

**Done:**
- Pulled 15 new component files from kca-astro's devboards, all de-branded to neutral primitives per standards.md §4: GlassIcon, Folder (db1); Pagination, BubbleMenu (db4); Form, FormField, DatePicker (db5); MagicBento, BentoCard (db7); TextType, RotatingText, SplitText, CountUp, CurvedLoop, LogoLoop (db9 + LogoLoop from the skipped ScrollStack board).
- Extended Card with `image`/`imageAlt`/`bgImage` props (db3); added `overflow-hidden` to its base and a `text-white` scrim treatment for bgImage.
- Accordion: added `multipleOpen` boolean prop as an alias for `type="multiple"` (multipleOpen wins when both passed).
- registry.json: 13 new items (form = Form+FormField, magic-bento = MagicBento+BentoCard, rest single-file), 20 items total. All explicit targets, path === target, `@astro-shad/utils` deps.
- `/dev` sections for everything, including a Card image/bgImage board, a combined Form board (with DatePicker), and the experimental CurvedLoop custom-`path` test.

**Decided (de-branding conventions applied throughout the sweep):**
- KCA accent unions (`'blue'|'red'|'yellow'|'purple'` → `var(--color-*)`) become free-form CSS color string props defaulting to `var(--primary)` (`accent` on GlassIcon, `color` on Folder, per-item `hoverColor` on BubbleMenu, `glowColors` list on BentoCard). Brand variants later re-introduce token values, not markup.
- Semantic KCA utilities remapped to slot utilities: ink→foreground, surface→card, canvas→background, elevated→popover; `--ease-standard` became local literal cubic-beziers; `font-display`/`font-pixel` dropped (consumers set fonts via class).
- lucide-react static imports became inline SVGs (Pagination, DatePicker) — zero deps.
- kca's `is:inline` + window-guard scripts became processed `<script>` blocks (registry default per standards §5; Astro dedupes, no guard needed). Root data attributes renamed `data-astro-shad-*`.
- BentoCard: pixel-dust overlay dropped per plan; keyframe gradient glow kept behind `glow` (default on) + `glowColors` (successive radial stops).
- CurvedLoop: experimental `path` + `viewBox` props accept a raw SVG path `d`, replacing the generated arc — needs live dev-testing.
- FormField/DatePicker: kca's global `.field-input` became an inline shadcn-input class constant; success banner styled neutrally (border-border bg-muted) — no success token added to the theme.
- CountUp gained a `locale` prop (was hardcoded en-ZA), default en-US.

**Next:** user to run `npm run registry:validate` + `registry:build`, eyeball `/dev` in both themes, then commit + push. Remaining sweep sources: jmn_world-astro, pcl-astro; then the animated/gsap pass (db8 ScrollStack etc.), sections/layouts (db10-11), and the `/create` page build.

### 2026-07-17 — Setup completed and confirmed; first component batch

**Done:**
- Wrote `docs/how-it-works.md` (the learning/reference doc for the whole system).
- Restructured the repo into an Astro app mirroring the installed layout (`src/components/astro-shad/`, `src/lib/`, `src/styles/`); `path` === `target` everywhere now.
- New components: Card (props + named slots, zero JS), Tabs (vanilla JS + ARIA, arrow-key nav), Accordion + AccordionItem (multi-file item, single/multiple modes, grid-rows animation, inlined chevron).
- Playground at `/dev` with sections for all components and a theme toggle; astro-icon wired in config.
- Fixed Astro pin 5→7.1 (audit vulnerabilities were all in the stale major).
- GitHub live: repo `sethsticle/astro-shad` public, `public/r/` committed (un-ignored — it's the hosted registry), raw-URL delivery confirmed by adding `card` into spike-consumer.
- Graduated `docs/standards.md` from kca-astro; wrote root `CLAUDE.md`; old README preserved as `docs/investigation.md`; new public-facing README.
- Plan docs: `docs/plans/create-page.md`, `docs/plans/brand-variants.md`.

**Decided:**
- Hosting = committed `public/r/` + raw.githubusercontent.com. Zero infrastructure; revisit only for the doc site.
- Relative imports remain law until spike-2 passes (`@/` aliases untested through the CLI's import-rewrite pass).
- Primitives inline structural SVGs (accordion chevron); icon *props* will use astro-icon strings.
- `/create` tool: copy-token-overrides model, not writing consumer globals. Page roles: `/dev` = component QA (later promotes to `/docs` as a content/usage guide); `/create` = token design + brand customisation, emitting a theme.css override block (see plan doc).
- Variants: token-only differences become theme items; only structural divergence earns a variant component. Variants are coexisting siblings — suffixed filename at primitive depth (`Button-kca.astro`), item name `button-kca`, `path` === `target`, zero new registry mechanics. Consumers can hold primitive and variant side by side; switching between them is an import edit. All variant conventions locked (see plan doc).

**Next:** component aggregation sweep, starting with kca-astro (plan item 1).

### 2026-07-16 — Investigation + go/no-go spike

**Done:** investigated registry options (shadcn format vs jsrepo vs template repo; chose shadcn format — see `docs/investigation.md`); built minimal registry (button, badge, utils, theme); ran the spike proving byte-identical `.astro` delivery (`SPIKE.md` has the full findings). **Decided:** `tsx: true` mandatory in consumers; explicit `target` on every file; relative imports written for the installed layout.
