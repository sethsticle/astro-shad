# Plan: iframe-accurate device preview for docs demos

Status: mapped (2026-07-19), not started. Grew out of building the `/dev` playground's per-dev-group phone/tablet/laptop toggle and hitting its ceiling.

## Goal

Give `ComponentPreview.astro` (and by extension every `<VariantBlock>` demo across the docs pages) a phone/tablet/laptop viewport toggle that is **genuinely accurate** -- real `sm:`/`md:`/`lg:` breakpoints and `svh`/`dvh`/`vh` units resolving correctly, not approximated.

## Why not just reuse the `/dev` toggle's approach

`/dev`'s toggle (`src/pages/dev.astro`, `.group-canvas` + the per-dev-group JS) narrows a `<div>` inside the same document. That's fast and fine for a quick internal gut-check, but it has two real ceilings, both discovered live while building it:

1. **`svh`/`dvh`/`vh` units always resolve against the real browser viewport, never a container.** Worked around for `min-h-svh` specifically (`Hero-01..04`) via a `min-height: 100%` override plus a flex-stretch chain down to the element -- see the `.tall-canvas` rules in `dev.astro`. That fix is component-specific and had to be hand-verified against the real markup shape (an intermediate `overflow-hidden` wrapper div broke the percentage chain the first time).
2. **`sm:`/`md:`/`lg:` are real-viewport media queries.** No container-width trick makes them reconsider a narrowed `<div>` -- confirmed on `FeatureSection-01`'s `sm:grid-cols-2 lg:grid-cols-3` grid, which squeezed into three illegibly narrow columns in the fake-mobile toggle despite being correctly mobile-first (implicit single column at the base). Not a component bug; a devboard-fidelity gap.

An `<iframe>` sidesteps both for free: from the browser's perspective a same-origin iframe *is* a real, separate document with its own real viewport, so both problems simply don't exist there -- no per-component hacks, no hand-verified chains.

## Why it's a good fit for docs specifically (unlike `/dev`)

`/dev` is one monolithic page with ~16 boards and ~40 inline dev-groups; making each one iframe-able would mean restructuring the whole page into individually-addressable routes for a tool only the maintainer uses for a fast check. Disproportionate -- not planned.

Docs demos are already isolated, one-per-file, under `src/components/docs/demos/**/*.astro` (e.g. `demos/split-text/Basic.astro`). That's already the shape an iframe wants. And the audience differs: someone reading docs deciding whether to `npx shadcn add` a component genuinely benefits from seeing true device behaviour before installing; that's worth the extra weight where a maintainer's internal gut-check isn't.

## The blocker: `<slot />` content is already inline

`ComponentPreview.astro` currently renders demos via `<slot />` -- already-resolved markup in the *same* document as the docs page. An iframe needs a `src` pointing at a real separate document; you can't wrap already-inlined HTML in an iframe tag and get viewport isolation. This is the one piece that makes it a real feature, not a CSS/JS tweak.

## Sketch of the work (when its time comes)

1. **New route**: `src/pages/docs/_demo-frame/[...slug].astro`. Use `import.meta.glob('../../../components/docs/demos/**/*.astro')` to resolve a slug (e.g. `"accordion/boxed-02"`) to its component, rendered inside a minimal shell that just imports `global.css` -- no token-override machinery needed, docs demos ship at default theme. Needs `getStaticPaths()` for the static build; one small static HTML output per demo file.
2. **Thread a slug prop through**: `VariantBlock.astro` and `ComponentPreview.astro` both need a `demoSlug` prop so `ComponentPreview` knows what URL to point the iframe at. Every existing `<VariantBlock ... source={...}>` call site across the docs pages needs that prop added -- mechanical, one line each, but scales with however many variants are documented by the time this is picked up.
3. **`ComponentPreview.astro`**: add the phone/tablet/laptop toggle UI (same visual pattern as `/dev`'s per-group toggle -- lucide icons, `aria-pressed` state), but instead of narrowing a `<div>`, set the `<iframe>`'s actual `width`/`height` attributes per device preset. That's what makes it correct: real breakpoints and viewport units evaluate against the iframe's genuine size, zero workarounds required.
4. Verify: pick a demo that uses an `sm:`/`lg:` grid (e.g. whatever ships from `FeatureSection-01`'s pattern) and confirm it actually reflows inside the phone-width iframe, unlike the `/dev` version of the same problem.

## Non-goals

- Not retrofitting `/dev` itself -- its div-based toggle stays as the fast internal check, caveats documented inline in its CSS comments.
- Not adding token-override controls to the demo-frame shell -- docs demos preview at shipped defaults, that's the `/create` tool's job (see `create-page.md`) if it's ever wanted there.
