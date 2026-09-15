import React from "react";
import { Compass } from "lucide-react";

import TourModal from "./TourModal";

/** The first thing a student sees on their first visit to the dashboard. */
const WelcomeTourModal = ({ firstName, stepCount, onStart, onDismiss }) => (
  <TourModal
    labelledBy="dashboard-tour-welcome-title"
    describedBy="dashboard-tour-welcome-body"
    onDismiss={onDismiss}
  >
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ignite-50 text-ignite-600">
      <Compass className="h-5 w-5" />
    </span>

    <h2
      id="dashboard-tour-welcome-title"
      className="mt-4 text-xl font-semibold leading-snug text-navy-900"
    >
      {firstName ? `Welcome, ${firstName} ` : "Welcome to your Student Dashboard "}
      <span aria-hidden="true">👋</span>
    </h2>

    <p id="dashboard-tour-welcome-body" className="mt-3 text-sm leading-relaxed text-slate-600">
      Everything about your application journey lives here — your profile, documents,
      applications, messages, eligibility, interviews, visa preparation and more.
    </p>
    <p className="mt-2 text-sm leading-relaxed text-slate-600">
      Take a quick tour to see how it all fits together. It takes about a minute.
    </p>

    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100
          hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ignite-400"
      >
        Explore myself
      </button>
      <button
        type="button"
        onClick={onStart}
        className="rounded-lg bg-ignite-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors
          hover:bg-ignite-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ignite-400
          focus-visible:ring-offset-2"
      >
        Start tour
      </button>
    </div>

    <p className="mt-4 text-center text-xs text-slate-400 sm:text-right">
      {stepCount} short steps · you can stop at any time
    </p>
  </TourModal>
);

export default WelcomeTourModal;
