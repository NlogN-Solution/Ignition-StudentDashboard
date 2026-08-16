import React from "react";

import SideNavigation from "../navigation/sidenav";

/**
 * The shell every signed-in screen sits in: side navigation plus a flexible
 * content column. Extracted from the six near-identical *Layout files that used
 * to repeat this markup verbatim.
 */
const AppLayout = ({ children, contentClassName }) => (
  <div className="flex min-h-screen">
    <SideNavigation />

    <div className="flex-1 flex flex-col">
      {contentClassName ? (
        <div className={contentClassName}>{children}</div>
      ) : (
        children
      )}
    </div>
  </div>
);

export default AppLayout;
