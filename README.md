# astro-shad

A personal registry of shadcn-quality components converted to lightweight Astro — HTML + Tailwind v4 + minimal vanilla JS, zero React runtime — pullable into any Astro repo with the standard shadcn CLI, then re-branded through tokens.

## Why

shadcn, reactbits, and tailark components keep getting hand-converted to self-contained `.astro` files, project after project. The recipe is stable and repo-agnostic; only token *values* are per-brand. This registry is where those conversions live once, get pulled from everywhere, and stay neutral until a consuming repo brands them.

The shadcn registry format is just JSON over HTTP — it delivers `.astro` files byte-identical (verified 2026-07-16). No custom tooling, no lock-in: consumers use the `shadcn` CLI they already have.

## Use it (consumer repo)

In an Astro + Tailwind v4 project, add to `components.json`:

```jsonc
{
  "tsx": true,   // REQUIRED -- see docs/how-it-works.md, gotcha #1
  "registries": {
    "@astro-shad": "https://raw.githubusercontent.com/sethsticle/astro-shad/main/public/r/{name}.json"
  }
}
```

Then:

```sh
npx shadcn add @astro-shad/theme     # once per repo: the token contract
npx shadcn add @astro-shad/button    # any component; deps resolve automatically
```

Full consumer setup (including from-scratch scaffolding): [docs/how-it-works.md §7](docs/how-it-works.md).

## Develop it (this repo)

The repo is itself an Astro app whose source tree mirrors the installed layout — every component renders on the local playground before it ships.

```sh
npm install
npm run dev                 # playground at /dev
npm run registry:build      # regenerate public/r/*.json (commit these -- they ARE the hosted registry)
```

## What's in the registry

| Item | What it is |
|---|---|
| `theme` | Three-layer token contract (slot vars → semantic utilities → Tailwind bridge), neutral values |
| `utils` | `cn()` — clsx + tailwind-merge |
| `button`, `badge`, `card` | Primitives, zero client JS |
| `tabs`, `accordion` | Primitives with minimal vanilla JS replacing Radix |

## Docs

- **[docs/how-it-works.md](docs/how-it-works.md)** — the full explanation: mental model, registry anatomy, recipes for adding/editing/consuming, the gotchas. Start here.
- **[docs/standards.md](docs/standards.md)** — the conversion standards: how React-dependency components become primitive Astro components.
- **[docs/investigation.md](docs/investigation.md)** — the original investigation and option analysis (historical).
- **[docs/plans/](docs/plans/)** — mapped-out future work (`/create` token studio, brand variant collections).
- **[session_manifest/index.md](session_manifest/index.md)** — running log of what's done and what's next.
