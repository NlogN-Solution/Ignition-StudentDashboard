// DOM plumbing for the tour: finding a step's target, getting it on screen,
// and working out where the tooltip can sit without leaving the viewport.
//
// Nothing here knows what a step *means* — that is tourSteps.js — and nothing
// here holds React state, so it is all reusable from an effect.

export const MOBILE_BREAKPOINT = 768; // Tailwind's `md`, where the sidebar stops being off-canvas.

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isMobileViewport = () =>
  typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;

/** An element counts as usable once it is in the document and has real size —
 * a rendered-but-collapsed skeleton is not something worth spotlighting. */
const isMeasurable = (element) => {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

/**
 * Resolves `selector` once the element exists and has been laid out, or to
 * null when the deadline passes.
 *
 * Polls on animation frames rather than with MutationObserver because a step
 * often has to wait for a *route* to mount and then for its data to arrive —
 * two separate paint cycles — and a frame loop covers both without having to
 * pick the right node to observe.
 */
export const waitForElement = (selector, { timeout = 6000, isCancelled } = {}) =>
  new Promise((resolve) => {
    const deadline = Date.now() + timeout;

    const attempt = () => {
      if (typeof isCancelled === "function" && isCancelled()) {
        resolve(null);
        return;
      }
      const element = document.querySelector(selector);
      if (isMeasurable(element)) {
        resolve(element);
        return;
      }
      if (Date.now() > deadline) {
        resolve(null);
        return;
      }
      window.requestAnimationFrame(attempt);
    };

    attempt();
  });

// The app's fixed header is 4rem tall and floats above everything, so an
// element scrolled flush to the top of the viewport would sit under it.
const HEADER_OFFSET = 88;

/** Scrolls the target into view only when it is not comfortably visible. */
export const scrollIntoViewIfNeeded = (element) => {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const fullyVisible =
    rect.top >= HEADER_OFFSET && rect.bottom <= window.innerHeight - 24;
  if (fullyVisible) return;

  element.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "center",
    inline: "nearest",
  });
};

// Follows the target's own corner rounding so the spotlight sits on a card
// the way the card is drawn, rather than boxing it. Capped, because a pill or
// a circular icon button reports a radius far larger than the padded box.
const spotlightRadius = (element, padding) => {
  const raw = window.getComputedStyle(element).borderTopLeftRadius;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 10;
  if (raw.endsWith("%")) return 9999;
  return Math.min(parsed + padding, 28);
};

/** Plain object copy of a DOMRect, padded, so rects can be compared cheaply. */
export const paddedRect = (element, padding = 8) => {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
    radius: spotlightRadius(element, padding),
  };
};

export const rectsMatch = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
};

const GAP = 16; // Breathing room between the spotlight and the tooltip.
const MARGIN = 12; // Minimum distance from any viewport edge.

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const placeAt = (placement, rect, size) => {
  switch (placement) {
    case "top":
      return {
        top: rect.top - size.height - GAP,
        left: rect.left + rect.width / 2 - size.width / 2,
      };
    case "left":
      return {
        top: rect.top + rect.height / 2 - size.height / 2,
        left: rect.left - size.width - GAP,
      };
    case "right":
      return {
        top: rect.top + rect.height / 2 - size.height / 2,
        left: rect.left + rect.width + GAP,
      };
    case "bottom":
    default:
      return {
        top: rect.top + rect.height + GAP,
        left: rect.left + rect.width / 2 - size.width / 2,
      };
  }
};

const fits = (position, size, viewport) =>
  position.top >= MARGIN &&
  position.left >= MARGIN &&
  position.top + size.height <= viewport.height - MARGIN &&
  position.left + size.width <= viewport.width - MARGIN;

/**
 * Picks the first placement that fits the tooltip fully on screen, falling
 * back to the preferred one clamped into the viewport.
 *
 * On a narrow screen the tooltip is as wide as the viewport allows, so no
 * side placement can ever fit — there it is pinned above or below the
 * spotlight, whichever has more room.
 */
export const computeTooltipPosition = (rect, size, preferred = "bottom") => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  if (!rect) {
    return {
      placement: "center",
      top: Math.max(MARGIN, viewport.height / 2 - size.height / 2),
      left: Math.max(MARGIN, viewport.width / 2 - size.width / 2),
    };
  }

  const spaceBelow = viewport.height - (rect.top + rect.height);
  const order =
    viewport.width < MOBILE_BREAKPOINT
      ? spaceBelow >= rect.top
        ? ["bottom", "top"]
        : ["top", "bottom"]
      : [preferred, "right", "bottom", "left", "top"];

  for (const placement of order) {
    const position = placeAt(placement, rect, size);
    if (fits(position, size, viewport)) return { placement, ...position };
  }

  const fallbackPlacement = order[0];
  const position = placeAt(fallbackPlacement, rect, size);
  return {
    placement: fallbackPlacement,
    top: clamp(position.top, MARGIN, Math.max(MARGIN, viewport.height - size.height - MARGIN)),
    left: clamp(position.left, MARGIN, Math.max(MARGIN, viewport.width - size.width - MARGIN)),
  };
};
