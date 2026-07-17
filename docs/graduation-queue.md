# Graduation queue

The build→docs handoff ledger (see `frontend-contract.md` §8). Build sessions append rows with status `built`; docs sessions review each pending item against the contract, write its docs, and flip the row to `documented` with the date. Keep notes dense — they're the docs writer's briefing. If pending rows exceed ~10, run a docs session before building more.

| Item | Built | Source / inspiration | Notes for the docs writer | Status |
|---|---|---|---|---|
| top-bar | 2026-07-17 | kca-astro sweep | Was docced under duplicate item `header01`; consolidated 2026-07-17 — duplicate registry item deleted, docs page/demos/nav renamed to top-bar. | documented |
| floating-header | 2026-07-17 | kca-astro sweep | Was docced under duplicate item `header02`; consolidated 2026-07-17 — duplicate deleted, docs renamed. DocsLayout itself uses it ("registry's first consumer"). | documented |
| accordion `highlight` prop | 2026-07-17 | user-added, ported to 02/03 | Docs refresh, not a new page: accordion page's props/demos don't mention `highlight` (accent border + text on the open item, all three variants). Demos `Single.astro`/`Boxed02.astro`/`Icons.astro` already use it. | built |
| hero-01 | 2026-07-17 | layout sections plan (contract §7) | First section item; establish the docs "Layouts" nav group with this batch. SHIPS POPULATED (§7 reworked same day): `<Hero01 />` is the whole demo; customise = edit your installed copy (content block delimited by a `<!-- content — yours to edit -->` comment). Docs page should teach that model, not props. Imports Badge+Button from `../`; deps declared. `background` slot for the effects pass. | built |
| hero-02 | 2026-07-17 | layout sections plan | Ships populated; content anchored bottom-left, editorial composition — docs should show a full-bleed image in the `background` slot. `min-h-svh` not `h-screen` (URL bars). Deps: button. | built |
| hero-03 | 2026-07-17 | layout sections plan | Ships populated; centered hero + bottom card strip as auto-fit grid (`minmax(13rem,1fr)`) — 3 or 4 cells adapt, no prop. Deps: button, card. | built |
| split-01 | 2026-07-17 | layout sections plan | Ships populated; media half is a token-styled placeholder surface the consumer swaps for img/video. `reverse` prop = `md:order-last` (source order unchanged, mobile always stacks media-first; worth stating in docs). Deps: button. | built |
| feature-grid-01 | 2026-07-17 | layout sections plan | Ships populated with three demo Cards; `columns` 3\|4 prop (add a fourth card for 4). Deps: card. | built |
| cta-01 | 2026-07-17 | layout sections plan | Ships populated; narrow band on `bg-card` surface; `background` slot is INSIDE the band (gradient/glow later, effects pass). Deps: button. | built |
