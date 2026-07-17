# Plan: brand variant collections

Status: conventions locked (2026-07-17), no variants built yet. Prerequisite: the aggregation sweep surfacing real customised components to graduate.

## Goal

Alongside each neutral primitive, offer personal brand-specific variants graduated from real projects. Workflow: build a custom version of (say) Button inside a client repo → when it's good, duplicate it back into astro-shad as a variant → future repos choose `add @astro-shad/button` (primitive) or `add @astro-shad/button-kca` (variant).

## Feasibility: high — pure convention on top of existing mechanics

The registry format needs nothing new: variants are just more items. All the work was in convention decisions:

All convention decisions are now locked:

### 1. Token-only vs structural — the gatekeeper rule (decided)

Most "custom versions" of a component differ only in token values (accent, radius, shadow) — and the token contract already handles that without any component copy: the *theme* is the variant. So:

- **Diff is only token values → publish a brand theme item** (`theme-kca`: a `theme.css` override block as a `registry:file`), not a component variant. One item re-brands every primitive at once.
- **Diff is structural** (different markup, new variant keys, different behaviour, extra elements) → that earns a component variant item.

This rule is what keeps the collection from sprawling into dozens of near-duplicate files. When graduating a component, first try to express the difference as tokens; only what remains is the variant.

### 2. Naming (decided)

Flat item names, `<component>-<brand>`: `button-kca`, `cta-section-jmn`. Reads naturally in `add` commands, sorts next to its primitive in listings, and needs no registry features. When the collection grows, `registry.json`'s `include` composition can split variants into their own manifest file (`registry/variants-kca.json`) without changing names.

### 3. Coexisting siblings via suffixed filenames (decided 2026-07-17)

Variants are **separate sibling components** at the primitive's depth, distinguished only by filename suffix:

- Source and target (identical, preserving the mirror convention): `src/components/astro-shad/Button-kca.astro`
- Registry item name: `button-kca` (kebab of the filename)

Consequences, all deliberate:

- **Primitive and variant coexist** in a consumer — `add @astro-shad/button` and `add @astro-shad/button-kca` produce two independent files side by side; a repo can use both.
- The registry has no variant concept and needs none: `button-kca` is just another item. The shared name prefix is human convention — the CLI treats the two as unrelated, which means **zero new mechanics** and no delivery tests beyond what the primitives already proved.
- `path === target` holds for variants exactly as for primitives: imports (`../../lib/utils`) are true in source and consumer, and variants render on `/dev` directly alongside their primitive.
- Trade-off accepted: consumers import variants explicitly (`Button-kca.astro`), so switching primitive↔variant means editing imports, not re-running `add`. Explicit beats a filename that means different things in different repos; a consumer wanting swappability can make a local re-export.

### Graduation workflow (per variant)

1. In the client repo, the custom component exists and is proven on a live site.
2. Copy into astro-shad; strip what's expressible as tokens (rule 1) — those values go into the brand theme item instead.
3. Header comment: which primitive it varies, which brand, what's structurally different, usage example.
4. Registry item named `<component>-<brand>`, its own suffixed path/target, `registryDependencies` as usual.
5. `/dev` preview, `registry:build`, ship.

## Risks

- **Maintenance sprawl** — every variant is a fork that doesn't get primitive fixes automatically (copy-and-own cuts both ways). Mitigation: the token-first gatekeeper rule, and treating variants as snapshots of proven work rather than parallel maintained lines.
- **Naming discipline** — `-<brand>` suffixes only mean something if brands are stable identifiers. Keep the brand list short and deliberate (kca, jmn, pcl…).
