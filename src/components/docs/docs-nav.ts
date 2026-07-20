/**
 * docs-nav.ts -- the single source of truth for the docs sidebar.
 *
 * Documenting a new component = add one item here + create its page at
 * src/pages/docs/components/<slug>.astro. Nothing else to wire.
 */
export interface DocsNavItem {
  title: string;
  href: string;
  status?: "stable" | "experimental";
  /** installs a runtime npm dependency (maplibre-gl, gsap, ...) -- shown as a sidebar badge */
  deps?: boolean;
}

export interface DocsNavGroup {
  label: string;
  items: DocsNavItem[];
}

export const GITHUB = "https://github.com/sethsticle/astro-shad";
export const SOURCE_BASE = `${GITHUB}/blob/main/src/components/astro-shad`;

export const NAV: DocsNavGroup[] = [
  {
    label: "Getting started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Usage & requirements", href: "/docs/usage" },
    ],
  },
  {
    label: "Primitives",
    items: [
      { title: "Accordion", href: "/docs/components/accordion" },
      { title: "Badge", href: "/docs/components/badge" },
      { title: "Button", href: "/docs/components/button" },
      { title: "Button Group", href: "/docs/components/button-group" },
      { title: "Card", href: "/docs/components/card" },
      { title: "Pagination", href: "/docs/components/pagination" },
      { title: "Tabs", href: "/docs/components/tabs" },
    ],
  },
  {
    label: "Forms",
    items: [
      { title: "Form", href: "/docs/components/form" },
      { title: "Date Picker", href: "/docs/components/date-picker" },
    ],
  },
  {
    label: "Visual",
    items: [
      { title: "Glass Icon", href: "/docs/components/glass-icon" },
      { title: "Folder", href: "/docs/components/folder" },
      { title: "Bubble Menu", href: "/docs/components/bubble-menu" },
      { title: "Magic Bento", href: "/docs/components/magic-bento" },
      { title: "Pulse Grid", href: "/docs/components/pulse-grid" },
      { title: "Pixel Transition", href: "/docs/components/pixel-transition" },
    ],
  },
  {
    label: "Text FX",
    items: [
      { title: "Text Type", href: "/docs/components/text-type" },
      { title: "Rotating Text", href: "/docs/components/rotating-text" },
      { title: "Split Text", href: "/docs/components/split-text" },
      { title: "Count Up", href: "/docs/components/count-up" },
      { title: "Curved Loop", href: "/docs/components/curved-loop", status: "experimental" },
      { title: "Logo Loop", href: "/docs/components/logo-loop" },
      { title: "Logos Carousel", href: "/docs/components/logos-carousel" },
      { title: "Highlighted Text", href: "/docs/components/highlighted-text" },
    ],
  },
  {
    label: "Components",
    items: [
      { title: "Top Bar", href: "/docs/components/top-bar" },
      { title: "Floating Header", href: "/docs/components/floating-header" },
      { title: "Map", href: "/docs/components/map", deps: true },
      { title: "Theme Toggle", href: "/docs/components/theme-toggle" },
    ],
  },
  {
    label: "Motion",
    items: [{ title: "Motion", href: "/docs/components/motion" }],
  },
  {
    label: "Layouts",
    items: [
      { title: "Hero", href: "/docs/components/hero" },
      { title: "Split", href: "/docs/components/split" },
      { title: "Feature Grid", href: "/docs/components/feature-grid" },
      { title: "Feature Section", href: "/docs/components/feature-section" },
      { title: "CTA", href: "/docs/components/cta" },
      { title: "GSAP Hero 01", href: "/docs/components/gsap-hero-01", deps: true },
    ],
  },
];
