import React from "react";
import { Check, Sparkles } from "lucide-react";

import { describeHandoff, peekPendingHandoff } from "../../lib/handoff";

/**
 * The frame every unauthenticated screen sits in — sign in, register, reset.
 *
 * This is the seam between the two halves of Ignition, and it is the one place
 * where getting the visual language wrong is most costly: a student who has
 * spent twenty minutes on a light, navy-and-orange research platform and then
 * lands on a dark slate login screen has just been told, wordlessly, that they
 * are entering a different product. So this reuses the public platform's
 * palette, typeface and card language exactly (see tailwind.config.js).
 *
 * The right-hand column is the continuity payload: when a student arrived with
 * research carried over from the public site, it is named here, before they
 * type anything, because that is the reason they are creating an account.
 */

const REASSURANCE = [
  "Your profile, filled in once and reused for every application",
  "Documents reviewed by an Ignition advisor",
  "Every application tracked in one place",
  "Visa and pre-departure in the same dashboard",
];

export const AuthShell = ({ title, subtitle, children, footer }) => {
  // Read once per mount. Nothing consumes it here — it is applied after the
  // student actually signs in (see AuthContext).
  const [handoff] = React.useState(peekPendingHandoff);
  const carried = describeHandoff(handoff);

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
      <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16 lg:py-16">
        <div className="order-2 lg:order-1">
          <a
            href="/"
            className="inline-flex items-baseline gap-[3px] text-[22px] font-extrabold tracking-[-0.02em] text-navy"
          >
            Ignition<span className="text-orange">.</span>
          </a>

          <h1 className="mt-9 text-[clamp(1.9rem,3.4vw,2.6rem)] font-bold leading-[1.06] tracking-[-0.022em] text-navy">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-4 max-w-[48ch] text-[16px] font-medium leading-[1.6] text-ink-muted">
              {subtitle}
            </p>
          ) : null}

          <div className="mt-9 max-w-[440px]">{children}</div>

          {footer ? (
            <div className="mt-7 max-w-[440px] text-[15px] font-medium text-ink-muted">
              {footer}
            </div>
          ) : null}
        </div>

        <aside className="order-1 lg:order-2 lg:pt-[76px]">
          {carried.length ? (
            <div className="rounded-xl border border-navy/15 bg-navy/[0.04] p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-[18px] w-[18px] text-orange" aria-hidden />
                <p className="text-[12.5px] font-bold uppercase tracking-[0.12em] text-blue-link">
                  Waiting for you
                </p>
              </div>
              <h2 className="mt-3 text-[19px] font-bold leading-[1.25] tracking-[-0.015em] text-navy">
                Your research is here
              </h2>
              <ul className="mt-4 space-y-[9px]">
                {carried.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-[10px] text-[15px] font-semibold text-navy"
                  >
                    <Check
                      className="mt-[3px] h-[14px] w-[14px] shrink-0 text-orange"
                      strokeWidth={3}
                      aria-hidden
                    />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[13.5px] font-medium leading-[1.55] text-ink-faint">
                Saved in your browser while you were researching. It moves to your
                Ignition profile the moment you sign in — you will not be asked for
                any of it again.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-hairline bg-white p-6">
              <h2 className="text-[19px] font-bold leading-[1.25] tracking-[-0.015em] text-navy">
                Your UK application, in one place
              </h2>
              <ul className="mt-5 space-y-[11px]">
                {REASSURANCE.map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-[3px] flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-navy/[0.07]"
                    >
                      <Check className="h-3 w-3 text-navy" strokeWidth={3} />
                    </span>
                    <span className="text-[15px] font-medium leading-[1.5] text-ink-soft">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- controls --- */

/** A labelled text input in the public platform's field language. */
export const AuthField = ({
  id,
  label,
  error,
  icon: Icon,
  trailing,
  className = "",
  ...props
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-[13.5px] font-semibold text-ink-soft"
    >
      {label}
    </label>
    <div className="relative mt-[6px]">
      {Icon ? (
        <Icon
          className="pointer-events-none absolute left-[14px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-ink-faint"
          aria-hidden
        />
      ) : null}
      <input
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-[50px] w-full rounded-[10px] border bg-white text-[15px] font-medium text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-blue-bright focus:ring-2 focus:ring-blue-bright/20 ${
          Icon ? "pl-[42px]" : "pl-4"
        } ${trailing ? "pr-[46px]" : "pr-4"} ${
          error ? "border-orange" : "border-ring-idle hover:border-nav/40"
        } ${className}`}
        {...props}
      />
      {trailing}
    </div>
    {error ? (
      <p id={`${id}-error`} className="mt-[6px] text-[13.5px] font-semibold text-orange">
        {error}
      </p>
    ) : null}
  </div>
);

export const AuthButton = ({ children, className = "", ...props }) => (
  <button
    className={`inline-flex h-[50px] w-full items-center justify-center rounded-[10px] bg-navy px-6 text-[15.5px] font-semibold text-white transition-[background-color,box-shadow,transform] duration-200 hover:bg-navy-ink hover:shadow-[0_10px_30px_-12px_rgba(1,22,111,0.65)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:active:scale-100 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const AuthError = ({ children }) =>
  children ? (
    <div
      role="alert"
      className="rounded-[10px] border border-orange/30 bg-orange/[0.07] px-4 py-3 text-[14px] font-semibold text-orange"
    >
      {children}
    </div>
  ) : null;
