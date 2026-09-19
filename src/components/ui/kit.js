import React from "react";
import { ChevronDown } from "lucide-react";

/**
 * The portal's design language, as components.
 *
 * Used by the initial-setup wizard, the profile screens and the dashboard —
 * anywhere the portal draws a panel, a labelled control or a step's worth of
 * actions. It is the portal-side twin of `components/explore/primitives`, which
 * covers the read-only catalogue surfaces; the two share a palette and a radius
 * scale on purpose.
 *
 * These screens used to be written in a different dialect from the rest of the
 * portal: `focus:ring-navy-900`, `border-gray-200`, `text-red-500`,
 * `bg-green-500` submit buttons, `rounded-2xl` gradient chrome. None of those
 * are Ignition colours. A student came off a navy-and-orange public site,
 * through a navy-and-orange registration form, and the first screen inside
 * their account was a generic blue admin form — which is the exact moment the
 * product stops feeling like one thing.
 *
 * So: one file, one field language, matching `components/auth/AuthShell` and
 * `components/explore/primitives`. Everything here is presentational. No
 * validation lives in this file — the steps own their own rules, because the
 * rules are about what a university will accept, not about what an input can
 * hold.
 *
 * Two deliberate choices worth not undoing:
 *
 *   - Every control takes an `id` and renders a real `<label htmlFor>`. The old
 *     wizard wrapped bare `<label>` text next to an unlabelled `<select>`, so
 *     tapping the label did nothing and a screen reader announced "combo box"
 *     with no name. Eight fields, eight unnamed controls.
 *   - Errors are wired with `aria-describedby` and `aria-invalid`, and the
 *     asterisk on a required label is `aria-hidden` with the real signal
 *     carried by `required`. A red asterisk is a visual convention, not an
 *     announcement.
 */

const baseControl =
  "w-full rounded-xl border bg-white text-[15.5px] font-medium text-ink outline-none transition-colors " +
  "placeholder:text-ink-faint focus:border-navy-900 focus:ring-4 focus:ring-navy-900/15 " +
  "disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-faint";

const borderFor = (error) =>
  error ? "border-orange" : "border-ring-idle hover:border-nav/40";

/**
 * Label + control + hint + error, in the order a screen reader should meet them.
 *
 * `id`, `hint` and `error` are injected into the control rather than passed to
 * it as well: the control needs them only to wire `aria-describedby` and
 * `aria-invalid`, and a hint written out twice — once for the eye, once for the
 * screen reader — is a hint that will eventually disagree with itself. The
 * Field is the single source of truth for all three.
 */
export const Field = ({ id, label, required, hint, error, children, className = "" }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-[14px] font-semibold text-ink-soft">
      {label}
      {required ? (
        <span className="ml-0.5 text-orange" aria-hidden>
          *
        </span>
      ) : null}
    </label>
    <div className="mt-[7px]">
      {React.isValidElement(children)
        ? React.cloneElement(children, { id, hint, error })
        : children}
    </div>
    {hint && !error ? (
      <p id={`${id}-hint`} className="mt-[7px] text-[13px] font-medium leading-[1.5] text-ink-faint">
        {hint}
      </p>
    ) : null}
    {error ? (
      <p id={`${id}-error`} className="mt-[7px] text-[13.5px] font-semibold text-orange">
        {error}
      </p>
    ) : null}
  </div>
);

const describedBy = (id, hint, error) => {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
};

export const TextInput = ({ id, error, hint, className = "", ...props }) => (
  <input
    id={id}
    aria-invalid={error ? "true" : undefined}
    aria-describedby={describedBy(id, hint, error)}
    className={`${baseControl} ${borderFor(error)} h-[52px] px-4 ${className}`}
    {...props}
  />
);

export const TextArea = ({ id, error, hint, rows = 3, className = "", ...props }) => (
  <textarea
    id={id}
    rows={rows}
    aria-invalid={error ? "true" : undefined}
    aria-describedby={describedBy(id, hint, error)}
    className={`${baseControl} ${borderFor(error)} resize-y px-4 py-3 leading-[1.55] ${className}`}
    {...props}
  />
);

/**
 * A native `<select>` with the platform arrow replaced.
 *
 * Still a native select — the menu is the operating system's, which is the one
 * a student on a phone can actually use, and it needs no keyboard handling of
 * our own. Only the closed-state chrome is ours.
 */
export const SelectInput = ({
  id,
  error,
  hint,
  placeholder,
  options = [],
  icon: Icon,
  className = "",
  children,
  ...props
}) => (
  <div className="relative">
    {Icon ? (
      <Icon
        className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint"
        aria-hidden
      />
    ) : null}
    <select
      id={id}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={describedBy(id, hint, error)}
      className={`${baseControl} ${borderFor(error)} h-[52px] appearance-none pr-11 ${
        Icon ? "pl-11" : "pl-4"
      } ${className}`}
      {...props}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
      {children}
    </select>
    <ChevronDown
      className="pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint"
      aria-hidden
    />
  </div>
);

/* ------------------------------------------------------------------ shells --- */

/** A white panel: the wizard's only container. */
export const Panel = ({ children, className = "" }) => (
  <section
    className={`overflow-hidden rounded-2xl border border-hairline bg-white shadow-card ${className}`}
  >
    {children}
  </section>
);

/** A panel's titled head, divided from its body by a hairline. */
export const PanelHead = ({ eyebrow, title, description, icon: Icon, actions }) => (
  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline px-6 py-5 sm:px-8 sm:py-6">
    <div className="flex items-start gap-4">
      {Icon ? (
        <span
          aria-hidden
          className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-900"
        >
          <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
        </span>
      ) : null}
      <div>
        {eyebrow ? (
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-navy-900">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-[21px] font-bold leading-[1.2] tracking-[-0.02em] text-navy-900 sm:text-[23px]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-[62ch] text-[15px] font-medium leading-[1.55] text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
    </div>
    {actions}
  </div>
);

// Spreads the rest of its props so a caller can hang a `data-tour` anchor on
// the body it actually wants spotlit — the dashboard tour targets
// `[data-tour="profile-academics"]`, and a body that swallowed unknown props
// would silently break the tour rather than fail loudly.
export const PanelBody = ({ children, className = "", ...props }) => (
  <div className={`px-6 py-6 sm:px-8 sm:py-7 ${className}`} {...props}>
    {children}
  </div>
);

/** The standard two-column field grid. */
export const FieldGrid = ({ children, className = "" }) => (
  <div className={`grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 ${className}`}>{children}</div>
);

/* ----------------------------------------------------------------- buttons --- */

export const PrimaryButton = ({ children, className = "", ...props }) => (
  <button
    className={`inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-navy-900 px-7 text-[15.5px] font-bold text-white transition-[background-color,box-shadow,transform] duration-200 hover:bg-navy-ink hover:shadow-float active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:active:scale-100 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const GhostButton = ({ children, className = "", ...props }) => (
  <button
    className={`inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border border-ring-idle bg-white px-6 text-[15.5px] font-semibold text-ink-soft transition-colors hover:border-nav/40 hover:text-navy-900 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    {...props}
  >
    {children}
  </button>
);

/** The row of controls that closes a step. Back sits left, forward sits right. */
export const StepActions = ({ children, note }) => (
  <div className="mt-7 flex flex-col gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
    {note ? (
      <p className="max-w-[52ch] text-[13.5px] font-medium leading-[1.55] text-ink-faint">{note}</p>
    ) : (
      <span />
    )}
    <div className="flex items-center gap-3">{children}</div>
  </div>
);

/** Form-level failure, distinct from a field's own message. */
export const FormError = ({ children }) =>
  children ? (
    <p
      role="alert"
      className="rounded-xl border border-orange/30 bg-orange/[0.07] px-4 py-3 text-[14.5px] font-semibold text-orange"
    >
      {children}
    </p>
  ) : null;

/* -------------------------------------------------------------- read-only --- */

/**
 * Label/value pairs, as a definition list.
 *
 * A `<dl>` rather than a grid of `<p>`s because the pairing is the content: a
 * screen reader announces "Nationality, Nepali" as one unit, where two loose
 * paragraphs are two unrelated strings. The same reasoning as
 * `components/explore/primitives`' SpecList, laid out as a grid instead of
 * rows because a profile has thirty of these and a stack of thirty rows is a
 * scroll, not a summary.
 */
export const DataList = ({ children, columns = 2, className = "" }) => (
  <dl
    className={`grid grid-cols-1 gap-x-8 gap-y-6 ${
      columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"
    } ${className}`}
  >
    {children}
  </dl>
);

/**
 * One pair. `value` is deliberately not defaulted here — the caller decides
 * what an absent answer should say, because "Not provided" is right for a
 * passport number and wrong for a test score a student has not sat yet.
 */
export const DataItem = ({ label, value, empty = "Not provided" }) => {
  const missing = value === null || value === undefined || value === "";
  return (
    <div className="min-w-0">
      <dt className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink-faint">{label}</dt>
      <dd
        className={`mt-1.5 break-words text-[16.5px] leading-[1.45] ${
          missing ? "font-medium text-ink-faint" : "font-semibold text-navy-900"
        }`}
      >
        {missing ? empty : value}
      </dd>
    </div>
  );
};

/** A bordered sub-card, for the repeatable entries a section lists. */
export const EntryCard = ({ children, className = "", ...props }) => (
  <div
    className={`rounded-xl border border-hairline bg-canvas px-5 py-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);

/** Nothing here yet, said in the section's own voice rather than a grey box. */
export const NoneYet = ({ children }) => (
  <p className="text-[15.5px] font-medium leading-[1.55] text-ink-faint">{children}</p>
);
