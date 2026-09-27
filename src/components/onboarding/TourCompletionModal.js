import React from "react";
import { PartyPopper } from "lucide-react";

import TourModal from "./TourModal";

/**
 * Shown once the last step is finished. The primary action is whatever the
 * student should actually do next: the application for the course they came
 * in on (pressed Apply on the public site and not yet applied), otherwise
 * their checklist when something is waiting on them, otherwise their profile.
 */
const TourCompletionModal = ({ openTaskCount, profileCompletion, pendingCourse, onClose }) => {
  const hasTasks = openTaskCount > 0;
  const primary = pendingCourse
    ? { label: "Continue my application", destination: `/apply/${pendingCourse.course_slug}` }
    : hasTasks
      ? { label: "Go to my checklist", destination: "/tasks" }
      : { label: "Finish my profile", destination: "/profile" };

  const courseName = [pendingCourse?.course_name, pendingCourse?.university_name].filter(Boolean).join(" at ");
  const nextStepLine = pendingCourse
    ? `Pick up where you left off — your application for ${courseName || "the course you chose"} is ready to continue.`
    : hasTasks
    ? `Start with your checklist — ${openTaskCount} ${
        openTaskCount === 1 ? "task is" : "tasks are"
      } waiting for you.`
    : profileCompletion >= 90
      ? "Your profile is in good shape. Keep an eye on your checklist and messages for what comes next."
      : `Start by completing your profile — it's ${profileCompletion}% done — then check anything waiting on your checklist.`;

  return (
    <TourModal
      labelledBy="dashboard-tour-done-title"
      describedBy="dashboard-tour-done-body"
      onDismiss={() => onClose(null)}
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
        <PartyPopper className="h-5 w-5" />
      </span>

      <h2
        id="dashboard-tour-done-title"
        className="mt-4 text-xl font-semibold leading-snug text-navy-900"
      >
        You&apos;re ready <span aria-hidden="true">🎉</span>
      </h2>

      <p id="dashboard-tour-done-body" className="mt-3 text-sm leading-relaxed text-slate-600">
        You now know the main areas of your Student Dashboard. {nextStepLine}
      </p>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        <button
          type="button"
          onClick={() => onClose("/")}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100
            hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ignite-400"
        >
          Continue to dashboard
        </button>
        <button
          type="button"
          onClick={() => onClose(primary.destination)}
          className="rounded-lg bg-ignite-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors
            hover:bg-ignite-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ignite-400
            focus-visible:ring-offset-2"
        >
          {primary.label}
        </button>
      </div>
    </TourModal>
  );
};

export default TourCompletionModal;
