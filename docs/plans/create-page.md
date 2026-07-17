# Plan: `/create` — the token studio

Status: mapped, page roles and output model decided (2026-07-17), not built. Prerequisite: a healthy primitive set to preview against (post-aggregation sweep).

## Goal

A shadcn.com/create-inspired page: sidebar of global token controls (colours, typography, radii, shadows), live preview of every registry component, and a **"Copy tokens"** action that emits the override block for a consumer's `theme.css`. Two deployment shapes from one source:

1. **In astro-shad itself** (`/create` next to `/dev`): the working tool, run locally to design token sets.
2. **As a registry item** (`npx shadcn add @astro-shad/create-page`): installs a local copy into a consumer repo, previewing against *that repo's* components and current theme, so token tweaks are designed in context.

## Feasibility: high — this is an extraction, not an invention

The pattern already exists and works in `kca-astro` (`src/pages/dev.astro` + DevBoard + token sidebar, per its standards.md §6): token overrides applied as inline styles on `<html>` (session-only), live preview because Tailwind v4 utilities compile to `var(--token)` references, and "Copy tokens" emitting the current override block. Nothing here is unproven. The work is genericising that shell against the neutral theme and packaging it.

Distribution mechanics are also standard: the registry supports `registry:page` items with explicit targets (`src/pages/create.astro`), and multi-file items cover the page + its support components. One open verification: whether nested-component registry items of this size deliver as cleanly as primitives did — same byte-identity test as the original spike.

## The globals question: copy, don't write

Decision (2026-07-17): the tool **emits token overrides for the user to paste**; it does not modify the consumer's `theme.css` itself.

- A browser page cannot write files; auto-apply would require a dev-only Astro API endpoint (`POST /api/tokens` guarded by `import.meta.env.DEV`) that rewrites `theme.css` on disk. Feasible, but it's magic that edits a file the user owns, invites drift between what's on screen and what's on disk mid-edit, and adds a server dependency to an otherwise static page.
- Copy-paste is one step, transparent, undoable via git, and matches the proven kca-astro workflow ("copy tokens when a tweak graduates").
- The dev-endpoint auto-apply can be a v2 enhancement if paste friction actually materialises. Log it, don't build it.

## Sketch of the work (when its time comes)

1. Extract the playground shell from kca-astro (`dev.astro`, `DevBoard.astro`, sidebar script), de-brand to neutral tokens.
2. Sidebar controls grouped by token layer: slot colours, semantic surfaces, radius scale, typography (font stacks + scale), shadows. Each control writes an inline style on `<html>` and marks the token dirty.
3. "Copy tokens" serialises dirty tokens into a ready-to-paste `:root { ... }` / `@theme { ... }` override block, matching theme.css's three-layer structure.
4. Preview area renders every registry component (reuse or import the `/dev` sections).
5. Package as registry item(s): `create-page` (`registry:page`, target `src/pages/create.astro`) + support components with explicit targets. Verify delivery via spike-consumer diff.
6. Page roles (decided 2026-07-17): **`/dev` = component QA** — every component, all variants, both themes; later promotes to a **`/docs`** content-and-usage guide (per-component usage, props, examples) once the doc site takes shape. **`/create` = token design and brand customisation** — the sidebar/canvas tool whose output is a theme.css override block copied to the clipboard. The two share board/preview components.
