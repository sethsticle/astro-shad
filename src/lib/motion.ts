/**
 * motion.ts -- astro-shad tier-1 motion runtime (docs/plans/motion-system.md).
 * Native WAAPI, zero dependencies. Registry item: @astro-shad/motion.
 *
 * Mechanism: any element carrying `data-motion` gets picked up by
 * `initMotion()` and animated with `Element.animate()`. Because every
 * shipped astro-shad component already spreads `{...rest}` from
 * `Astro.props` onto its root element (confirmed on Button.astro,
 * Card.astro, and every layout section), `{...motion(...)}` works on any
 * existing component with zero source edits -- that spread is what this
 * whole system leans on.
 *
 * Usage:
 *
 *   <Card {...motion("fade-up", { trigger: "in-view", delay: 100 })}>
 *   <Button {...motion("scale-in-[0.8]", { trigger: "hover" })}>
 *
 * Bootstrap a page with the pre-hide CSS + the sweep once:
 *
 *   <style set:html={MOTION_PREHIDE_CSS}></style>
 *   <script>
 *     import { initMotion } from "../lib/motion";
 *     initMotion();
 *   </script>
 *
 * Stagger-of-siblings: mark the parent with `motionStagger(amount)` --
 * each direct child carrying `data-motion` gets `index * amount` ms added
 * on top of its own `delay`, computed once before the main sweep runs.
 *
 *   <div {...motionStagger(80)}>
 *     <Card {...motion("fade-up", { trigger: "in-view" })} />
 *     <Card {...motion("fade-up", { trigger: "in-view" })} />
 *   </div>
 *
 * Presets and their modifier support (`-<modifier>` after the base name):
 *
 *   `fade`                                    -- opacity only. No modifier.
 *   `fade-up/down/left/right`                 -- opacity + translate.
 *     bare number = px translate distance (default 16px); bracket = verbatim CSS length.
 *   `slide-up/down/left/right`                -- translate only, no opacity change.
 *     same modifier rules as the fade-* family.
 *   `scale-in`                                -- opacity + scale up from below 100%.
 *     bare number = percentage points below 100 (scale-in-10 -> scale(0.90), default 10);
 *     bracket = verbatim scale() value.
 *   `scale-out`                               -- opacity + scale down from above 100%.
 *     bare number = percentage points above 100 (scale-out-10 -> scale(1.10), default 10);
 *     bracket = verbatim scale() value.
 *   `rotate`                                  -- opacity + rotation to rotate(0).
 *     bare number = degrees (default 8); bracket = verbatim CSS angle.
 *   `blur-in`                                 -- opacity + filter: blur() to sharp.
 *     bare number = px blur radius (default 8px); bracket = verbatim CSS length.
 *   `color-[<css-color>]` / `bg-[<css-color>]` -- text/background-color transition
 *     to the element's own resolved color. Bracket only -- there's no sensible
 *     default or bare-number scale for a color, so the base name alone is invalid.
 *
 * FOUC: Astro SSGs full markup with no animation state, so a load/in-view
 * element would flash fully visible before this script runs. MOTION_PREHIDE_CSS
 * hides exactly those two triggers (hover starts from the visible state --
 * nothing to hide) up front, scoped to the opacity-based presets only: the
 * `slide-*`/`color`/`bg` families never touch opacity, so pre-hiding them
 * with `opacity: 0` would needlessly blank out content that was never meant
 * to disappear (their transform/color-only start state is a smaller, accepted
 * pop, not a full content flash). The reduced-motion media query inside it is
 * the CSS-level safety net, mirrored by the same check in the runtime, so
 * reduced-motion users are never left stuck at opacity: 0 with no animation
 * ever firing to reveal them.
 */

export type PresetBase =
  | "fade"
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "scale-in"
  | "scale-out"
  | "rotate"
  | "blur-in"
  | "color"
  | "bg";

/**
 * Tailwind-style modifier convention: bare number, or a bracketed arbitrary
 * value. Not every base supports every form (`fade` takes neither, `color`/`bg`
 * require the bracket) -- the type stays generic per the plan's "small,
 * finishable surface" call; parsePreset() enforces the real rules at runtime
 * and warns on anything invalid.
 */
export type Preset = PresetBase | `${PresetBase}-${number}` | `${PresetBase}-[${string}]`;

export type Trigger = "load" | "in-view" | "hover";

export interface MotionOptions {
  trigger?: Trigger;
  /** ms */
  duration?: number;
  /** ms */
  delay?: number;
  easing?: string;
}

const DEFAULT_TRIGGER: Trigger = "load";
const DEFAULT_DURATION = 500;
const DEFAULT_DELAY = 0;
const DEFAULT_EASING = "ease-out";

type ModifierKind =
  | "none" /* no modifier accepted at all */
  | "length" /* bare number = px */
  | "percent" /* bare number = percentage points */
  | "degrees" /* bare number = degrees */
  | "color"; /* bracket only, no bare, no bare-less default */

const PRESET_REGISTRY: Record<PresetBase, ModifierKind> = {
  fade: "none",
  "fade-up": "length",
  "fade-down": "length",
  "fade-left": "length",
  "fade-right": "length",
  "slide-up": "length",
  "slide-down": "length",
  "slide-left": "length",
  "slide-right": "length",
  "scale-in": "percent",
  "scale-out": "percent",
  rotate: "degrees",
  "blur-in": "length",
  color: "color",
  bg: "color",
};

/** longest-name-first so e.g. "fade-up" is tried before "fade" */
const PRESET_BASES = (Object.keys(PRESET_REGISTRY) as PresetBase[]).sort((a, b) => b.length - a.length);

/**
 * The typed helper: returns the `data-motion-*` attribute object to spread
 * onto any component's root element. Gives real editor autocomplete on
 * preset names via the `Preset` template-literal type, instead of hand-
 * typing `data-motion-preset="fade-up"` strings.
 */
export function motion(preset: Preset, options: MotionOptions = {}) {
  const { trigger = DEFAULT_TRIGGER, duration = DEFAULT_DURATION, delay = DEFAULT_DELAY, easing = DEFAULT_EASING } = options;

  return {
    "data-motion": preset,
    "data-motion-trigger": trigger,
    "data-motion-duration": duration,
    "data-motion-delay": delay,
    "data-motion-easing": easing,
  };
}

/**
 * Container-level stagger: spread onto the parent of a group of
 * `data-motion` elements. Each direct child gets `index * amountMs` added
 * to its own `delay` -- no separate per-child API, the existing `delay`
 * option is just offset further per position.
 */
export function motionStagger(amountMs: number) {
  return { "data-motion-stagger": amountMs };
}

/**
 * Pre-hide CSS, shipped alongside the runtime. Scoped to load/in-view AND
 * to the opacity-based preset families only -- see the FOUC note above for
 * why `slide-*`/`color`/`bg` are excluded.
 */
export const MOTION_PREHIDE_CSS = `
[data-motion][data-motion-trigger="load"]:not([data-motion^="slide-"]):not([data-motion^="color-"]):not([data-motion^="bg-"]),
[data-motion][data-motion-trigger="in-view"]:not([data-motion^="slide-"]):not([data-motion^="color-"]):not([data-motion^="bg-"]) {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  [data-motion][data-motion-trigger="load"],
  [data-motion][data-motion-trigger="in-view"] {
    opacity: 1;
  }
}
`;

interface ParsedPreset {
  base: PresetBase;
  /** bracket-arbitrary value, verbatim CSS -- takes priority over bare */
  arbitrary: string | null;
  /** bare-number modifier, family-specific units applied by buildKeyframes */
  bare: number | null;
}

function parsePreset(raw: string): ParsedPreset | null {
  for (const base of PRESET_BASES) {
    const kind = PRESET_REGISTRY[base];

    if (raw === base) {
      /* color/bg have no sensible default -- the bracket is mandatory */
      if (kind === "color") return null;
      return { base, arbitrary: null, bare: null };
    }

    const prefix = `${base}-`;
    if (!raw.startsWith(prefix)) continue;
    if (kind === "none") continue; /* fade takes no modifier at all */

    const rest = raw.slice(prefix.length);

    const bracket = rest.match(/^\[(.+)\]$/);
    if (bracket) return { base, arbitrary: bracket[1], bare: null };

    if (kind === "color") continue; /* no bare-number form for colors */

    if (rest !== "" && !Number.isNaN(Number(rest))) {
      return { base, arbitrary: null, bare: Number(rest) };
    }
  }
  return null;
}

/** negate any CSS length safely, regardless of unit, via calc() */
function negate(length: string): string {
  return `calc(${length} * -1)`;
}

function buildKeyframes(parsed: ParsedPreset, el: HTMLElement): Keyframe[] {
  const { base, arbitrary, bare } = parsed;

  switch (base) {
    case "fade":
      return [{ opacity: 0 }, { opacity: 1 }];

    case "fade-up":
    case "fade-down":
    case "fade-left":
    case "fade-right": {
      /* bare number = px, same shorthand convention as Tailwind's spacing scale */
      const distance = arbitrary ?? `${bare ?? 16}px`;
      const axis = base === "fade-up" || base === "fade-down" ? "Y" : "X";
      /* fade-up/fade-left start on the "positive" side (below / to the right)
         and animate to 0; fade-down/fade-right start negated (above / to the left). */
      const negated = base === "fade-down" || base === "fade-right";
      const from = negated ? negate(distance) : distance;
      return [
        { opacity: 0, transform: `translate${axis}(${from})` },
        { opacity: 1, transform: `translate${axis}(0)` },
      ];
    }

    case "slide-up":
    case "slide-down":
    case "slide-left":
    case "slide-right": {
      /* same transform semantics as the fade-* family, minus the opacity keyframe */
      const distance = arbitrary ?? `${bare ?? 16}px`;
      const axis = base === "slide-up" || base === "slide-down" ? "Y" : "X";
      const negated = base === "slide-down" || base === "slide-right";
      const from = negated ? negate(distance) : distance;
      return [{ transform: `translate${axis}(${from})` }, { transform: `translate${axis}(0)` }];
    }

    case "scale-in": {
      /* bare number = percentage-points of scale delta (scale-in-10 -> scale(0.90)),
         NOT a literal scale() value -- scale-in-24 as scale(24) would be nonsensical.
         Bracket stays verbatim CSS regardless of family. */
      const startScale = arbitrary ?? String(1 - (bare ?? 10) / 100);
      return [
        { opacity: 0, transform: `scale(${startScale})` },
        { opacity: 1, transform: "scale(1)" },
      ];
    }

    case "scale-out": {
      /* mirror of scale-in: starts ABOVE 100% and settles down to scale(1) */
      const startScale = arbitrary ?? String(1 + (bare ?? 10) / 100);
      return [
        { opacity: 0, transform: `scale(${startScale})` },
        { opacity: 1, transform: "scale(1)" },
      ];
    }

    case "rotate": {
      const angle = arbitrary ?? `${bare ?? 8}deg`;
      return [
        { opacity: 0, transform: `rotate(${angle})` },
        { opacity: 1, transform: "rotate(0deg)" },
      ];
    }

    case "blur-in": {
      const amount = arbitrary ?? `${bare ?? 8}px`;
      return [
        { opacity: 0, filter: `blur(${amount})` },
        { opacity: 1, filter: "blur(0px)" },
      ];
    }

    case "color": {
      /* arbitrary is guaranteed non-null -- parsePreset rejects bare "color" */
      const finalColor = getComputedStyle(el).color;
      return [{ color: arbitrary as string }, { color: finalColor }];
    }

    case "bg": {
      const finalBg = getComputedStyle(el).backgroundColor;
      return [{ backgroundColor: arbitrary as string }, { backgroundColor: finalBg }];
    }
  }
}

function prefersReducedMotion(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Bypass the animation entirely and land on the final, fully-revealed state. */
function revealInstantly(el: HTMLElement): void {
  el.style.opacity = "1";
  el.style.transform = "none";
}

const initialized = new WeakSet<Element>();
const staggered = new WeakSet<Element>();

/**
 * Sweep `root` for `[data-motion]` elements and wire each one's trigger.
 * Safe to call more than once (e.g. after client-side DOM insertions) --
 * already-wired elements are skipped via a WeakSet guard.
 */
export function initMotion(root: ParentNode = document): void {
  /* stagger pre-pass: bake index * amount into each direct child's own
     delay before the main sweep reads it */
  root.querySelectorAll<HTMLElement>("[data-motion-stagger]").forEach((container) => {
    if (staggered.has(container)) return;
    staggered.add(container);

    const amount = Number(container.dataset.motionStagger) || 0;
    const children = Array.from(container.querySelectorAll<HTMLElement>(":scope > [data-motion]"));
    children.forEach((child, i) => {
      const base = Number(child.dataset.motionDelay) || 0;
      child.dataset.motionDelay = String(base + i * amount);
    });
  });

  root.querySelectorAll<HTMLElement>("[data-motion]").forEach((el) => {
    if (initialized.has(el)) return;
    initialized.add(el);

    const raw = el.dataset.motion ?? "";
    const parsed = parsePreset(raw);
    if (!parsed) {
      console.warn(`[motion] invalid preset "${raw}" -- element revealed without animation`, el);
      revealInstantly(el);
      return;
    }

    const trigger = (el.dataset.motionTrigger as Trigger | undefined) ?? DEFAULT_TRIGGER;
    const duration = Number(el.dataset.motionDuration) || DEFAULT_DURATION;
    const delay = Number(el.dataset.motionDelay) || DEFAULT_DELAY;
    const easing = el.dataset.motionEasing || DEFAULT_EASING;
    const keyframes = buildKeyframes(parsed, el);

    const playEntrance = () => {
      if (prefersReducedMotion()) {
        revealInstantly(el);
        return;
      }
      el.animate(keyframes, { duration, delay, easing, fill: "forwards" });
    };

    if (trigger === "load") {
      playEntrance();
      return;
    }

    if (trigger === "in-view") {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            playEntrance();
            obs.disconnect();
          }
        },
        { threshold: 0.15 },
      );
      observer.observe(el);
      return;
    }

    /* hover: starts from the natural visible state (no pre-hide), the
       entrance keyframes replay on mouseenter/focus as a reveal pulse --
       mirrors PixelTransition's mouseenter+focus parity for a11y.
       Ignore re-entry while one is still playing rather than cancel() it:
       cancelling mid-flight snaps a scale/translate preset instantly back
       to its resting size, which moves the element's border back under a
       cursor sitting right at the edge -- an immediate new "mouseenter",
       cancel, snap, repeat, feeding back as fast as the browser can fire
       events. Letting the current pulse finish breaks that loop. */
    let hoverAnimation: Animation | null = null;
    const playHoverPulse = () => {
      if (prefersReducedMotion()) return;
      if (hoverAnimation?.playState === "running") return;
      hoverAnimation = el.animate(keyframes, { duration, delay, easing, fill: "none" });
    };
    el.addEventListener("mouseenter", playHoverPulse);
    el.addEventListener("focus", playHoverPulse);
  });
}
