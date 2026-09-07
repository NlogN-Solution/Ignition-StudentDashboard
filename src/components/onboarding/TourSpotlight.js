import React, { useEffect, useRef } from "react";

/**
 * The dimmed backdrop with a hole cut out around the current step's target.
 *
 * The hole is a single positioned box whose enormous outer box-shadow *is*
 * the backdrop — the target keeps its own colours, stacking context and
 * hover states because nothing is drawn over it. That also means the
 * spotlight needs no z-index games with the app's fixed header (z-60) or
 * sidebar (z-50).
 *
 * A separate transparent layer underneath swallows clicks and wheel/touch
 * scrolling, so the student can't wander off mid-step. Scroll is blocked by
 * cancelling the events rather than by locking `body` overflow, which would
 * reflow the whole page the moment the tour opens and move every target the
 * tour is trying to point at.
 */
const OVERLAY_COLOR = "rgba(6, 10, 40, 0.62)";
const RING_COLOR = "rgba(255, 90, 31, 0.9)";
const RING_HALO = "rgba(255, 90, 31, 0.25)";

const TourSpotlight = ({ rect, reduceMotion, onBackdropClick }) => {
  const blockerRef = useRef(null);

  useEffect(() => {
    const node = blockerRef.current;
    if (!node) return undefined;

    const prevent = (event) => event.preventDefault();
    node.addEventListener("wheel", prevent, { passive: false });
    node.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      node.removeEventListener("wheel", prevent);
      node.removeEventListener("touchmove", prevent);
    };
  }, []);

  const transition = reduceMotion
    ? "none"
    : "top 320ms cubic-bezier(0.4, 0, 0.2, 1), left 320ms cubic-bezier(0.4, 0, 0.2, 1), width 320ms cubic-bezier(0.4, 0, 0.2, 1), height 320ms cubic-bezier(0.4, 0, 0.2, 1)";

  return (
    <>
      <div
        ref={blockerRef}
        aria-hidden="true"
        onClick={onBackdropClick}
        className="fixed inset-0 z-[190]"
        style={rect ? undefined : { backgroundColor: OVERLAY_COLOR }}
      />

      {rect && (
        <div
          aria-hidden="true"
          className="fixed z-[191] pointer-events-none"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: rect.radius ?? 12,
            transition,
            boxShadow: `0 0 0 9999px ${OVERLAY_COLOR}, 0 0 0 2px ${RING_COLOR}, 0 0 0 8px ${RING_HALO}`,
          }}
        />
      )}
    </>
  );
};

export default TourSpotlight;
