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
