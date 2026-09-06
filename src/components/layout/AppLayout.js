import React from "react";

import SideNavigation from "../navigation/sidenav";

/**
 * The shell every signed-in screen sits in: fixed header + sidebar from
 * SideNavigation, plus a content column offset to clear both (pt-16 for the
 * header, md:pl-72 for the sidebar). SideNavigation only renders the fixed
 * chrome itself — this is the one place that reserves the actual layout
 * space for it, so content never renders underneath it.
 */
const AppLayout = ({ children, contentClassName }) => (
  <div className="min-h-screen bg-slate-50">
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
