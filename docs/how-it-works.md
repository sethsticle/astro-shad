# astro-shad: how it works

A ground-up explanation of the registry, written after the spike proved the method (2026-07-16). Everything here is verified behaviour, not theory. Read it top to bottom once, then use sections 5–7 as recipes.

---

## 1. The mental model (read this first)

shadcn is not a component library — it's a **file-copying protocol**. When you run `npx shadcn add button`, the CLI:

1. Fetches a JSON file describing the component (its source code as a string, plus metadata),
2. Writes the source files into your project at declared paths,
3. Installs any npm dependencies the item declares,
4. Recursively does the same for any *registry* dependencies (other items it needs).

That's it. The files become yours — "copy and own." There is no runtime package, no version to upgrade, no lock-in.

The key insight that makes astro-shad possible: **the registry format doesn't care what's inside the files.** An item's `files[].content` is just a string. The CLI is built for `.tsx`, but it will happily deliver `.astro` files — as long as one setting is right (section 8, gotcha #1). We proved delivery is **byte-identical**: what's in this repo is exactly what lands in a consumer.

So astro-shad is: *our own shadcn-compatible registry, serving hand-converted `.astro` components (HTML + Tailwind v4 + minimal vanilla JS), installable into any Astro repo with the same CLI everyone already has.*

## 2. The three moving parts

```
┌─────────────────────┐     shadcn build      ┌──────────────────────┐
│  THIS REPO (source) │ ────────────────────► │  public/r/*.json     │
│  registry.json      │                       │  (static, hostable)  │
│  src/components/    │                       └──────────┬───────────┘
│    astro-shad/      │                                  │ served over HTTP
│  src/styles/        │                                  │
│  lib/utils.ts       │                                  ▼
└─────────────────────┘                       ┌──────────────────────┐
                                              │  CONSUMER REPO       │
                                              │  components.json ────┼── "@astro-shad": "<url>/r/{name}.json"
                                              │  npx shadcn add      │
                                              │    @astro-shad/button│
                                              └──────────────────────┘
```

1. **Source repo (here).** Human-editable: real `.astro` files, a `registry.json` manifest describing them.
2. **Built registry.** `npx shadcn build` reads `registry.json`, inlines each file's content into a self-contained `public/r/{name}.json` per item. These are static files — host them anywhere (local `serve`, Cloudflare Worker, Pages, GitHub raw).
3. **Consumer.** Any Astro project with a `components.json` that maps the `@astro-shad` namespace to the hosted URL. `npx shadcn add @astro-shad/<name>` pulls items by name.

## 3. Anatomy of `registry.json`

The manifest at the repo root. One entry per installable item:

```jsonc
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "astro-shad",
  "homepage": "https://github.com/sethhendrikz/astro-shad",
  "items": [
    {
      "name": "button",                          // what consumers type: add @astro-shad/button
      "type": "registry:component",
      "title": "Button",
      "description": "…",
      "registryDependencies": ["@astro-shad/utils"],   // other ITEMS this needs (recursive)
      "files": [
        {
          "path": "src/components/astro-shad/Button.astro",   // where it lives HERE (source)
          "type": "registry:component",
          "target": "src/components/astro-shad/Button.astro"  // where it lands THERE (consumer)
        }
      ]
    }
  ]
}
```

Field-by-field, what actually matters:

- **`name`** — the install handle. Lowercase, no spaces.
- **`type`** — item-level type. We use three:
  - `registry:component` — components (`button`, `badge`)
  - `registry:lib` — shared code (`utils`)
  - `registry:file` — arbitrary assets; **requires** an explicit `target` (`theme` → its CSS file)
- **`dependencies`** — **npm packages**, installed into the consumer's `package.json`. E.g. `utils` declares `["clsx", "tailwind-merge"]`. Only declare these on the item that actually imports them; anything depending on that item gets them transitively.
- **`registryDependencies`** — **other registry items**, by namespaced name (`@astro-shad/utils`). The CLI resolves these within the same registry, fetches and installs them in the same `add`, and dedupes files that already exist ("Skipped 1 file"). This is how `button` guarantees `cn()` exists without the consumer thinking about it.
- **`files[].path`** — source location in this repo, relative to the root.
- **`files[].target`** — destination path in the consumer, relative to *their* project root. **Our convention: every file always gets an explicit target** (see gotcha #2).
- An item can have **multiple files** (e.g. a future `ScrollStack` shipping `ScrollStack.astro` + `ScrollStackCard.astro` in one item), and items can also carry `cssVars` and `css` blocks (for injecting `@keyframes` / `@utility` into the consumer's CSS — we'll use this for the FX components later).

### Our locked-in target conventions

| Kind | Target |
|---|---|
| Components | `src/components/astro-shad/<Name>.astro` |
| Lib | `src/lib/utils.ts` |
| Styles | `src/styles/<name>.css` |

Components get their own `astro-shad/` subfolder so they're visibly registry-owned in the consumer, and so their relative imports are predictable (next section).

## 4. Anatomy of a component (the conversion contract)

Open `src/components/astro-shad/Button.astro` — it's the reference example. The rules it embodies:

1. **Self-contained single file.** Variant maps, types, markup all in one `.astro` file. Mirrors the shadcn `ui/button.tsx` shape, with Astro's own props/`<slot />` replacing forwardRef/Slot/JSX. Plain `Record<Variant, string>` maps instead of cva.
2. **Relative imports, written for the *installed* layout.** The button imports `import { cn } from '../../lib/utils'` — that path is correct from `src/components/astro-shad/` in the consumer (up to `src/`, into `lib/`). This repo's source tree mirrors the installed layout (`src/components/astro-shad/`, `src/lib/`, `src/styles/`) for exactly this reason: every import is literally true in both places, `path` and `target` in registry.json are identical, and the repo can render its own components in the `/dev` playground. The CLI never rewrites these paths (verified: byte-identical delivery), so **the source file must be written as if it already lives at its target**. Never use `@/` aliases in component source — we can't rely on the consumer having them.
3. **Styles only through tokens.** Components use shadcn slot utilities (`bg-primary`, `text-muted-foreground`, `ring-ring`, …) which the theme bridges (section below). Re-branding means overriding token *values*, never editing markup.
4. **Zero client JS unless the component genuinely needs it** — and then minimal vanilla JS in a `<script>` tag, no framework islands.
5. **Polymorphic where shadcn used `asChild`.** Button renders `<a>` when `href` is given, `<button>` otherwise.

### The theme contract (`src/styles/theme.css`)

Three layers, shipped with neutral (grayscale) values:

1. **`:root` slot vars** — the raw shadcn custom properties (`--background`, `--primary`, `--ring`, …). Dark is the default; `[data-theme="light"]` overrides the same vars.
2. **`@theme` semantic utilities** — vocabulary the *host repo* types in its own markup: `bg-canvas`, `bg-surface`, `bg-elevated`, `text-ink`, and the radius scale. This is where per-brand personality lives.
3. **`@theme inline` bridge** — maps slot vars into Tailwind utilities so `bg-primary` etc. actually resolve in Tailwind v4 (no `tailwind.config` needed).

A consumer re-brands by overriding values in layer 1 and 2 — in `theme.css` directly, or in their own CSS loaded after it. Components never change.

## 5. Recipe: adding a new component to the registry

Say you're converting `Avatar` next:

1. **Write the source**: `src/components/astro-shad/Avatar.astro`, following the contract in section 4. If it needs `cn()`, import it as `../../lib/utils` (relative, installed-layout path — true here too, since the source tree mirrors the target).
2. **Add its item to `registry.json`** (`path` and `target` are identical by convention):
   ```jsonc
   {
     "name": "avatar",
     "type": "registry:component",
     "title": "Avatar",
     "description": "…",
     "registryDependencies": ["@astro-shad/utils"],
     "files": [{
       "path": "src/components/astro-shad/Avatar.astro",
       "type": "registry:component",
       "target": "src/components/astro-shad/Avatar.astro"
     }]
   }
   ```
   Declare `dependencies` only if the file imports an npm package directly. Multi-file components list several entries in `files`, each with its own explicit target (see `accordion`: `Accordion.astro` + `AccordionItem.astro` in one item).
3. **Render it on `/dev`**: add a section to `src/pages/dev.astro` and eyeball it against the neutral theme in both light and dark (`npm run dev`).
4. **Validate and build**:
   ```sh
   npm run registry:validate   # schema check (build validates too)
   npm run registry:build      # emits public/r/avatar.json
   ```
5. **Smoke-test the delivery** (optional but cheap): `npm run serve` here, then in a consumer pointed at `http://localhost:4321/public/r/{name}.json`, run `npx shadcn add @astro-shad/avatar` and diff the installed file against the source (`spike-consumer/` exists for exactly this).
6. **Publish**: commit the rebuilt `public/r/` and push — GitHub raw URLs serve it directly, no deploy step.

## 6. Recipe: editing an existing component

1. Edit the `.astro` source here.
2. `npm run registry:build` (re-inlines content into `public/r/<name>.json`) and republish.
3. Consumers pick up the new version by running `npx shadcn add @astro-shad/<name>` again — the CLI will prompt before **overwriting** their copy.

Important model to hold: this is **copy-and-own**. There is no "update" mechanism — a consumer that customised their copy must diff manually when re-adding, or skip the update. That's the accepted trade-off (jsrepo's `update` command is the alternative if this ever hurts).

Renaming an item or changing its `target` is a breaking change for re-adds: the CLI will write to the new path and leave the old file orphaned in consumers.

## 7. Recipe: consuming the registry

### 7a. Adding a component to an existing Astro + Tailwind v4 repo

Prerequisites: Astro project with Tailwind v4 (`@tailwindcss/vite`) already set up.

1. **`components.json`** at the consumer root (create if absent):
   ```json
   {
     "$schema": "https://ui.shadcn.com/schema.json",
     "style": "new-york",
     "tsx": true,
     "tailwind": {
       "config": "",
       "css": "src/styles/global.css",
       "baseColor": "neutral",
       "cssVariables": true
     },
     "aliases": {
       "components": "@/components",
       "ui": "@/components/ui",
       "lib": "@/lib",
       "utils": "@/lib/utils",
       "hooks": "@/hooks"
     },
     "registries": {
       "@astro-shad": "https://raw.githubusercontent.com/sethhendrikz/astro-shad/main/public/r/{name}.json"
     }
   }
   ```
   `"tsx": true` is **non-negotiable** (gotcha #1). The `{name}` in the registry URL is a literal placeholder the CLI substitutes.
2. **`tsconfig.json`** needs the `@/` alias — the CLI resolves paths through it even though our files don't use the alias:
   ```json
   { "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./src/*"] } } }
   ```
3. **Install**:
   ```sh
   npx shadcn add @astro-shad/theme     # once per repo: token contract → src/styles/theme.css
   npx shadcn add @astro-shad/button    # pulls utils + clsx + tailwind-merge automatically
   ```
4. **Wire the theme**: import it from the global stylesheet, after the Tailwind import:
   ```css
   /* src/styles/global.css */
   @import "tailwindcss";
   @import "./theme.css";
   ```
5. **Use it**:
   ```astro
   ---
   import Button from '../components/astro-shad/Button.astro';
   ---
   <Button href="/contact" size="lg">Get in touch</Button>
   ```
6. **Re-brand** (optional): override token values from theme.css in the repo's own CSS. Markup never changes.

### 7b. Scaffolding a new project from scratch

```sh
npm create astro@latest my-site -- --template minimal
cd my-site && npm install
npx astro add tailwind          # Tailwind v4 via @tailwindcss/vite, creates global.css wiring
```

Then follow 7a from step 1. First adds are always `theme` + `utils`-dependent components; after that, add per need. (This exact flow is what `spike-consumer/` in this repo is — a preserved worked example you can compare against.)

## 8. The gotchas (each one cost us something — learn them)

1. **`"tsx": true` in the consumer's `components.json`, always.** With `tsx: false`, the CLI runs a strict Babel TSX→JSX transform over *every* installed file regardless of extension, and it hard-fails on `.astro` frontmatter (`import can only be used in import() or import.meta`). With `tsx: true` that transform is skipped entirely (confirmed in the CLI source: `transformJsx: !config.tsx`) and files pass through byte-identical. This single flag is the load-bearing wall of the whole method.
2. **Every file gets an explicit `target`.** Verified in the spike: an item without a target (badge, deliberately) landed flat at `src/components/Badge.astro` via the `aliases.components` fallback — losing the `astro-shad/` grouping and breaking its `../../lib/utils` import (one directory level too shallow). Explicit targets were respected exactly. Never rely on alias placement.
3. **Relative imports must be written for the installed layout**, because the CLI doesn't rewrite them (that opacity is a feature — it's why the files survive untouched). `../../lib/utils` from `src/components/astro-shad/` is the canonical shape.
4. **The registry host must be reachable during `add`.** For local dev, `npm run serve` here must be running when the consumer runs `shadcn add`. Obvious in hindsight, easy to forget.
5. **Rebuild before republish.** `public/r/*.json` contain *inlined copies* of file content — editing a `.astro` source does nothing for consumers until `shadcn build` runs again.

## 9. Where this is going (context for future sessions)

The roadmap lives in `README.md` §6. Short version: graduate the token contract and standards doc, adopt astro-icon as the icon convention (string props like `icon="lucide:check"` instead of component imports), then bulk-extract the ~37 converted components from kca-astro in category batches (primitives → text FX → visual FX → sections → the `/dev` playground itself as registry items). `registry.json` supports `include` composition, so the manifest can split into `registry/primitives.json`, `registry/sections.json`, etc. when it grows.
