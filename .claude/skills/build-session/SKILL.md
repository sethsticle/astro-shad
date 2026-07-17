---
name: build-session
description: Run an astro-shad build session — convert/create registry components or layout sections per the frontend contract, wire them into /dev and registry.json, and append them to the graduation queue. No docs work. Use when the user wants to build, convert, or scrape new components/sections.
---

# Build session

You are running a **build-stage** session for the astro-shad registry. The arguments (if any) name what to build or the source to convert from (e.g. "tailark hero pricing", "reactbits dock").

## First, read

1. `docs/frontend-contract.md` — the canonical rules. Sections 1–6 govern components, §7 governs layout sections. Follow it exactly.
2. `session_manifest/index.md` — current state and anything in flight.
3. `docs/graduation-queue.md` — if pending (`built`) rows exceed ~10, tell the user a docs session is overdue before adding more.

## Per item, in ship order

1. Convert/create the source per the contract (components: §4; sections: §7). Relative imports only; explicit `interface Props`; header comment block.
2. Add its item to `registry.json` — explicit `target` on every file, `path` === `target`, `registryDependencies: ["@astro-shad/utils"]` if it uses `cn()`.
3. Add a `/dev` playground section exercising all variants (the user eyeballs both themes).
4. Run `npm run registry:validate` (you have standing permission for validate).
5. Append a row to `docs/graduation-queue.md`: item, date, source/inspiration, dense notes for the docs writer (quirks, decisions, gotchas hit), status `built`.

## Boundaries

- **Do NOT** write docs pages, docs demos, or touch `docs-nav.ts` — that is the docs session's job (`/docs-session`).
- **Do NOT** run `npm run registry:build`, `git commit`, or `git push` — the user runs those. End by handing over the exact commands and listing what to eyeball on `/dev`.

## Close out

Append a session entry to `session_manifest/index.md` (done / decided / next), including which queue rows were added.
