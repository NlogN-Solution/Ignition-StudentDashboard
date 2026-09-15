import React, { useCallback, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Shell shared by the welcome and completion modals: dimmed backdrop, centred
 * card, focus moved in and trapped, Escape to dismiss.
 *
 * Kept separate from TourTooltip because these two are the only points in the
 * tour with no element to point at — they are about the tour itself, not
 * about a part of the dashboard.
 */
const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

const TourModal = ({ labelledBy, describedBy, onDismiss, children }) => {
  const cardRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const focusable = card.querySelectorAll(FOCUSABLE);
    (focusable[0] ?? card).focus({ preventScroll: true });
  }, []);

  const onKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onDismiss?.();
        return;
      }
      if (event.key !== "Tab") return;

      const card = cardRef.current;
      if (!card) return;
      const focusable = Array.from(card.querySelectorAll(FOCUSABLE));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === card)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onDismiss]
  );

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-navy-950/60 backdrop-blur-[2px]"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        aria-hidden="true"
      />

      <motion.div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl
          shadow-navy-950/30 outline-none sm:p-7"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default TourModal;
