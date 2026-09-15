import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { consumeArrivedFromApply, getPendingIntent } from "../../lib/applyIntent";

/**
 * Sends a student who arrived on an apply link into the apply flow.
 *
 * This is the returning-student case. A brand-new student goes through
 * onboarding, which ends on `/apply/<slug>` by itself; somebody who already
 * has an account and a finished profile is dropped on the dashboard by the
 * auth guard, and without this they would have to go and find the course they
 * had just pressed Apply on.
 *
 * ## Why it fires at most once
 *
 * It acts only when *this page load* began with `?intent=` in the URL
 * (`consumeArrivedFromApply`), not merely whenever an unfinished intent
 * exists. The difference matters: intents stay open until the application is
 * actually started, so keying off existence would hijack every dashboard visit
 * for as long as the student put off applying — the product deciding where they
 * are allowed to be. An apply link is an instruction; a pending intent is only
 * a memory.
 *
 * Renders nothing. It is mounted inside the router so it can navigate, and it
 * waits for onboarding to be finished before it does, so it cannot fight the
 * guard that sends new students to the wizard.
 */
const ApplyIntentRedirect = () => {
  const { user, isAuthenticated, isBootstrapping } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    if (handled || isBootstrapping || !isAuthenticated) return;
    if (user?.role !== "student" || !user?.onboardingCompleted) return;
    // Only from the dashboard. A student who landed on an apply link and then
    // navigated somewhere themselves has overridden the instruction.
    if (location.pathname !== "/") return;
    if (!consumeArrivedFromApply()) {
      setHandled(true);
      return;
    }

    let cancelled = false;
    setHandled(true);
    getPendingIntent().then((intent) => {
      const slug = intent?.course?.course_slug;
      if (!cancelled && slug) navigate(`/apply/${slug}`, { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [handled, isBootstrapping, isAuthenticated, user, location.pathname, navigate]);

  return null;
};

export default ApplyIntentRedirect;
