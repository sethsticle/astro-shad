# Spike: Option A go/no-go

Goal: confirm the shadcn CLI can build this registry and install `.astro` files, untouched, into an Astro consumer. Everything in the roadmap hangs on this.

The scaffold is designed so one `add` exercises every mechanism at once:

| Mechanism under test | Where |
|---|---|
| `.astro` file passthrough (content untouched) | `button`, `badge` |
| Explicit `target` placement | `button` -> `src/components/astro-shad/Button.astro` |
| Alias-based placement (no target) | `badge` (deliberately has no target -- observe where it lands) |
| `registryDependencies` across the namespace | `button`/`badge` -> `@astro-shad/utils` |
| npm `dependencies` install | `utils` -> clsx, tailwind-merge |
| `registry:file` for non-component assets | `theme` -> `src/styles/theme.css` |

## 1. Build the registry (in this repo)

```sh
npm install
npx shadcn registry validate   # schema check before building
npx shadcn build               # emits public/r/{name}.json
npx serve . -l 4321            # registry now at http://localhost:4321/public/r/{name}.json
```

If `registry validate` is not a recognised subcommand on the installed version, skip it -- `build` validates too.

## 2. Scratch consumer

```sh
npm create astro@latest spike-consumer -- --template minimal --no-git --no-install
cd spike-consumer && npm install
npx astro add tailwind    # Tailwind v4 via @tailwindcss/vite
```

Add `spike-consumer/components.json`:

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
    "@astro-shad": "http://localhost:4321/public/r/{name}.json"
  }
}
```

And in `spike-consumer/tsconfig.json` (the CLI resolves `@/` aliases through it):

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## 3. Add and inspect

```sh
npx shadcn add @astro-shad/button
npx shadcn add @astro-shad/badge
npx shadcn add @astro-shad/theme
```

Checklist:

- [ ] `src/components/astro-shad/Button.astro` exists and is byte-identical to `components/Button.astro` here (`diff` them). **This is the go/no-go check.**
- [ ] `src/lib/utils.ts` arrived automatically (registryDependency) and `clsx` + `tailwind-merge` were added to package.json.
- [ ] Where did Badge land, and did its `../../lib/utils` import survive? (No target -- records how alias placement treats `.astro`.)
- [ ] `src/styles/theme.css` arrived via `registry:file`.
- [ ] Import `theme.css` from `global.css`, drop a `<Button>` + `<Badge>` on `index.astro`, `npm run dev` -- variants render, focus rings work, `data-theme="light"` flips.

## 4. Recording the outcome

- **All green:** Option A confirmed. Next roadmap steps: decide button/badge target convention based on what 3 showed (explicit targets vs aliases), then bulk extraction.
- **`.astro` content mangled or refused:** capture the exact failure here, then evaluate jsrepo (Option B) with the same two components.
- Known risks to watch: the CLI rewriting import paths inside files (that is why the components use relative imports, not `@/` aliases -- relative paths only survive if the file is treated as opaque, which is exactly what we are testing); `registryDependencies` using the `@astro-shad/` prefix resolving correctly from inside the same registry.

## Outcome

**GO -- Option A confirmed (2026-07-16).** `npx shadcn add @astro-shad/button` into the scratch Astro consumer:

- Created `src/components/astro-shad/Button.astro` -- `diff` against the registry source came back **clean (byte-identical passthrough)**. The ts-morph TSX parse is harmless; only the `tsx: false` Babel pass was destructive.
- `registryDependencies: ["@astro-shad/utils"]` resolved across the namespace: `src/lib/utils.ts` was created in the same add.
- npm `dependencies` flowed through: `clsx` + `tailwind-merge` added to the consumer package.json.
- Explicit `target` placement respected exactly.

- `badge` (no file target): landed at **`src/components/Badge.astro`** -- the `aliases.components` directory, flat, no subfolder. Note the file's `../../lib/utils` import does NOT resolve from there (it points at `<root>/lib/utils`, one level too high). Alias placement also skipped re-writing `src/lib/utils.ts` (already present from the button add, deduped with "Skipped 1 file").
- `theme` (`registry:file`): delivered exactly to its target, **`src/styles/theme.css`**.

### Conventions locked in by these results

1. **Every file in every registry item gets an explicit `target`.** Alias placement puts components at `src/components/<Name>.astro`, which breaks the relative `lib/utils` imports and loses the `astro-shad/` grouping. Standard target: `src/components/astro-shad/<Name>.astro` (components), `src/lib/utils.ts` (lib), `src/styles/<name>.css` (styles).
2. **Consumers must set `"tsx": true`** in components.json (see Findings above). This goes in the consumer-setup doc.
3. Relative imports written for the installed layout (`../../lib/utils` from `src/components/astro-shad/`) are the correct convention -- they survive untouched.

Remaining checklist item: render test (import theme.css from global.css, place Button + Badge on index.astro, check variants / focus rings / data-theme flip). Badge should be re-added after giving it a target, or moved to `src/components/astro-shad/` by hand, so its import resolves.

### Findings so far (2026-07-16)

- `registry validate` and `build` accept `.astro` items. `add` resolves the `@astro-shad` namespace and fetches items (registry server must stay running during consumer steps).
- **Consumers MUST set `"tsx": true` in components.json.** With `tsx: false` the CLI runs a strict Babel TSX->JSX conversion over every installed file regardless of extension, and it hard-fails on `.astro` frontmatter (`import can only be used in import() or import.meta (16:0)`). With `tsx: true` that step is skipped entirely (verified in the CLI source: `transformJsx: !config.tsx`, and the JSX transformer returns the raw text when `config.tsx` is set).
- The rest of the pipeline parses files with error-tolerant ts-morph as TSX; it does not throw on `.astro` content. Whether it leaves the bytes fully untouched is what the `diff` check confirms.
