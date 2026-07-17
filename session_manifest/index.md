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
