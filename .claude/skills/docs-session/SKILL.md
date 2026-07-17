---
name: docs-session
description: Run an astro-shad docs session — process the graduation queue: cold-read each pending item, review it against the frontend contract, write its docs page/demos/nav entry, and flip its queue row to documented. No new components. Use when the user wants to document built items or work through the queue.
---

# Docs session

You are running a **docs-stage** session for the astro-shad registry. Process the whole queue unless the arguments name specific items.

## First, read

1. `docs/frontend-contract.md` — the canonical rules; you review against it.
2. `docs/graduation-queue.md` — the work list: every row with status `built`.
3. `session_manifest/index.md` — recent context.

## Per pending item

1. **Cold-read the component source** in `src/components/astro-shad/` and review it against the contract (tokens only, interactivity ladder, relative imports, header comment, explicit targets in `registry.json`). You didn't write it — that's the point. Report violations to the user; fix only clear contract violations, never redesign or change behaviour.
2. **Demos**: create demo files under `src/components/docs/demos/<slug>/` (e.g. `Basic.astro`, `Variants.astro`). Demos import the component relatively and stay minimal — they render inside `ComponentPreview`/`VariantBlock` and their source shows verbatim in the docs.
3. **Docs page** at `src/pages/docs/components/<slug>.astro` following the existing pages' shape (`button.astro` is the reference): `DocsLayout` with `title`/`description`/`registry`/`sourceFile`, demos imported both as components and via `?raw` for the source view, `PropsTable`, install snippet.
4. **Nav**: add the item to the right group in `src/components/docs/docs-nav.ts` (layout sections go under "Layouts").
5. **Flip the queue row** to `documented` with today's date.

## Gotchas

- Import demo source via `?raw` — never inline component tag-strings in a docs page's frontmatter template literals. Combined with a bare `Props` word in the template, that panics `@astrojs/compiler` and crash-loops language servers (session manifest 2026-07-17 f). If frontmatter must hold tag-strings, guard with `interface Props {}`.
- Some queue rows are docs *refreshes* (a prop added after the page was written), not new pages — read the row's notes.

## Boundaries

- **Do NOT** build new components or add registry items.
- **Do NOT** run `npm run registry:build`, `git commit`, or `git push` — the user runs those. `npm run registry:validate` is allowed if you touched `registry.json` fixing a violation.

## Close out

Append a session entry to `session_manifest/index.md`: items documented, contract violations found (fixed vs reported), queue state after.
