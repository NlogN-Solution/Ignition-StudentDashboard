import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";
import EmptyState from "../../components/common/EmptyState";

/**
 * Catch-all for nav entries that do not have a screen in this build (Settings,
 * Help Center) and for mistyped URLs.
 */
const NotFound = () => {
  const location = useLocation();

  return (
    <AppLayout contentClassName="flex-1 p-6 bg-gray-100">
      <div className="max-w-2xl mx-auto mt-24">
        <EmptyState
          icon={Compass}
          title="This section isn't available yet"
          description={`Nothing is wired up at ${location.pathname} in this build.`}
          action={
            <Link
              to="/"
              className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300"
            >
              Back to dashboard
            </Link>
          }
        />
      </div>
    </AppLayout>
  );
};

export default NotFound;
