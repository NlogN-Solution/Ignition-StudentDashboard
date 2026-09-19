import React from "react";
import { Check, Sparkles } from "lucide-react";

import panelImage from "../../assets/auth-panel.jpg";
import logo from "../../assets/logo.png";
import { describeHandoff, peekPendingHandoff } from "../../lib/handoff";
import SelectedCourseCard from "../apply/SelectedCourseCard";

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
 * ## The right-hand panel
 *
 * It used to be a white card holding four ticked reassurances — true, dull, and
 * indistinguishable from every SaaS sign-up on the internet. It is now a
 * full-height image: the same photograph the public site opens "Why the UK"
 * with, a student walking toward Westminster with an Ignition rucksack. A
 * registration form asks someone to commit to a plan; the panel beside it
 * should show them the plan, not a bulleted list of features.
 *
 * The photograph is a *ground*, not decoration — the reassurances and the
 * carried-research payload are laid over it inside a navy scrim, so the panel
 * still says everything it said before. Three things make that legible rather
 * than pretty-but-unreadable:
 *
 *   - the scrim is a fixed navy gradient, opaque at the foot where the type
 *     sits, so contrast does not depend on how bright this particular
 *     photograph happens to be at the bottom-left corner;
 *   - the panel is `aria-hidden` decoration ONLY in its imagery — the text
 *     inside it is real text in the DOM, selectable and read aloud in order;
 *   - it is `hidden lg:block`. On a phone, a 600px-tall photograph between the
 *     student and the form is an obstacle, so below `lg` the form is the whole
 *     screen and the reassurances drop to a compact row beneath it.
 *
 * ## How it stays one screen tall without a scrollbar in the middle of it
 *
 * The photograph is `sticky top-0 h-screen`. The page scrolls normally — there
 * is no inner scroll container and no `overflow-hidden` anywhere — but the
 * panel is pinned to the viewport, so it is always exactly one screen tall and
 * always whole, whatever the column beside it is doing.
 *
 * That replaced an `lg:overflow-y-auto` form column. Making the column its own
 * scroller did keep the page from moving, but it paid for it with a scrollbar
 * running down the middle of the layout, which reads as a divider splitting the
 * screen in two rather than as a scrollbar. Sticky gets the same result — a
 * photograph that never continues below the fold — and costs nothing visually.
 *
 * The column is still *sized* to fit an ordinary laptop window without
 * scrolling at all: compact type, 46px controls, and tight vertical rhythm.
 * Fitting is the design target; sticky is what makes overflowing harmless
 * rather than what makes it acceptable. If you add a field here, take the
 * height back out of something else.
 */

const REASSURANCE = [
  "Your profile, filled in once and reused for every application",
  "Documents reviewed by an Ignition advisor",
  "Every application tracked in one place",
  "Visa and pre-departure in the same dashboard",
];

/** The panel's copy, which differs only when research is waiting to be claimed. */
const panelContent = (carried) =>
  carried.length
    ? {
        eyebrow: "Waiting for you",
        eyebrowIcon: Sparkles,
        heading: "Your research is here",
        items: carried,
        note:
          "Saved in your browser while you were researching. It moves to your Ignition profile the moment you sign in — you will not be asked for any of it again.",
      }
    : {
        eyebrow: "One place, start to finish",
        eyebrowIcon: null,
        heading: "Your UK application, in one place",
        items: REASSURANCE,
        note: null,
      };

export const AuthShell = ({ title, subtitle, children, footer, intent }) => {
  // Read once per mount. Nothing consumes it here — it is applied after the
  // student actually signs in (see AuthContext).
  const [handoff] = React.useState(peekPendingHandoff);
  const carried = describeHandoff(handoff);
  const panel = panelContent(carried);
  const EyebrowIcon = panel.eyebrowIcon;

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
      <div className="grid w-full items-start gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)]">
        {/* ------------------------------------------------------ the form --- */}
        <div className="flex min-h-screen flex-col px-5 py-9 sm:px-10 lg:px-12 lg:py-4 xl:px-14">
          <div className="m-auto w-full max-w-[500px]">
            <a href="/" className="inline-flex select-none items-center" aria-label="Ignition — home">
              <img src={logo} alt="Ignition" className="h-7 w-auto" />
            </a>

            <h1 className="mt-4 text-[clamp(1.45rem,1.9vw,1.72rem)] font-extrabold leading-[1.14] tracking-[-0.025em] text-navy-900">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-[14px] font-medium leading-[1.5] text-ink-muted">
                {subtitle}
              </p>
            ) : null}

            {/* The course that sent them here, above the form.

                It is the first thing on the screen after the heading because
                it is the answer to "am I in the right place" — a student who
                pressed Apply on MSc Computer Science and lands on a generic
                sign-up form has no way to tell whether the course came with
                them. Renders nothing when they arrived directly. */}
            {intent?.course ? (
              <div className="mt-5">
                <SelectedCourseCard course={intent.course} />
              </div>
            ) : null}

            <div className="mt-4">{children}</div>

            {footer ? (
              <div className="mt-3 text-[14px] font-medium text-ink-muted">{footer}</div>
            ) : null}

            {/* The panel's substance, for the viewports the panel is hidden on.
                Same list, laid flat, so nothing is said only to wide screens. */}
            <ul className="mt-7 grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:hidden">
              {panel.items.map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <Check className="mt-[3px] h-4 w-4 shrink-0 text-orange" strokeWidth={3} aria-hidden />
                  <span className="text-[14.5px] font-medium leading-[1.5] text-ink-soft">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ----------------------------------------------------- the image --- */}
        <aside className="sticky top-0 hidden h-screen overflow-hidden lg:block">
          {/* `object-[50%_38%]` rather than `object-center`: the panel is taller
              than it is wide, so cover crops the photograph's top and bottom,
              and centring the crop cuts the student's feet off while keeping
              empty sky. Biasing it up the frame keeps the whole figure and the
              clock tower in shot at every window height. */}
          <img
            src={panelImage}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-[50%_38%]"
          />

          {/* Fixed scrim: contrast for the type below comes from this, not from
              whatever the photograph is doing behind it. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/55 to-navy-900/5"
          />

          <div className="relative flex h-full flex-col justify-end p-8 xl:p-11">
            <div className="flex items-center gap-2">
              {EyebrowIcon ? <EyebrowIcon className="h-[18px] w-[18px] text-orange" aria-hidden /> : null}
              <p className="text-[12.5px] font-bold uppercase tracking-[0.16em] text-white/70">
                {panel.eyebrow}
              </p>
            </div>

            <h2 className="mt-3 max-w-[15ch] text-[clamp(1.5rem,2vw,1.95rem)] font-extrabold leading-[1.12] tracking-[-0.022em] text-white">
              {panel.heading}
            </h2>

            <ul className="mt-6 space-y-3">
              {panel.items.map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-[2px] flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full bg-orange/90"
                  >
                    <Check className="h-[12px] w-[12px] text-white" strokeWidth={3.2} />
                  </span>
                  <span className="max-w-[38ch] text-[15px] font-semibold leading-[1.4] text-white/95">
                    {line}
                  </span>
                </li>
              ))}
            </ul>

            {panel.note ? (
              <p className="mt-6 max-w-[46ch] border-t border-white/15 pt-4 text-[13px] font-medium leading-[1.55] text-white/65">
                {panel.note}
              </p>
            ) : null}
          </div>
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
    <label htmlFor={id} className="block text-[13px] font-semibold text-ink-soft">
      {label}
    </label>
    <div className="relative mt-[5px]">
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
        className={`h-[44px] w-full rounded-xl border bg-white text-[15px] font-medium text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-blue-bright focus:ring-4 focus:ring-blue-bright/15 ${
          Icon ? "pl-[42px]" : "pl-4"
        } ${trailing ? "pr-[46px]" : "pr-4"} ${
          error ? "border-orange" : "border-ring-idle hover:border-nav/40"
        } ${className}`}
        {...props}
      />
      {trailing}
    </div>
    {error ? (
      <p id={`${id}-error`} className="mt-[5px] text-[13px] font-semibold text-orange">
        {error}
      </p>
    ) : null}
  </div>
);

export const AuthButton = ({ children, className = "", ...props }) => (
  <button
    className={`inline-flex h-[46px] w-full items-center justify-center rounded-xl bg-navy-900 px-6 text-[15.5px] font-bold text-white transition-[background-color,box-shadow,transform] duration-200 hover:bg-navy-ink hover:shadow-float active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:active:scale-100 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const AuthError = ({ children }) =>
  children ? (
    <div
      role="alert"
      className="rounded-xl border border-orange/30 bg-orange/[0.07] px-4 py-2.5 text-[14px] font-semibold text-orange"
    >
      {children}
    </div>
  ) : null;
