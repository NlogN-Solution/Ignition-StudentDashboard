import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * The dashboard's small design system.
 *
 * One card surface, one header, one button style and one skeleton, so every
 * panel on the dashboard is the same object instead of each section choosing
 * its own colour, radius and shadow.
 *
 * The rules it encodes:
 *   - One primary: Ignition navy (`navy-900`, #01166f — the public website's
 *     `--color-navy`), with `navy-950` for hover and `navy-50` as the quiet
 *     tint behind icons. Buttons, active states, progress, links, headings and
 *     important icons all use it; there is no second blue. Secondary text is
 *     grey (`ink-muted`/`ink-faint`).
 *   - Colour beyond navy is semantic only: emerald for done, amber for
 *     "needs you", red for stopped.
 *   - Surfaces are frosted glass with soft two-sided (neumorphic) shadows:
 *     `shadow-card` at rest, `shadow-lift` on hover (tailwind.config.js), and
 *     the white `section`/`div` cards pick up the frost from the `.app-shell`
 *     rule in index.css — nothing here sets it per component.
 *   - Spacing is on a 4px grid: 20px card padding (24px from `sm`), 16/24px
 *     gaps between cards.
 */

export const cardClass = 'rounded-2xl border border-hairline bg-white shadow-card';

export const Card = ({ as: Tag = 'section', className = '', children, ...props }) => (
  <Tag className={`${cardClass} ${className}`} {...props}>
    {children}
  </Tag>
);

/** A card's title row: optional icon tile, title, one-line description, one action. */
export const CardHeader = ({ icon: Icon, title, description, action, className = '' }) => (
  <div className={`flex items-start justify-between gap-3 ${className}`}>
    <div className="flex min-w-0 items-start gap-3">
      {Icon && (
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-900"
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
      )}
      <div className="min-w-0">
        <h2 className="text-[16px] font-semibold leading-8 tracking-[-0.01em] text-navy-900">{title}</h2>
        {description && <p className="-mt-0.5 text-[13px] leading-5 text-ink-muted">{description}</p>}
      </div>
    </div>
    {action && <div className="shrink-0 pt-1">{action}</div>}
  </div>
);

/** The tertiary action: navy text and a chevron, nothing else. */
export const CardLink = ({ to, children, className = '' }) => (
  <Link
    to={to}
    className={`inline-flex items-center gap-0.5 text-[13px] font-semibold text-navy-900 transition-colors hover:text-navy-600 ${className}`}
  >
    {children}
    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
  </Link>
);

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60';

// Every button is the same navy fill. `secondary` is kept as a name so
// call sites read naturally, but it deliberately resolves to the same fill.
const BUTTON_FILL = 'bg-navy-900 text-white hover:bg-navy-950 active:bg-navy-950';

const BUTTON_VARIANTS = {
  primary: BUTTON_FILL,
  secondary: BUTTON_FILL,
  // The one exception: on the navy Next Step card a navy button would vanish,
  // so it is white with navy text there.
  inverse: 'bg-white text-navy-900 hover:bg-navy-50',
};

const BUTTON_SIZES = {
  md: 'h-10 px-4',
  sm: 'h-9 px-3.5 text-[13px]',
};

export const buttonClass = (variant = 'primary', size = 'md') =>
  `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]}`;

/** A placeholder bar. Size it like the thing it stands in for. */
export const Bone = ({ className = '' }) => (
  <span aria-hidden className={`block animate-pulse rounded-md bg-slate-100 ${className}`} />
);
