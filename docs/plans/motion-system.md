# Plan: a motion system that doesn't become a dependency-fear repeat

Status: mapped (2026-07-19), not started. Grew out of a planning discussion after building the `/dev` per-dev-group viewport toggle -- the same "consumers will always want motion" pressure that drove hand-porting GSAP demos into vanilla CSS/JS (`BubbleMenu`, `PixelTransition`, `SplitText`, `HighlightedText`) needs a real answer instead of one-off ports forever.

## Goal

Prop-driven motion -- the ergonomic part of `motion.div` (a consumer sets a few props, doesn't touch animation internals) -- on top of astro-shad's existing markup, without introducing the failure mode that drove the vanilla-porting approach in the first place: one shared animation dependency, updated once, breaking every consumer project that installed it.

## The core decision: two tiers, one shared vocabulary

**Tier 1 -- default, zero dependencies.** A small first-party runtime (`src/lib/motion.ts`, shipped like `lib/utils.ts` already is) driving the native **Web Animations API**. Covers the 80% case: fade/slide/scale, stagger, named easings or a raw cubic-bezier, three triggers (`load` / `in-view` / `hover`). Browser-native, nothing to update, nothing to break.

**Tier 2 -- opt-in, scoped exactly like `Map.astro`/MapLibre.** GSAP, declared in `registry.json` `dependencies` only for the specific items that need what WAAPI genuinely can't do well: scroll-scrubbed timelines (ScrollTrigger), physics/inertia drag (Draggable), complex multi-element sequencing. A consumer who never installs a GSAP-backed item never sees GSAP in their `package.json` -- the precedent already exists in this exact repo (`Map.astro` -- "first runtime npm dep").

**Why not just pick one:** collapsing to "always GSAP" (closer to how beUI does it) was considered and rejected. Motion is something "consumers -- myself included -- will want to add onto any primitive," per the original framing; if GSAP is the *only* path to motion, opt-in stops meaningfully containing risk because almost everything ends up opting in, and GSAP becomes a de facto base dependency despite being declared per-item. Collapsing to "always native, no GSAP" was also rejected -- WAAPI can't cover scroll-scrub/drag/complex sequencing well, and refusing those means "trendy" requests keep landing as one-off hand ports forever, same as today.

**Why not duplicate effort either:** tier 1 stays deliberately narrow (fade/slide/scale/stagger/easing/trigger -- a small, finishable surface, not an ongoing parallel product) and **both tiers share the same attribute vocabulary**. Tier 2 doesn't reimplement `fade-up`; it adds a few extra options (`scrollScrub`, `drag`) on top of the same `motion()` call that only do anything once GSAP is actually present. No relearning a second prop system to get the advanced cases.

## Zero component edits required (confirmed against the current codebase)

Checked `Card.astro` and `Button.astro`: both already destructure `...rest` from `Astro.props` and spread it onto their root DOM element (the established convention per `frontend-contract.md`). That means any attribute passed that isn't a named prop flows straight through to the DOM -- `data-motion-*` attributes work on any existing shipped component today, no source edits, no registry re-publish. The runtime script does a generic `document.querySelectorAll('[data-motion]')` sweep and drives whatever it finds, retroactively, against anything.

## The typed DX layer (decided: types from day 1, not raw attribute strings)

A `motion()` helper in `lib/motion.ts` returns the attribute object to spread, so consumers get real editor autocomplete instead of hand-typing `data-motion-preset="fade-up"`:

```astro
<Card {...motion("fade-up", { trigger: "in-view", duration: 600 })}>
```

**Preset customisation follows Tailwind's own convention** -- a sensible default per preset, a bare-number shorthand, and a bracket escape hatch for arbitrary values -- parsed by a small regex at animation-run time, no build/compile step required:

```
"fade-up"          -- default distance (16px)
"fade-up-24"       -- 24px, bare number = px, same shorthand as Tailwind's spacing scale
"fade-up-[2rem]"   -- arbitrary, any valid CSS length, verbatim
```

`Preset` as a TS template-literal type (`PresetBase | \`${PresetBase}-${number}\` | \`${PresetBase}-[${string}]\``) gives autocomplete on base preset names in any editor with a TS language server -- no bespoke IntelliSense plugin needed, unlike Tailwind's own class-name completion.

## Phasing

Grilled and resolved 2026-07-19. Three phases, strictly sequential -- phase 2 (GSAP) does not start until phase 1 is proven; phase 1b does not start until phase 1a passes its bar.

### Phase 1a -- pilot (proves the mechanism, not preset coverage)

**Scope, deliberately narrow:**
- Exactly three presets: `fade`, `fade-up`, `scale-in`. Not the full directional family yet -- `fade-up` alone proves the directional-transform path; copying it to `fade-down/left/right` is mechanical once the shape is confirmed, not worth doing before validation.
- Exactly four test cases, each a genuinely different DOM shape: `Button` (leaf element), `Card` in a repeated grid of 3-4 (compound element, proves stagger-on-siblings), `Cta-01` (full section, proves `in-view` on a large viewport-height block), and a plain heading/paragraph block with a whole-block `fade-up` (no per-word/char stagger -- that granularity belongs to `SplitText`, which stays out of tier 1's surface per the boundary below).
- All four demoed on **one new, dedicated `/dev` board** ("Motion pilot" or similar) rather than folded into existing boards -- keeps every pilot case together for focused review, reuses the `group-canvas`/viewport-toggle machinery already built for the other boards.
- Built as the real `src/lib/motion.ts` from day one, not a throwaway prototype -- small enough that there's no real prototype-first savings, and it matches the existing build-session -> graduation-queue pipeline. It simply doesn't get a `registry.json` entry (not installable/publishable) until it passes.

**In scope from day one, not deferred to 1b:**
- **FOUC prevention.** Astro SSGs the full page with no animation state; a `load`/`in-view` element renders fully visible in HTML until `motion.ts` executes client-side, which is a visible flash/pop before the entrance plays. Fix: a pre-hide `<style>` rule shipped as part of the tier-1 package, scoped to `[data-motion][data-motion-trigger="load"]` and `[data-motion][data-motion-trigger="in-view"]` only (not `hover`, which starts from the default visible state). Must be documented clearly enough that every future preset family added in 1b inherits it automatically, not something each preset has to remember to opt into.
- **`prefers-reduced-motion`.** Same mechanism as the FOUC fix needs a matching escape hatch -- `matchMedia('(prefers-reduced-motion: reduce)')` checked explicitly (WAAPI respects nothing automatically), so reduced-motion users don't get stuck at the pre-hidden `opacity: 0` with no animation ever firing to reveal them.
- **`in-view` fires once** -- `IntersectionObserver` disconnects after first entry (standard entrance-animation behaviour), not a repeat/toggle mode. Confirmed as the day-one default, not deferred.

**Bare-number modifier semantics are per-preset-family, not uniform** (confirmed acceptable -- same convention Tailwind itself uses): length-based presets (`fade-up`) treat a bare number as px (`fade-up-24` = 24px translate). `scale-in` treats a bare number as percentage-points of scale delta (`scale-in-10` = starts at `scale(0.90)`) rather than a raw `scale()` value, since `scale-in-24` as literal `scale(24)` would be nonsensical. Bracket syntax (`scale-in-[0.8]`) always stays verbatim CSS regardless of family, as the universal escape hatch.

**Explicitly out of tier 1's addressable surface:** any component that already carries bespoke CSS/JS motion -- `BubbleMenu`, `PixelTransition`, `MagicBento`, `Folder`, `GlassIcon`, `SplitText`, `HighlightedText`, `TextType`, `RotatingText`, `CountUp`. Not because they're broken; they're already bespoke motion primitives, and layering a generic WAAPI animation on top risks both fighting over `transform`/`opacity` on the same element. Once tier 1's full WAAPI set exists (end of 1b), a later pass duplicates each bespoke component side-by-side with a `motion.ts`-driven version, for direct comparison -- not an in-place replacement.

**Pass bar for 1a** (all must hold before 1b starts):
1. The preset+modifier parser handles bare-number, bracket-arbitrary, and no-modifier correctly across all three pilot presets.
2. Zero edits needed to `Button.astro` / `Card.astro` / `Cta-01.astro` -- confirms `{...rest}` holds beyond the two components already spot-checked.
3. All three triggers (`load` / `in-view` / `hover`) work correctly on their respective pilot case.
4. Stagger works correctly across the Card grid.
5. TS autocomplete for preset names actually surfaces in-editor, not just type-checks silently.

Cross-browser/compatibility checks explicitly scoped **out** of 1a -- deferred to later, not a pilot blocker.

### Phase 1b -- full WAAPI expansion, stops short of GSAP's territory

Only starts once 1a passes its bar. Draft territory split (confirmed 2026-07-19, subject to refinement as 1b actually gets scoped):

- **Tier 1 (WAAPI) territory:** fade family (4 directions), slide family (4 directions, no opacity change), scale-in/out, simple rotate, color/background-color transition, blur-in (via `filter`), stagger-of-siblings, the three triggers.
- **Tier 2 (GSAP-only) territory:** scroll-scrubbed/pinned sequences (ScrollTrigger), draggable/inertia (Draggable), SVG path morph, spring/physics-based easing (not standardized in WAAPI's `easing` string, unlike GSAP's built-in spring support), multi-step timelines with labels/callbacks/dependencies between elements.

**SVG path draw is not a tier boundary, not split between tiers.** WAAPI can animate `stroke-dashoffset` directly, so simple draw-in (no morph) is plain Tier 1 -- it doesn't need to wait for GSAP. GSAP's version of the same draw-in also exists once tier 2 lands (consumers already pulling in GSAP for morph/scroll-scrub on the same page get it there too) -- both tiers end up offering draw-in, which is fine and expected, not duplication to resolve. Only *morph* (interpolating between two path shapes) stays GSAP-exclusive -- WAAPI has no path-morph primitive.

Full focus stays on `motion.ts` until as much as is physically worth porting natively is done -- GSAP integration does not begin until this phase is as complete as reasonably possible.

**1b done (2026-07-19):** full 14-preset set implemented and tested (fade + 4 directions, slide 4 directions, scale-in/out, rotate, blur-in, color, bg), `motionStagger()`, all three triggers, FOUC pre-hide + reduced-motion, spot-checked in `/dev`'s Motion pilot board. Registry-published as `@astro-shad/motion` (`registry.json`, `registry:lib`, no dependencies).

**Documented, not yet built** -- additions considered before closing tier 1 out for good, none of them require GSAP-level sequencing so they stay candidates for a later tier-1 pass rather than pushed to tier 2:
- `blur-out` -- exit-direction counterpart to the existing `blur-in`, same `filter` mechanism.
- `flip` -- 3D `rotateY`/`rotateX` card-flip reveal, distinct from the existing 2D `rotate`.
- SVG stroke draw-in (`stroke-dashoffset`) -- see the tier-boundary note above; pure WAAPI, no GSAP dependency.

### Phase 2 -- GSAP (tier 2), out of scope until phase 1 is proven and stable

Grilled and resolved 2026-07-19 (see grill transcript context). Correction to the earlier draft: the plan previously cited "the same convention already used for `Hero-01..04` / `Accordion`/`02`/`03`" as precedent for version pinning -- checked against `registry.json` and that's not accurate. `map`'s `dependencies` is a bare unversioned `["maplibre-gl"]`, and the Hero/Accordion numbering is a design/API-variant convention with zero npm dependencies involved, unrelated to version pins. There is no existing pinning precedent in this repo -- Phase 2 sets new policy, not a continuation of one.

**Dependency versioning.** No exact pin. Each GSAP-backed item declares a caret floor, not a ceiling -- `"gsap@^3.13.0"` (the release where every plugin, including ScrollTrigger, became free/merged into core). GSAP 3's track record has had no breaking major release in years, so floating to latest-within-major is low risk and avoids the maintenance tax of re-validating a pin on every GSAP release. The numbered-variant rule stays as the backstop for the rare real break -- a breaking GSAP change becomes a new numbered variant (`gsap-hero-02`), never an in-place upgrade of a shipped item -- cheap insurance, kept even though hard pinning was dropped.

**Naming convention (standing rule, not a one-off).** Every tier-2 item is prefixed `gsap-<family>-NN` -- e.g. `gsap-hero-01`, and later `gsap-cta-01`, `gsap-accordion-01`, etc. The prefix marks "this family member requires GSAP," independent of which plugin it actually uses; deliberately more general than `parallax-hero-01` so the convention doesn't need renaming the first time a non-parallax GSAP item ships.

**Architecture -- bespoke per component, no shared tier-2 lib.** Unlike tier 1 (`motion.ts`, one shared runtime), GSAP items follow the `Map.astro` precedent: fully self-contained, GSAP imported and `gsap.registerPlugin(...)` called directly in the component's own `<script>` (registration is idempotent, safe to call redundantly across components on the same page -- no shared bootstrap file required). Reserved specifically for sections a consumer wants genuinely bespoke; anything coverable by tier 1's preset vocabulary stays in `motion.ts`/WAAPI, never gets ported to GSAP just because GSAP is now available.

**Porting philosophy -- stock GSAP, minimally adapted, not funneled through an abstraction.** Tier 1's WAAPI conversions (reactbits, etc.) were full rewrites into a shared preset vocabulary. Tier 2 deliberately does *not* repeat that pattern: GSAP components should read as close to stock/copy-pasted GSAP code as reasonably possible. Reason stated directly: the real future use case is pulling in found GSAP templates/demos and porting them with minimal translation, not hand-rewriting every GSAP dialect into a custom API. The unified `motion()` syntax mentioned elsewhere in this doc (`scrollScrub`, `drag` options) is deferred, optional, and consumer-opt-in -- not required for tier-2 items to ship, and explicitly not attempted for the first candidate.

**Plugin scope, per item.** First candidate pulls in exactly `gsap` + `gsap/ScrollTrigger`, nothing else. Every later GSAP item independently declares its own plugin subset in `dependencies` (Draggable, MorphSVG, SplitText, etc., only when that specific item needs it) -- no preemptive bundling "for later items," matching the scoped-dependency premise already established for `Map.astro`.

**First tier-2 candidate.** `gsap-hero-01` -- a new item, never a retrofit of an existing shipped `Hero-01..04` (retrofitting would silently add an npm dependency to a contract existing consumers already installed expecting zero deps).

**Pass bar before a second GSAP item ships** (mirrors 1a's written pass bar):
1. Registry install path tested end-to-end via `spike-consumer` -- GSAP actually lands in a *fresh consumer's* `package.json`, not just proven inside this repo.
2. ScrollTrigger instances clean up correctly on unmount/navigation (no leaked observers across Astro page nav / view-transitions).
3. The component's GSAP code reads as close to stock/copy-pasted GSAP as reasonably possible -- item 1 also proves the porting philosophy above, not just the dependency-scoping mechanism.

**Docs implication.** Any item with an npm `dependencies` entry (this includes `map`, retroactively) gets a standard "installs an npm dependency" callout on its docs page, plus a badge in the docs sidebar nav entry -- a general npm-dependency marker, not GSAP-specific. Implementation (docs-nav.ts schema + badge component) is a docs-session follow-up, not part of Phase 2 build work.

## Bootstrap script (required registry payload, not optional polish)

Two pieces currently live page-level inside `dev.astro` (see the comment above the "Motion pilot" board) and must ship as part of the `@astro-shad/motion` registry item itself, not something each consumer page hand-assembles:

1. **`MOTION_PREHIDE_CSS`** (exported from `lib/motion.ts`) -- a `<style set:html={MOTION_PREHIDE_CSS}>` block pre-hiding `[data-motion][data-motion-trigger="load"]` / `="in-view"` elements before first paint, plus the matching `prefers-reduced-motion` escape hatch.
2. **`initMotion()`** -- the sweep that finds `[data-motion]` elements and wires up their animations. Currently invoked manually per page: `<script>import { initMotion } from "../lib/motion"; initMotion();</script>`.

Both are one unit -- a page with the pre-hide CSS but no `initMotion()` call doesn't just lose the animation, it leaves the element stuck at `opacity: 0` forever (the pre-hide rule has no other reveal path). That makes "forgot the bootstrap script" a **content-disappears bug**, not a degraded-animation bug -- worse than a typical missed import, and worth weighing accordingly when this is registry-published (see the global-injection question below, still open).

Queued for a docs session once `@astro-shad/motion` is registry-published: docs must state plainly that both the CSS block and `initMotion()` are required, together, on every page using `motion()` -- not each preset's problem to re-explain.

**Polish, deferred until after Phase 2 (GSAP) is settled, not before:** have `initMotion()` self-invoke as a module side-effect on import, so the consumer's only remaining step is the `<script>` import line itself, not "import, then also remember to call it." Halves the forgettable surface on top of the pre-hide trap noted above. Deliberately sequenced after GSAP integration -- not a tier-1 blocker, and touching the bootstrap contract mid-GSAP-work risks destabilizing the one thing tier 2 depends on (`registryDependencies: ["@astro-shad/motion"]`).

## Supporting work (either phase, not yet sequenced)

- **Aggregate as one registry item** (`@astro-shad/motion`) once 1a passes -- `lib/motion.ts` + a bootstrap `<script>`, installable once like `lib/utils.ts`.
- **Docs page for tier 1** -- every preset demonstrated live (before/after), same shape as documenting any primitive.
- **Motion playground page** (third page alongside `/dev` and `/create`) -- sliders for duration, a draggable cubic-bezier curve editor (per the beUI reference), stagger controls, trigger selection, live preview against a real registry component, "Copy props" emitting the exact `motion(...)` call. Worth considering: GSAP's own easing/curve tooling (`CustomEase`) could power *this authoring tool specifically*, dev-only, never shipped -- a completely different risk profile than shipping GSAP to consumers.
- **Retrigger-on-view** (noted 2026-07-19, not built) -- `in-view` currently fires once and disconnects, by design (1a pass bar item 3). A future `once: false`-style mode would keep the `IntersectionObserver` alive and replay the entrance (and reverse it on exit) every time the element re-enters the viewport, for consumers who want a repeat-on-scroll-back feel. Needs a decision on what "exiting" plays -- reverse the same keyframes, or a separate exit preset -- before it's built.
- **View-progress timeline** (noted 2026-07-19, not built) -- a way to see/scrub an animation's progress (`Animation.currentTime`/`.effect.getComputedTiming()`), positioned as tier 1's answer to what GSAP's timeline tooling gives for free. Natural home is the motion playground page above (a scrub bar per preview, "Copy props" alongside it) rather than a separate feature -- evaluate once that page gets built, and weigh it explicitly against just reaching for GSAP's own timeline when a consumer needs real scrubbing.

## Non-goals

- Not shipping GSAP as a base/global dependency, ever -- always scoped per registry item that explicitly needs it.
- Not building tier 1 out to match GSAP's full feature set (physics, path morphing, complex sequencing) -- that's what tier 2 is for. Tier 1 stays intentionally small.
- Not requiring existing components to be edited to become "motion compatible" -- the `{...rest}` convention already makes them compatible. Component-level `motion` prop sugar (translating a typed prop to `data-motion-*` internally) is a later, optional polish pass, not a blocker.
- Not touching components with existing bespoke motion during phase 1 -- see the addressable-surface boundary under 1a.
