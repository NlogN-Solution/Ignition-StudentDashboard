import React from "react";

/**
 * A labelled completion meter.
 *
 * `role="progressbar"` with the three `aria-value*` attributes, because the
 * number is the point of the control and a bare coloured div announces
 * nothing. The percentage is also written out beside the label, so it does not
 * depend on being able to judge the length of a bar.
 *
 * Clamped to 0–100: `profile_completion` comes from the backend, and a bar that
 * renders `width: 140%` overflows its own card.
 */
const ProgressBar = ({ value, label, className = "" }) => {
  const safe = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[13.5px] font-semibold text-ink-soft">{label}</span>
        <span className="text-[15px] font-bold tabular-nums text-navy-900">{safe}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-hairline"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-navy-900 to-navy-900 transition-[width] duration-700 ease-out"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
