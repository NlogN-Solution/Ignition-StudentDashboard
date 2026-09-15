import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Lightbulb, X } from "lucide-react";

import { computeTooltipPosition } from "./tourDom";

/**
 * The floating card that explains the spotlighted element.
 *
 * It measures itself and asks `computeTooltipPosition` where it can sit, so a
 * step near the bottom of the screen or against the right edge flips to a
 * side that fits instead of being clipped. On phones it always sits above or
 * below the spotlight, never beside it.
 *
 * Focus moves here on every step and Tab is trapped inside the card — a tour
 * that leaves focus behind the backdrop is unusable with a keyboard.
 */
const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

const TourTooltip = ({
  rect,
  placement = "bottom",
  title,
  body,
  tip,
  stepNumber,
  stepCount,
  isFirst,
  isLast,
  reduceMotion,
  onNext,
  onBack,
  onSkip,
}) => {
  const cardRef = useRef(null);
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    setPosition(
      computeTooltipPosition(
        rect,
        { width: card.offsetWidth, height: card.offsetHeight },
        placement
      )
    );
  }, [rect, placement, title, body, tip]);

  // New step, new focus anchor. The card itself takes focus rather than a
  // button so a screen reader announces the title and body first.
  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, [stepNumber]);

  const trapTab = useCallback((event) => {
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
  }, []);

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-tour-title"
      aria-describedby="dashboard-tour-body"
      tabIndex={-1}
      onKeyDown={trapTab}
      className="fixed z-[192] w-[calc(100vw-24px)] max-w-[360px] rounded-2xl border border-slate-200
        bg-white p-5 shadow-2xl shadow-navy-950/25 outline-none focus-visible:ring-2 focus-visible:ring-ignite-400"
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        opacity: position ? 1 : 0,
        transition: reduceMotion
          ? "opacity 120ms linear"
          : "top 320ms cubic-bezier(0.4, 0, 0.2, 1), left 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease-out",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ignite-600">
          Step {stepNumber} of {stepCount}
        </p>
        <button
          type="button"
          onClick={onSkip}
          className="-mr-1 -mt-1 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600
            focus:outline-none focus-visible:ring-2 focus-visible:ring-ignite-400"
          aria-label="Skip the dashboard tour"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <h2
        id="dashboard-tour-title"
        className="mt-2 text-base font-semibold leading-snug text-navy-900"
      >
        {title}
      </h2>
      <p id="dashboard-tour-body" className="mt-2 text-sm leading-relaxed text-slate-600">
        {body}
      </p>

      {tip && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-navy-50 px-3 py-2 text-xs leading-relaxed text-navy-800">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ignite-500" />
          <span>{tip}</span>
        </p>
      )}

      <div
        className="mt-4 flex items-center gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={stepCount}
        aria-valuenow={stepNumber}
        aria-label={`Tour progress: step ${stepNumber} of ${stepCount}`}
      >
        {Array.from({ length: stepCount }).map((_, index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              index < stepNumber ? "bg-ignite-500" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800
            focus:outline-none focus-visible:ring-2 focus-visible:ring-ignite-400"
        >
          Skip tour
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={isFirst}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium
              text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40
              focus:outline-none focus-visible:ring-2 focus-visible:ring-ignite-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ignite-500 px-4 py-2 text-sm font-semibold text-white
              transition-colors hover:bg-ignite-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ignite-400
              focus-visible:ring-offset-2"
          >
            {isLast ? "Finish" : "Next"}
            {!isLast && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TourTooltip;
