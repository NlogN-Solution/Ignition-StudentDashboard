import React from 'react';

/**
 * A frosted-glass variant of `Panel` (`components/ui/kit.js`), scoped to the
 * dashboard only — this is an explicit one-off experiment, not a system-wide
 * restyle, so it lives beside the dashboard rather than replacing the shared
 * primitive every other screen still uses.
 *
 * Needs a colourful, blurred backdrop behind it to actually read as glass —
 * see the gradient wash `Dashy.js` renders behind the page content.
 */
const GlassPanel = ({ children, className = '' }) => (
  <section
    className={`overflow-hidden rounded-2xl border border-white/60 bg-white/55 shadow-[0_8px_32px_rgba(15,23,42,0.10)] backdrop-blur-xl backdrop-saturate-150 ${className}`}
  >
    {children}
  </section>
);

export default GlassPanel;
