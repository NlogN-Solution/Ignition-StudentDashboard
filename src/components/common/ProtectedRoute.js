import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const ONBOARDING_PATH = "/initalsetup";

/**
 * Gate for routes that need a signed-in student, checked against a real JWT
 * session now. `isBootstrapping` covers the brief window on page load where
 * AuthContext is still asking the backend "is this stored token still
 * valid?" — without it, a refresh would flash a redirect to /login before
 * that answer comes back.
 *
 * A student who hasn't finished the onboarding wizard yet is bounced there
 * from any other guarded route — covers not just the post-registration
 * redirect but also a refresh or direct URL visit mid-wizard.
 */
const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const needsOnboarding = user?.role === "student" && !user.onboardingCompleted;
  if (needsOnboarding && location.pathname !== ONBOARDING_PATH) {
    return <Navigate to={ONBOARDING_PATH} replace />;
  }

  return children;
};

export default ProtectedRoute;
