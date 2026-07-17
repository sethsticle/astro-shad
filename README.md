# astro-shad

A personal registry of shadcn-quality components converted to lightweight Astro (HTML + Tailwind v4 + minimal vanilla JS), pullable into any repo via the shadcn CLI and then customised toward each brand.

This document is the consolidation of the investigation (2026-07-16). Nothing is built yet; this maps the territory and records the decisions to make.

---

## 1. Why this exists

Observed trend across kca-astro (and earlier projects): every shadcn/reactbits/tailark component worth using ends up hand-converted to a self-contained `.astro` file following the same recipe (documented in `kca-astro/docs/standards.md` section 4). That recipe is stable and repo-agnostic; only token *values* are per-brand. The conversions are piling up inside one client repo where they cannot be reused.

`standards.md` section 7 already predicted this step: "a tiny shadcn-style registry (`npx shadcn add` compatible JSON) serving the playground shell plus converted `.astro` components, with tokens left to the host repo."

## 2. What already exists (the seed inventory)

`kca-astro/src/components/site/` holds ~37 converted components. Grouped:

- **Primitives (shadcn origin):** Button, Badge, Card, Tabs, Accordion, Pagination, Form + FormField, DatePicker
- **Text FX (reactbits origin):** RotatingText, SplitText, CountUp, TextType, CurvedLoop, LogoLoop
- **Visual/FX (reactbits origin):** MagicBento + BentoCard, ScrollStack + ScrollStackCard, BubbleMenu, Folder, GlassIcon, PixelSnow, SpriteButton
- **Sections (tailark origin):** CtaSection, HomeIntroSplit, ImageMarqueeSection, ImageTwoCol, ImageContentIconRow, TwoColText, HalfCardCta, FeatureSpotlight, IntegrationsGrid
- **Site chrome (KCA-flavoured, needs genericising):** SiteHeader, Footer, PageSection, ProgrammePage
- **Tooling:** the `/dev` playground (dev.astro + DevBoard + token sidebar) -- this is part of the extraction unit, not an afterthought. It is the "storybook" of the registry.

Extraction cost per component is low-to-moderate: strip `**(repo value)**` tokens (KCA accents, square radius) back to neutral shadcn slot names, keep the semantic-token layer as the contract.

## 3. Registry options investigated

### Option A -- shadcn registry format, self-hosted (recommended)

The shadcn registry system is now explicitly framework-agnostic: a registry is just JSON served over HTTP, and item files are strings with a `path`/`target`, so `.astro` files distribute fine (use `registry:component` / `registry:file` types with explicit `target` paths). Key mechanics:

- `registry.json` at the repo root is the entry point; `npx shadcn build` emits static `r/{name}.json` files; `shadcn registry validate` checks structure before publishing. A public GitHub repo + any static host works.
- Since May 2026, `registry.json` supports `include` composition (split primitives/fx/sections into separate registry files, one root).
- Consumers add one entry to `components.json`:
  ```jsonc
  "registries": { "@astro-shad": "https://<host>/r/{name}.json" }
  ```
  then `npx shadcn add @astro-shad/button`. Namespaced, works alongside stock shadcn.
- Registry items carry `dependencies` (npm), `registryDependencies` (other items -- e.g. ScrollStackCard pulled in with ScrollStack), `cssVars`, and `css` (inject `@keyframes`, `@utility` blocks) -- which matters because several conversions (PixelSnow, RotatingText) generate keyframes.
- Hosting fits the existing toolchain: a static-assets Cloudflare Worker (same pattern as kca-astro's deploy) or even GitHub raw URLs.

**To validate early:** one spike confirming `shadcn add` writes an `.astro` file untouched into an Astro consumer repo (the CLI's import-rewriting targets ts/tsx; `.astro` should pass through as an opaque file, but this is the load-bearing assumption -- test it first).

### Option B -- jsrepo

[jsrepo.dev](https://jsrepo.dev) is a purpose-built alternative: CLI for building/publishing registries, automatic inter-item dependency resolution, interactive `update` command (a real gap in shadcn -- updating a previously added component), private registries, host anywhere or on jsrepo.com. Framework-agnostic file distribution.

Tradeoff: a second toolchain to learn, smaller ecosystem, and consumers need the jsrepo CLI instead of the shadcn CLI already in every repo. Worth revisiting if the shadcn CLI mangles `.astro` files or if "update components in downstream repos" becomes the pain point.

### Option C -- plain template repo (degit/giget)

Zero infrastructure: `giget gh:sethhendrikz/astro-shad/components/Button.astro`. No dependency resolution, no cssVars injection, no registry semantics. Fine as a stopgap, not the destination.

### Verdict

Start with **Option A**. The format is a spec, not a lock-in: the same source repo could later emit a jsrepo manifest too. Do the `.astro`-passthrough spike before converting anything else.

## 4. Icon strategy (the lucide friction)

Current pattern (lucide-react components imported in frontmatter, server-rendered to inline SVG, passed around as component references in props) works but is the confusing part of the stack. Two cleaner options, both zero-JS:

1. **astro-icon + `@iconify-json/lucide`** (recommended): icons become strings, not imports -- `<Icon name="lucide:arrow-right" />`. Same lucide artwork via Iconify data. Props like CtaSection's `chips` become arrays of name strings instead of component references, which is simpler to type, simpler to pass, and serialisable. One integration, access to every Iconify set (200k+ icons) by installing per-set JSON packages.
2. **`@lucide/astro`**: official, each icon a real Astro component, tree-shakable. Nicer than lucide-react but keeps the import-per-icon model.

Decision to make: astro-icon's string API is the better registry contract (a registry item can say `icon="lucide:check"` in a prop default without importing anything), so the registry standard should be **astro-icon**, with lucide-react allowed only inside React islands. Migrating existing conversions is mechanical.

## 5. Proposed shape of this repo

```
astro-shad/
  registry.json              # root, composes the files below (include)
  registry/
    primitives.json          # button, badge, card, tabs, accordion, form...
    text-fx.json
    visual-fx.json
    sections.json
    tooling.json             # dev playground shell, DevBoard, token sidebar
  components/                # the .astro sources (neutral tokens)
  styles/
    theme.css                # the three-layer token contract, neutral values
  docs/
    standards.md             # graduated from kca-astro, repo values removed
    conversion-recipe.md
  playground/                # an Astro app that consumes the registry locally
```

The playground doubles as the validation harness: every component renders there against the neutral theme before it ships, mirroring `/dev` in kca-astro.

## 6. Roadmap

1. **Spike:** minimal registry.json with Button + Badge, `shadcn build`, host the JSON locally, `shadcn add @astro-shad/button` into a scratch Astro app. Confirms `.astro` passthrough, target paths, registryDependencies. Go/no-go on Option A. **Scaffolded -- runbook in `SPIKE.md`.**
2. **Token contract:** extract theme.css three-layer structure with neutral shadcn slot values; write the "repo values" override guide.
3. **Graduate standards.md:** strip repo values, move here as the registry's constitution.
4. **Icon migration:** adopt astro-icon in the registry copies; document the string-prop icon convention.
5. **Bulk extraction:** move the ~37 kca-astro components across in category batches, de-branding each (kca-astro keeps its customised copies untouched -- that repo stays where it is, per the decision to step back from it).
6. **Playground extraction:** dev.astro + DevBoard + sidebar as registry items (`registry:page` + components), so every new repo gets the workbench with one `add`.
7. **Later:** blocks/layouts tier (SiteHeader, Footer, full page skeletons), update workflow (revisit jsrepo if this hurts), maybe publish to the shadcn registry directory.

## 7. Open questions

- Does `shadcn add` leave `.astro` file contents untouched? (Spike, step 1 -- everything hangs on this.)
- Hosting: workers.dev static assets vs raw GitHub vs Pages? (Cheap either way; decide at spike time.)
- How do downstream repos take *updates* to a component they have already customised? (shadcn's model is copy-and-own: updates are manual diffs. jsrepo's `update` command is the counter-argument. Accept copy-and-own for now.)
- `cn()` / cva: keep as npm `dependencies` on each item, or inline plain maps per the standards recipe? (Standards say prefer plain maps; then most items have zero npm deps, which is the cleanest registry story.)
- Naming/licensing if ever public: components derive from shadcn (MIT), reactbits (MIT), tailark -- check tailark's licence before publishing sections publicly.

## 8. Reference links

- Registry overview: https://ui.shadcn.com/docs/registry
- Getting started (build + host): https://ui.shadcn.com/docs/registry/getting-started
- `registry.json` spec (incl. `include` composition): https://ui.shadcn.com/docs/registry/registry-json
- `registry-item.json` spec (file types, targets, cssVars, css): https://ui.shadcn.com/docs/registry/registry-item-json
- Namespaces (`@astro-shad/*` in components.json): https://ui.shadcn.com/docs/registry/namespace
- FAQ (multi-file item example, custom targets): https://ui.shadcn.com/docs/registry/faq
- Registry template repo: https://github.com/shadcn-ui/registry-template
- May 2026 changelog (include + validate): https://ui.shadcn.com/docs/changelog/2026-05-registry-include
- JSON schemas: https://ui.shadcn.com/schema/registry.json / https://ui.shadcn.com/schema/registry-item.json
- Full doc index: https://ui.shadcn.com/llms.txt
- jsrepo (alternative): https://jsrepo.dev
- astro-icon: https://www.astroicon.dev / `@lucide/astro`: https://lucide.dev/guide/astro
