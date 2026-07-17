# Plan: mapcn port — MapLibre GL map family (phased)

Status: phases 1–3 built 2026-07-17 (items `map` [Map, MapMarker, MapControls, MapPopup], `map-route`, `map-geojson`); phase 4 (map-arc + map-cluster) next. Map.astro stamps `data-map-theme` on its root so layer children resolve theme-aware paint defaults at re-add time. Phase-1 field notes: theme fallback changed from system preference to dark (token default) with a subtree observer (scoped `[data-theme]` may not exist at init); marker popup toggling is owned by the marker script (click + stopPropagation + Enter/Space), not marker.setPopup's map-click plumbing; default pin dot is bg-accent. MapPopup joined the `map` item (shared chrome) with closeOnClick defaulting false — a static popup must survive stray clicks. Source: mapcn's `map.tsx` (2,225 lines, React), ripped to `temp_ripping_comps/shadcn-sandbox/src/components/ui/map.tsx`.

## Goal

A shadcn-registry map family in Astro + vanilla JS, unlocking the standing client request "can I have a map of my business location" — and beyond it routes, choropleths, arcs, and clustered points. Zero React runtime; MapLibre GL is the only browser dependency.

## Feasibility: high — the React layer is thin glue

MapLibre GL is itself an imperative vanilla JS library. Every mapcn component is React lifecycle scaffolding around plain calls (`new Marker()`, `map.addSource()`, `map.on("click", layerId, …)`). The port re-architects the *wiring*, not the logic:

- **Portals disappear.** React needs `createPortal` to put JSX inside MapLibre's DOM elements; Astro slot content is already real DOM — hand the element to `Marker({ element })` / `Popup.setDOMContent()`.
- **Prop-reconciliation effects disappear.** Most of the 2.2k lines exist to sync changed props onto the map. Astro components render once; there is nothing to reconcile.
- **The arc math, theme detection, and hover feature-state logic port nearly verbatim** — they are already vanilla JS inside hooks.

What does NOT survive: controlled viewport (`viewport`/`onViewportChange` React state), `useMap()` context hook, TypeScript generics on layer props, callback props. Replacements below.

## Architecture decisions (locked for all phases)

1. **Composition model — inert DOM + one wiring script.** Child components (`MapMarker`, `MapControls`, layer components) render hidden/inert markup with `data-map-*` attributes and slotted content inside `<Map>`'s default slot. `Map.astro`'s script initialises MapLibre, then scans its own subtree and wires each child: markers get their element handed to `new Marker({ element })`, layer configs are read from `data-*` JSON. Same compound-component pattern as Tabs/Accordion (contract §5.3), scoped per map root.
2. **Compound collapse.** React's `MapMarker` + `MarkerContent` + `MarkerPopup` + `MarkerTooltip` + `MarkerLabel` (5 components) collapse into **one `MapMarker.astro`**: default slot = marker content (fallback: the blue-dot default icon), named slots `popup`, `tooltip`, `label`. Contract §4.4 exactly.
3. **Events out, not callbacks in.** `onClick`/`onHover`/`onLocate` props become `CustomEvent`s dispatched from the map root (`map:marker-click`, `map:geojson-click`, `map:locate`, …) with the mapcn payload shapes in `detail`. The live `MapLibreGL.Map` instance is exposed for imperative use (`flyTo`, adding bespoke layers): stored on the root element and announced via a `map:ready` event.
4. **Dependency tier.** `maplibre-gl` (~220 KB gz, WebGL) is the registry's first vanilla runtime npm dep — not Tier A (it ships to the browser), not Tier B (no React). Treat as "Tier B minus React": justified interactivity that cannot be static output, copy-to-own, declared as `dependencies: ["maplibre-gl"]` on the `map` item so the CLI installs it. The map CSS is imported in the component script (`import "maplibre-gl/dist/maplibre-gl.css"`) and bundled by Vite.
5. **Theme.** Port mapcn's detection (checks `dark`/`light` class and `data-theme` attribute, `MutationObserver` + `matchMedia` fallback) — it already matches our `html[data-theme]` token contract. Basemap swaps between Carto positron (light) / dark-matter (dark) on theme change, full reload (`diff: false`) so `style.load` fires deterministically (mapcn comment: a successful diff never fires it). Layer children re-add themselves after a style swap.
6. **Icons.** lucide-react (`Plus`, `Minus`, `Locate`, `Maximize`, `Loader2`, `X`) → inline SVG per contract §2. The compass SVG ports as-is.
7. **Tokens.** mapcn's UI chrome already uses slot utilities (`bg-popover`, `border-border`, `hover:bg-accent`) — keep. Its hardcoded marker default `bg-blue-500` becomes `bg-primary`; JS-side paint defaults (`#4285F4` route/arc, cluster greens/reds, GeoJSON monochrome pair) stay literal hex — they are MapLibre canvas paint values, not class attributes, and mapcn deliberately hardcodes the GeoJSON grays per theme. Overridable via props.
8. **Naming + placement.** Components at primitive depth: `src/components/astro-shad/Map.astro`, `MapMarker.astro`, `MapControls.astro`, `MapPopup.astro`, `MapRoute.astro`, `MapGeoJSON.astro`, `MapArc.astro`, `MapClusterLayer.astro` (family like ButtonGroup). Registry items per phase: `map` (core files together), then `map-route`, `map-geojson`, `map-arc`, `map-cluster` with `registryDependencies: ["@astro-shad/map"]` — consumers pull only the layers they use.
9. **SSR-safety.** All MapLibre work in the component `<script>`; server renders the container div + inert children + the loader dots (removed on `load`). Container is `relative h-full w-full` — consumer owns the height, documented loudly (the #1 "my map is blank" cause).

## Phases

### Phase 1 — `map` item: the business-location cut *(built 2026-07-17)*

Files: `Map.astro`, `MapMarker.astro`, `MapControls.astro`.

- **Map**: MapLibre init, Carto light/dark basemaps + theme watcher, `blank` transparent style prop, globe `projection` prop, spread-through MapLibre options (center/zoom/etc. as props), loader overlay, `map:ready`, instance on root element.
- **MapMarker**: lng/lat props, draggable, offset/rotation/alignment options; default slot content (blue→primary dot fallback), `popup` slot (click, optional close button), `tooltip` slot (hover popup, `pointer-events-none` styling), `label` slot (absolutely-positioned text, top/bottom). Marker events as CustomEvents.
- **MapControls**: position prop, zoom / compass (live bearing+pitch rotation) / locate (geolocation + flyTo, 10s timeout, spinner) / fullscreen groups, inline SVGs, token chrome.

Ship: item `map` in `registry.json` (explicit targets, `dependencies: ["maplibre-gl"]`, `registryDependencies: ["@astro-shad/utils"]`) → `/dev` section (business-location demo: marker + popup + controls, both themes) → validate → queue row.

### Phase 2 — `map-route` + standalone `MapPopup` *(built 2026-07-17; MapPopup joined the `map` item)*

- **MapRoute**: line source/layer from a coordinates prop (JSON), color/width/opacity/dashArray, hover cursor + click/enter/leave events. Nearly pure MapLibre — cheapest port in the file.
- **MapPopup**: popup at fixed lng/lat, slot content, close button, `map:popup-close` event. Decide at build time whether it joins the `map` item (it shares the popup chrome) or ships as its own item with the route.

Covers "show the route to my shop" and callout annotations.

### Phase 3 — `map-geojson` *(built 2026-07-17)*

- **MapGeoJSON**: data (inline JSON or URL), fill + outline layers over theme-aware monochrome defaults, `promoteId` + hover feature-state (`case` expression merge — port `mergeHoverPaint`), click/hover events with feature payloads, `beforeId` z-order, `fillPaint`/`linePaint`/`false` to omit layers. Pairs with `Map blank` for choropleths. Generics flatten to plain JSON props.

### Phase 4 — `map-arc` + `map-cluster` *(next)*

- **MapArc**: quadratic-Bézier arcs with antimeridian unwrapping (`buildArcCoordinates` ports verbatim), invisible fat hit layer, hover feature-state paint, data-driven paint expressions. The marketing "global reach" visual.
- **MapClusterLayer**: clustered GeoJSON source, step-expression circles + count labels + unclustered points, cluster-click zoom-to-expansion default, point-click events. Note: cluster count layer uses `text-font: ["Open Sans"]` — verify glyphs exist in the active basemap style, or make the font a prop.

Both are self-contained (source + layers + events, no DOM children) — mechanical once the phase-1 wiring pattern exists.

### Phase 5 (stretch) — polish pass

Only if real use demands: draggable-marker demo patterns, `hero-map` section composing Map into a contact/location section per the layout contract (§7), spike-consumer delivery test of the npm-dependency path (first item to exercise `dependencies` installation through the CLI — worth one explicit verification).

## Risks

- **First runtime npm dep.** The `dependencies` install path through `npx shadcn add` is proven by shadcn generally but untested in *this* registry — the phase-5 spike-consumer diff covers it; don't wait on it to ship (worst case the consumer runs `npm i maplibre-gl` manually).
- **Style-swap teardown.** mapcn's trickiest logic: on theme change all sources/layers die with the old style and must re-add. Phase 1 must build the re-add hook into the wiring script from the start (layer children register re-init callbacks), or phases 2–4 will each rediscover the bug.
- **Container height.** `h-full` on a parent with no height renders 0px. Docs and `/dev` demos always show an explicit height wrapper.
- **Carto basemap terms.** Default styles hit `basemaps.cartocdn.com` (free tier, attribution kept via MapLibre's compact attribution control). `styles` prop lets consumers point at their own tiles; `blank` needs no tiles at all.
