/**
 * theme.ts -- astro-shad dark/light toggle runtime. Registry item:
 * @astro-shad/theme-script (distinct from @astro-shad/theme, the CSS-only
 * token-contract item -- no name collision, no relation beyond both
 * touching "theme").
 *
 * Two pieces, same split as @astro-shad/motion's MOTION_PREHIDE_CSS +
 * initMotion(): a pre-paint script (FOUC guard) and a click-handler
 * initializer, both consumed once per page.
 *
 *   <script is:inline set:html={THEME_PREHIDE_JS}></script>
 *   ...
 *   <script>
 *     import { initThemeToggle } from "../lib/theme";
 *     initThemeToggle("my-toggle-id");
 *   </script>
 *
 * Extracted 2026-07-20 from BaseLayout.astro (chunk 4 of the /create
 * sequencing, docs/plans/create-page.md) so a consumer gets the whole
 * toggle via `npx shadcn add @astro-shad/theme-toggle` instead of hand-
 * wiring a script -- see ThemeToggle.astro, the component that pairs with
 * this lib.
 */

/**
 * Restores the stored theme before first paint. Astro SSGs dark-by-default
 * markup (theme.css's :root has no [data-theme] guard), so a returning
 * light-mode visitor would flash dark for one frame without this running
 * inline in <head>, ahead of anything else.
 */
export const THEME_PREHIDE_JS = `
if (localStorage.getItem("astro-shad-theme") === "light") {
  document.documentElement.dataset.theme = "light";
}
`;

/**
 * Wires a click listener onto the element with `buttonId`: flips
 * `document.documentElement.dataset.theme` between "light"/"dark" and
 * persists the choice. Parameterized (not hardcoded to one id) so more
 * than one toggle instance -- or a consumer's own custom trigger element
 * -- can reuse the same logic.
 */
export function initThemeToggle(buttonId: string): void {
  document.getElementById(buttonId)?.addEventListener('click', () => {
    const el = document.documentElement;
    el.dataset.theme = el.dataset.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('astro-shad-theme', el.dataset.theme);
  });
}
