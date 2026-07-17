# astro-shad

Personal shadcn-compatible registry serving hand-converted `.astro` components (HTML + Tailwind v4 + minimal vanilla JS, zero React runtime). The method is proven end-to-end: `.astro` files deliver byte-identical through the shadcn CLI from GitHub raw URLs.

## Read first

1. **`session_manifest/index.md`** — what's been done, current state, and the ongoing plan. Update it at the end of every session.
2. **`docs/how-it-works.md`** — registry mechanics, recipes, and the five gotchas (the `tsx: true` requirement, explicit targets, relative imports). Do not violate the gotchas; each one was paid for.
3. **`docs/frontend-contract.md`** — the canonical internal contract: conversion rules, token system, layout (sections) contract, and the build/docs session pipeline. All new components and sections follow it. (`docs/standards.md` is a retired pointer stub.)

## Layout

The repo is itself an Astro app whose source tree **mirrors the installed layout** — `path` === `target` for every registry item, every relative import is true in both source and consumer:

- `src/components/astro-shad/` — component sources (the registry payload)
- `src/lib/utils.ts`, `src/styles/theme.css` — lib + token contract items
- `src/pages/dev.astro` — the playground; every component gets a section before it ships
- `registry.json` — the manifest; `public/r/` — built output, **committed on purpose** (it IS the hosted registry, served via raw.githubusercontent.com)
- `spike-consumer/` — scratch Astro consumer for delivery tests (`add` + diff)
- `docs/plans/` — mapped future work

## Commands

- `npm run dev` — playground at `/dev`
- `npm run registry:build` — regenerate `public/r/` (required before any push that changed sources or registry.json)
- `npm run registry:validate` — schema check

Publishing = commit (including rebuilt `public/r/`) + push to `github.com/sethsticle/astro-shad` (public). Consumers pull via `npx shadcn add @astro-shad/<name>`.

## Working rules

- Work runs as a two-stage pipeline (frontend-contract.md §8): **build sessions** (`/build-session`) create items and append them to `docs/graduation-queue.md`; **docs sessions** (`/docs-session`) review pending items against the contract and write their docs. Don't mix the stages.
- New item ship order: convert per frontend-contract.md §4 (components) or §7 (sections) → item in `registry.json` (explicit targets) → `/dev` section → queue row → `registry:build` → commit + push. Publishing never waits for docs.
- Never use `@/` aliases inside component sources (relative imports only) until the spike-2 alias test in the session manifest has been run and passed.
- The user runs git/npm commands themselves; prepare changes and hand over the commands.
- End of session: append an entry to `session_manifest/index.md` (done / decided / next).
