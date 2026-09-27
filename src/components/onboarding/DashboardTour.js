import React from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { useDashboardTour } from "../../context/TourContext";
import { resolveStepText } from "./tourSteps";
import TourCompletionModal from "./TourCompletionModal";
import TourSpotlight from "./TourSpotlight";
import TourTooltip from "./TourTooltip";
import WelcomeTourModal from "./WelcomeTourModal";

/**
 * Renders whatever the tour state machine currently wants on screen.
 *
 * Mounted once next to <Routes> and painted into a portal on <body>, so it
 * survives the route changes the tour itself triggers and never inherits a
 * transform or overflow from a page that would break `position: fixed`.
 */
const DashboardTour = () => {
  const tour = useDashboardTour();
  const reduceMotion = useReducedMotion();

  if (!tour || tour.status === "idle" || typeof document === "undefined") return null;

  const {
    status,
    activeStep,
    stepIndex,
    stepCount,
    targetRect,
    isResolving,
    tourContext,
    pendingCourse,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    dismissWelcome,
    closeCompletion,
  } = tour;

  if (status === "welcome") {
    return createPortal(
      <WelcomeTourModal
        firstName={tourContext.firstName}
        stepCount={stepCount}
        onStart={() => startTour("welcome_modal")}
        onDismiss={dismissWelcome}
      />,
      document.body
    );
  }

  if (status === "finished") {
    return createPortal(
      <TourCompletionModal
        openTaskCount={tourContext.openTaskCount}
        profileCompletion={tourContext.profileCompletion}
        pendingCourse={pendingCourse}
        onClose={closeCompletion}
      />,
      document.body
    );
  }

  // status === "running"
  const isReady = Boolean(activeStep) && !isResolving;

  return createPortal(
    <>
      <TourSpotlight rect={targetRect} reduceMotion={reduceMotion} />

      {isReady ? (
        <TourTooltip
          rect={targetRect}
          placement={activeStep.placement}
          title={resolveStepText(activeStep.title, tourContext)}
          body={resolveStepText(activeStep.body, tourContext)}
          tip={resolveStepText(activeStep.tip, tourContext)}
          stepNumber={stepIndex + 1}
          stepCount={stepCount}
          isFirst={stepIndex === 0}
          isLast={stepIndex === stepCount - 1}
          reduceMotion={reduceMotion}
          onNext={nextStep}
          onBack={previousStep}
          onSkip={() => skipTour("tooltip")}
        />
      ) : (
        // The step is still navigating or waiting for its target to mount.
        // Showing the backdrop with a quiet placeholder beats flashing a
        // tooltip that points at nothing.
        <div
          className="fixed left-1/2 top-1/2 z-[192] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2
            rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-navy-900 shadow-xl"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin text-ignite-500" aria-hidden="true" />
          Opening the next section…
        </div>
      )}
    </>,
    document.body
  );
};

export default DashboardTour;
