import React from "react";
import { Check, Heart } from "lucide-react";

/**
 * The small pieces the explore screens are built from.
 *
 * Same language as the public platform's `components/ui` — white on canvas,
 * hairline border, navy type, orange accent — so a student moving between the
 * two halves of Ignition is looking at one product. Kept in one file because
 * each is a handful of lines and six one-component files would be harder to
 * read than this, not easier.
 */

/** A titled block. Panels are built from these, not from one long article. */
export const Section = ({ title, children, className = "" }) => (
  <section className={`scroll-mt-28 ${className}`}>
    {title && (
      <h2 className="text-xl font-bold leading-tight tracking-tight text-navy-900">{title}</h2>
    )}
    <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink-soft">{children}</div>
  </section>
);

export const Card = ({ children, className = "" }) => (
  <div className={`rounded-xl border border-hairline bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

/**
 * Label/value rows, as a definition list so the pairing survives a screen
 * reader. Rows whose value is empty are dropped by the caller, not hidden
 * here — a spec list that renders "Founded: —" states an absence as a fact.
 */
export const SpecList = ({ specs }) => (
  <dl className="divide-y divide-hairline">
    {specs.map((spec) => (
      <div
        key={spec.label}
        className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0"
      >
        <dt className="text-sm font-medium text-ink-muted">{spec.label}</dt>
        <dd className="text-[15px] font-semibold text-ink">{spec.value}</dd>
      </div>
    ))}
  </dl>
);

/** A tick list, for anything a record states as a flat set of claims. */
export const Ticks = ({ items }) => (
  <ul className="space-y-2.5">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2.5">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange" strokeWidth={2.6} />
        <span className="text-[15px] leading-relaxed text-ink-soft">{item}</span>
      </li>
    ))}
  </ul>
);

export const Chip = ({ children, tone = "muted" }) => {
  const tones = {
    muted: "border-hairline bg-canvas text-ink-muted",
    navy: "border-navy-200 bg-navy-50 text-navy-800",
    orange: "border-ignite-200 bg-ignite-50 text-ignite-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

/** The standing caveat under anything a student could be harmed by getting wrong. */
export const Note = ({ children }) => (
  <p className="text-xs font-medium leading-relaxed text-ink-faint">{children}</p>
);

/**
 * Save / shortlist.
 *
 * The one control on these screens that writes anything, and the reason the
 * explore screens exist at all: a saved course is visible to the counsellor
 * working the student's file the moment it is saved
 * (`GET /users/{id}/shortlist`). The label says "Shortlisted" rather than
 * "Saved" once it is on, because that is what it means here — it is not a
 * private bookmark.
 */
export const SaveButton = ({ saved, onToggle, label = "course", size = "md" }) => {
  const compact = size === "sm";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      title={saved ? `Remove this ${label} from your shortlist` : `Add this ${label} to your shortlist`}
      className={`inline-flex items-center gap-2 rounded-lg border font-semibold transition-colors ${
        compact ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"
      } ${
        saved
          ? "border-ignite-200 bg-ignite-50 text-ignite-700 hover:bg-ignite-100"
          : "border-hairline bg-white text-ink-muted hover:border-ring-idle hover:text-navy-900"
      }`}
    >
      <Heart
        className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
        fill={saved ? "currentColor" : "none"}
        strokeWidth={2.2}
      />
      {saved ? "Shortlisted" : "Shortlist"}
    </button>
  );
};
