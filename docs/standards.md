# astro-shad conversion standards

The rules for creating registry components: how shadcn / reactbits / tailark / similar React-dependency components, layouts, and blocks become simple, primitive, reusable Astro components. Graduated from `kca-astro/docs/standards.md` (2026-07-17) with repo-specific values stripped — these are the portable rules.

Everything here assumes the registry mechanics in [how-it-works.md](how-it-works.md); read that first.

---

## 1. Stack contract

Every component in this registry, and every repo that consumes it, follows the same fixed stack:

- **Astro** — pages, layouts, components. The default for everything.
- **Tailwind v4** — all styling, driven by the token system (section 3).
- **Vanilla JS** — all client behaviour by default, in component `<script>` tags.
- **React** — islands only, for genuine client interactivity that would be a rewrite in vanilla JS. Registry primitives never ship islands.

Consistency across repos comes from this contract plus the token *system*; per-repo personality comes only from token *values*. A repo with sharper corners changes `--radius-*`, never markup.

## 2. Dependency policy

Three tiers. The test is always: **what ships to the browser?**

- **Tier A — build-time deps, static output. Safe, lean into these.** `clsx` + `tailwind-merge` (`cn()`), icon data packages, anything that emits plain HTML/CSS/SVG. Declare them as `dependencies` on the registry item that imports them.
- **Tier B — React islands. Only where interactivity earns it.** Not in this registry's primitives. If a future item genuinely needs an island (WebGL, focus-trapping combobox), it is copy-to-own with the narrowest `client:` directive, and the need is justified in the item description.
- **Tier C — never.** Component libraries as runtime packages; React rendering static markup; hardcoded hex values in class attributes (add a token first).

**Icons:** primitives that structurally need an icon (accordion chevron) inline the SVG — self-contained, zero deps. Components with icon *props* use **astro-icon** string names (`icon="lucide:check"`), which are typed, serialisable, and importless — the registry convention over lucide-react component references.

## 3. Token system

Three layers, all in `theme.css` (shipped by the `theme` registry item, neutral grayscale values):

1. **`:root` slot custom properties** — the shadcn names (`--primary`, `--card`, `--radius`, …). Converted components resolve against these unchanged, which is what makes conversions cheap. Dark is the default; `html[data-theme="light"]` overrides the same variables.
2. **`@theme` semantic utilities** — what host repos type in their own markup: `bg-canvas`, `bg-surface`, `bg-elevated`, `bg-shade`, `text-ink`, the radius scale. Brand personality lives here.
3. **`@theme inline` bridge** — maps slot vars to Tailwind utilities so `bg-primary` / `text-muted-foreground` resolve with no `tailwind.config`.

Rules:

- **Semantic over literal.** `text-ink`, not `text-white`. Literal values only where a colour must hold in both themes, documented inline.
- **Components never know about themes; only tokens do.** No `dark:` variants in registry markup — the variables flip, the markup doesn't.
- **Registry components use slot utilities** (`bg-primary`, `border-border`) — the neutral, shadcn-compatible layer. Semantic utilities (`bg-canvas`, `text-ink`) are host-repo vocabulary for page-level markup.
- Tailwind v4 utilities compile to `var(--token)` references, so tokens are live-tweakable at runtime — the `/dev` playground and future `/create` studio exploit exactly this.

## 4. The conversion recipe: React component → Astro primitive

shadcn (and reactbits, tailark) are catalogues of Radix-quality boilerplate, not libraries to install. To convert:

1. **Read the source** (`ui/button.tsx` from the shadcn site, or the repo's existing copy).
2. **Keep the cva shape, drop the runtime.** Translate `cva()` into plain `const BASE`, `VARIANTS: Record<Variant, string>`, `SIZES: Record<Size, string>` maps. Same variant names, same class strings — the API survives, the abstraction cost goes to zero.
3. **Keep the slot utilities as-is.** `bg-primary`, `text-muted-foreground`, `focus-visible:ring-ring` — shadcn's interaction states (hover/focus/disabled/aria) are the value being harvested. Don't re-map to brand tokens; that's the consumer's job via theme values.
4. **Replace React polymorphism with Astro polymorphism.** `asChild` + `Slot` → "render `<a>` when `href` is passed, `<button>` otherwise". `forwardRef` deleted. `children` → `<slot />`. Compound components (Card + CardHeader + CardTitle…) collapse into props + named slots in one file where sensible; genuinely separate pieces (Accordion/AccordionItem) stay separate files in one registry item.
5. **Type the props.** `interface Props` with variant/size unions, `class?: string` merged via `cn()`, and `[key: string]: unknown` rest-spread so callers can pass `aria-*`, `data-*`, `id`.
6. **Behaviour goes down the ladder** (section 5). Most Radix behaviour (tabs, accordion, dropdown open/close) is a few lines of vanilla JS or pure CSS.
7. **Header comment.** One block per file: what it mirrors, the conversion decisions, a usage example. The component must be understandable with zero external context — it gets copied into repos that have never seen this one.
8. **Registry imports are relative, written for the installed layout.** `import { cn } from '../../lib/utils'` from `src/components/astro-shad/`. Never `@/` aliases in component source (see how-it-works.md gotcha #3). This repo's tree mirrors the installed layout, so the same path is true here.
9. **Render it on `/dev`** — every component gets a playground section exercising all variants, in both themes, before its registry item ships.

For animation-library components (reactbits, gsap/framer-driven): identify what the library is actually driving — usually one or two CSS properties — and move that to CSS custom properties, keyframes, or native scroll mechanics. Proven patterns from prior conversions: measured-height accordion → grid-rows `0fr → 1fr`; staggered entrance sequences → CSS transitions keyed off one `data-state` attribute with per-element delay custom properties baked at build time; JS colour math → `color-mix()`; marquees → duplicated-track CSS animation; scroll-jacking → `position: sticky` + scroll-driven animation. The escape hatch (a component that must measure, e.g. text on an SVG path) measures after `document.fonts.ready` and stays honest about being rung 3.

## 5. Interactivity ladder

Escalate only when the previous rung fails:

1. **Pure CSS** — hover/focus states, `:checked` toggles, scroll-snap, `details/summary`.
2. **URL state** — pagination, filters: plain anchors, the query string is the store, zero JS.
3. **Component `<script>` (processed)** — the registry default for behaviour. Astro hoists and dedupes it (one copy per page regardless of instance count). Pattern: query all instances by a `data-astro-shad-*` root attribute at load, wire behaviour with event delegation from the root, store state as DOM attributes (`aria-selected`, `aria-expanded`, `data-state`) and style with `aria-*`/`data-*` Tailwind variants. Reference implementations: `Tabs.astro`, `Accordion.astro`.
4. **React island** — high-frequency shared client state only (drag-and-drop, canvas, live-filtered combobox over big lists). Not shipped by primitives.

Classify the state before choosing a rung: if the state is one attribute on one element, the DOM is the store and React has no job. Consumer repos with server-rendered routes may need the `is:inline` + window-guard + document-delegation variant of rung 3 (processed scripts can fail to ship there) — that's a consumer adaptation, not the registry default.

## 6. Registry conventions (summary)

- Every file in every item: **explicit `target`**, and `path` === `target` (the source tree mirrors installation).
- Targets: `src/components/astro-shad/<Name>.astro` · `src/lib/utils.ts` · `src/styles/<name>.css`.
- Items styling with `cn()` declare `registryDependencies: ["@astro-shad/utils"]`.
- Components generating keyframes/utilities ship them via the item's `css` block, not by asking consumers to edit stylesheets.
- Ship order: convert → item in `registry.json` → `/dev` section → `registry:build` → commit `public/r/` → push. Optionally verify delivery by `add`-ing into `spike-consumer/` and diffing.
