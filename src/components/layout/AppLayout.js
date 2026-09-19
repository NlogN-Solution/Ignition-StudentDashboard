import React from "react";

import SideNavigation from "../navigation/sidenav";

/**
 * The shell every signed-in screen sits in: fixed header + sidebar from
 * SideNavigation, plus a content column offset to clear both (pt-16 for the
 * header, md:pl-72 for the sidebar). SideNavigation only renders the fixed
 * chrome itself — this is the one place that reserves the actual layout
 * space for it, so content never renders underneath it.
 *
 * The ground is `canvas`, the public platform's off-white, rather than the
 * `slate-50` it used to be. Slate is a cool grey; canvas is warm, and every
 * panel drawn on it is a hairline-bordered white card whose edge disappears
 * against a grey of the same temperature.
 */
const AppLayout = ({ children, contentClassName }) => (
  <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
    <SideNavigation />

    <div className="pt-16 md:pl-72">
      {contentClassName ? (
        <div className={contentClassName}>{children}</div>
      ) : (
        children
      )}
    </div>
  </div>
);

export default AppLayout;
