import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "./AuthContext";
import { useAppData } from "./AppDataContext";
import { trackEvent } from "../lib/analytics";
import { getPendingIntent } from "../lib/applyIntent";
import {
  DASHBOARD_TOUR_VERSION,
  markTourCompleted,
  markTourSkipped,
  readOnboardingState,
  shouldOfferTour,
} from "../services/onboardingService";
import { buildDashboardTourSteps } from "../components/onboarding/tourSteps";
import {
  isMobileViewport,
  paddedRect,
  rectsMatch,
  scrollIntoViewIfNeeded,
  waitForElement,
} from "../components/onboarding/tourDom";

/**
 * The dashboard product tour's state machine.
 *
 * Everything that decides *what happens* lives here — which step is current,
 * getting the student to the route that step lives on, waiting for its target
 * to mount, measuring it, and recording the outcome. The components under
 * components/onboarding are only the pixels.
 *
 *   idle      nothing on screen
 *   welcome   the opening modal, offering the tour
 *   running   walking the steps
 *   finished  the completion modal
 *
 * Mounted once, above <Routes>, so a step can move the student between pages
 * without the tour itself unmounting.
 */
const TourContext = createContext(null);

// Screens where onboarding must never interrupt: the student is either signed
// out or still in the setup wizard, which has no dashboard chrome to point at.
const EXCLUDED_PATHS = new Set([
  "/login",
  "/registration",
  "/reset",
  "/initalsetup",
]);

// Long enough for a route to mount and its first fetch to land, short enough
// that a genuinely missing target doesn't stall the tour.
const TARGET_TIMEOUT_MS = 6000;

export const TourProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isBootstrapping, updateUser } = useAuth();
  const {
    applications,
    documents,
    requiredDocuments,
    tasks,
    isTaskUnlocked,
    unreadNotificationCount,
  } = useAppData();

  const [status, setStatus] = useState("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [targetElement, setTargetElement] = useState(null);
  const [targetRect, setTargetRect] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  // `seq` makes a repeated request for the same drawer state observable, so
  // the sidebar reopens if something else closed it mid-tour.
  const [navDrawerRequest, setNavDrawerRequest] = useState(null);

  // Which way Next/Back was heading, so a step whose target never appears is
  // skipped in the direction the student was already travelling.
  const directionRef = useRef("forward");
  const hasOfferedRef = useRef(false);
  const drawerSeqRef = useRef(0);
  // True for the tour offered automatically on a student's first visit, false
  // for one replayed from the side navigation. Only the first run ends by
  // taking the student to the course they pressed Apply on — a replay weeks
  // later must not yank them to a course page.
  const isFirstRunRef = useRef(false);

  // The course this student pressed Apply on and has not applied to yet. A
  // student who registered from a course card is shown the dashboard once,
  // by the tour, and then taken to that course's page — so the closing modal
  // needs it. Read when the tour ends, not when it starts: the intent closes
  // once the application is started.
  const [pendingCourse, setPendingCourse] = useState(null);
  const [redirectToCourse, setRedirectToCourse] = useState(false);

  /** Take a first-run student to the course they pressed Apply on, if any. */
  const goToPendingCourse = useCallback(async () => {
    const intent = await getPendingIntent();
    const slug = intent?.course?.course_slug;
    if (slug) navigate(`/explore/courses/${slug}`);
  }, [navigate]);

  /** What the copy in tourSteps.js is allowed to reason about. */
  const tourContext = useMemo(() => {
    const openTasks = tasks.filter((task) => !task.completed && isTaskUnlocked(task));
    const pendingDocuments = requiredDocuments.filter(
      (doc) => doc.status !== "approved" && doc.status !== "verified"
    );
    return {
      firstName: user?.fullName?.split(" ")[0] ?? "",
      profileCompletion: user?.profileCompletion ?? 0,
      applicationCount: applications.length,
      documentCount: documents.length,
      pendingDocumentCount: pendingDocuments.length,
      openTaskCount: openTasks.length,
      unreadNotificationCount,
    };
  }, [
    user,
    applications.length,
    documents.length,
    requiredDocuments,
    tasks,
    isTaskUnlocked,
    unreadNotificationCount,
  ]);

  const steps = useMemo(() => buildDashboardTourSteps(tourContext), [tourContext]);
  const stepCount = steps.length;
  const activeStep = status === "running" ? steps[stepIndex] ?? null : null;

  const requestNavDrawer = useCallback((open) => {
    drawerSeqRef.current += 1;
    setNavDrawerRequest({ open, seq: drawerSeqRef.current });
  }, []);

  const clearOverlay = useCallback(() => {
    setTargetElement(null);
    setTargetRect(null);
    setIsResolving(false);
    requestNavDrawer(false);
  }, [requestNavDrawer]);

  /* ------------------------------------------------------------ actions --- */

  const startTour = useCallback(
    (source = "welcome_modal") => {
      directionRef.current = "forward";
      setStepIndex(0);
      setStatus("running");
      trackEvent("dashboard_tour_started", { source, version: DASHBOARD_TOUR_VERSION });
    },
    []
  );

  const completeTour = useCallback(() => {
    clearOverlay();
    // The completion modal waits for the intent, so it opens already knowing
    // whether its button leads to the student's course — rather than showing
    // one next step and swapping it for another a moment later.
    const firstRun = isFirstRunRef.current;
    // Nothing on screen for the moment the intent takes to arrive: left
    // "running", the last step's tooltip would redraw and could be pressed
    // again.
    setStatus("idle");
    getPendingIntent().then((intent) => {
      const course = intent?.course?.course_slug ? intent.course : null;
      setPendingCourse(course);
      setRedirectToCourse(Boolean(course) && firstRun);
      setStatus("finished");
    });
    trackEvent("dashboard_tour_completed", {
      version: DASHBOARD_TOUR_VERSION,
      step_count: stepCount,
    });
    markTourCompleted({ user, updateUser });
  }, [clearOverlay, stepCount, user, updateUser]);

  const goToStep = useCallback(
    (nextIndex, direction) => {
      directionRef.current = direction;
      if (nextIndex < 0) return;
      if (nextIndex >= stepCount) {
        completeTour();
        return;
      }
      setStepIndex(nextIndex);
    },
    [completeTour, stepCount]
  );

  const nextStep = useCallback(() => {
    const current = steps[stepIndex];
    if (current) {
      trackEvent("dashboard_tour_step_completed", {
        step_id: current.id,
        step_index: stepIndex + 1,
        step_count: stepCount,
      });
    }
    goToStep(stepIndex + 1, "forward");
  }, [goToStep, stepCount, stepIndex, steps]);

  const previousStep = useCallback(() => {
    goToStep(stepIndex - 1, "back");
  }, [goToStep, stepIndex]);

  const skipTour = useCallback(
    (source = "tooltip") => {
      const current = steps[stepIndex];
      clearOverlay();
      setStatus("idle");
      trackEvent("dashboard_tour_skipped", {
        source,
        step_id: current?.id ?? null,
        step_index: current ? stepIndex + 1 : 0,
        step_count: stepCount,
        version: DASHBOARD_TOUR_VERSION,
      });
      markTourSkipped({ user, updateUser });
      // Skipping is not a reason to lose the course either: a first-run
      // student who came from Apply still ends up on it.
      if (isFirstRunRef.current) {
        isFirstRunRef.current = false;
        goToPendingCourse();
      }
    },
    [clearOverlay, stepCount, stepIndex, steps, user, updateUser, goToPendingCourse]
  );

  const dismissWelcome = useCallback(() => skipTour("welcome_modal"), [skipTour]);

  const closeCompletion = useCallback(
    (destination) => {
      setStatus("idle");
      isFirstRunRef.current = false;
      setRedirectToCourse(false);
      if (destination) navigate(destination);
    },
    [navigate]
  );

  const restartTour = useCallback(() => {
    isFirstRunRef.current = false;
    trackEvent("dashboard_tour_restarted", { version: DASHBOARD_TOUR_VERSION });
    directionRef.current = "forward";
    setStepIndex(0);
    setStatus("running");
  }, []);

  /* ------------------------------------------------- first-time detection --- */

  useEffect(() => {
    if (hasOfferedRef.current) return undefined;
    if (isBootstrapping || !user) return undefined;
    if (user.role !== "student") return undefined;
    // A student who hasn't finished the setup wizard is bounced to it by the
    // route guard — there is no dashboard to tour yet.
    if (!user.onboardingCompleted) return undefined;
    if (EXCLUDED_PATHS.has(location.pathname)) return undefined;

    if (!shouldOfferTour(readOnboardingState(user))) return undefined;

    // Let the dashboard paint and settle before interrupting it. The "already
    // offered" latch is set when the timer fires, not when it is scheduled —
    // StrictMode mounts every effect twice in development, and latching early
    // would let the first pass cancel the only run that was going to happen.
    const timer = setTimeout(() => {
      hasOfferedRef.current = true;
      isFirstRunRef.current = true;
      setStatus((current) => (current === "idle" ? "welcome" : current));
    }, 700);
    return () => clearTimeout(timer);
  }, [user, isBootstrapping, location.pathname]);

  // Signing out ends anything in progress and re-arms the check for whoever
  // signs in next.
  useEffect(() => {
    if (user) return;
    hasOfferedRef.current = false;
    isFirstRunRef.current = false;
    setRedirectToCourse(false);
    setStatus("idle");
    setStepIndex(0);
    setTargetElement(null);
    setTargetRect(null);
  }, [user]);

  /* --------------------------------------------------- step resolution --- */

  useEffect(() => {
    if (status !== "running") return undefined;

    const step = steps[stepIndex];
    if (!step) {
      completeTour();
      return undefined;
    }

    let cancelled = false;
    const isCancelled = () => cancelled;

    setTargetElement(null);
    setTargetRect(null);
    setIsResolving(true);

    const resolve = async () => {
      if (step.route && window.location.pathname !== step.route) {
        navigate(step.route);
      }

      // The sidebar is off-canvas below `md`; open it before looking for a
      // nav target so the spotlight lands on something the student can see.
      requestNavDrawer(Boolean(step.requiresNav) && isMobileViewport());

      if (!step.target) {
        if (!cancelled) setIsResolving(false);
        return;
      }

      const element = await waitForElement(step.target, {
        timeout: TARGET_TIMEOUT_MS,
        isCancelled,
      });
      if (cancelled) return;

      if (!element) {
        // A section this student doesn't have. Keep going rather than
        // stranding them on an empty spotlight.
        trackEvent("dashboard_tour_step_skipped", {
          step_id: step.id,
          reason: "target_not_found",
        });
        if (directionRef.current === "back") {
          if (stepIndex > 0) goToStep(stepIndex - 1, "back");
          else goToStep(stepIndex + 1, "forward");
        } else {
          goToStep(stepIndex + 1, "forward");
        }
        return;
      }

      scrollIntoViewIfNeeded(element);
      setTargetElement(element);
      setTargetRect(paddedRect(element));
      setIsResolving(false);

      trackEvent("dashboard_tour_step_viewed", {
        step_id: step.id,
        step_index: stepIndex + 1,
        step_count: stepCount,
        version: DASHBOARD_TOUR_VERSION,
      });
    };

    resolve();

    return () => {
      cancelled = true;
    };
    // `steps` is intentionally not a dependency: its identity changes whenever
    // the student's data does, and re-running resolution mid-step would fight
    // the scroll animation. Step *copy* still re-reads live data on render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, stepIndex]);

  /* ------------------------------------------------------- measurement --- */

  // The spotlight follows its target for as long as the step is on screen, so
  // scrolling, the sidebar's slide-in transition and viewport changes are all
  // handled by the same loop instead of three separate listeners.
  useEffect(() => {
    if (status !== "running" || !targetElement) return undefined;

    let frame = 0;
    let previous = null;

    const measure = () => {
      if (!targetElement.isConnected) {
        setTargetElement(null);
        setTargetRect(null);
        return;
      }
      const rect = paddedRect(targetElement);
      if (!rectsMatch(previous, rect)) {
        previous = rect;
        setTargetRect(rect);
      }
      frame = window.requestAnimationFrame(measure);
    };

    frame = window.requestAnimationFrame(measure);
    return () => window.cancelAnimationFrame(frame);
  }, [status, targetElement]);

  /* ------------------------------------------------- keyboard shortcuts --- */

  useEffect(() => {
    if (status !== "running") return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        skipTour("escape_key");
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextStep();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousStep();
      }
    };

    // Capture phase: the sidebar also listens for Escape and would otherwise
    // close its dropdowns instead of letting the tour handle the key.
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [status, skipTour, nextStep, previousStep]);

  const value = useMemo(
    () => ({
      status,
      isActive: status !== "idle",
      steps,
      stepIndex,
      stepCount,
      activeStep,
      targetRect,
      isResolving,
      tourContext,
      pendingCourse,
      redirectToCourse,
      navDrawerRequest,
      startTour,
      nextStep,
      previousStep,
      skipTour,
      dismissWelcome,
      closeCompletion,
      restartTour,
    }),
    [
      status,
      steps,
      stepIndex,
      stepCount,
      activeStep,
      targetRect,
      isResolving,
      tourContext,
      pendingCourse,
      redirectToCourse,
      navDrawerRequest,
      startTour,
      nextStep,
      previousStep,
      skipTour,
      dismissWelcome,
      closeCompletion,
      restartTour,
    ]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

/**
 * The tour, or null outside the provider.
 *
 * Deliberately non-throwing, unlike the app's other context hooks: the side
 * navigation reads it to render the "replay the tour" action, and that
 * component is also rendered by screens that sit outside the provider.
 */
export const useDashboardTour = () => useContext(TourContext);

export default TourContext;
