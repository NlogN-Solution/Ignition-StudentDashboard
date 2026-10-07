import { useCallback, useEffect, useState } from "react";

import { getJourney } from "../api/journey";
import { STOPPED_STATUSES } from "../lib/applicationStatus";
import { INTERVIEW_STAGE_KEYS } from "../lib/interviewPractice";

/** How far along the interview stages a journey is — the one to show first. */
const rank = (journey) => {
  const steps = journey.steps.filter((s) => INTERVIEW_STAGE_KEYS.includes(s.key));
  if (steps.some((s) => s.status === "current")) return 0;
  if (steps.some((s) => s.status === "completed")) return 1;
  return 2;
};

/**
 * The application whose journey the Interview Preparation page hands in to.
 *
 * Same reads as `useJourneyActions` — one per open application, since the
 * journey is per application. A student with several picks the one at an
 * interview stage right now; failing that, one that has been through them;
 * failing that, the first whose journey has them at all. `null` when none
 * does, and the page then shows guides and practice only.
 */
export const useInterviewJourney = (applications) => {
  const [found, setFound] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const ids = applications
    .filter((app) => !STOPPED_STATUSES.includes(app.status))
    .map((app) => app.id)
    .join(",");

  useEffect(() => {
    let cancelled = false;
    const open = applications.filter((app) => ids.split(",").includes(app.id));
    setIsLoading(true);
    Promise.all(
      open.map((app) =>
        getJourney(app.id)
          .then((journey) => ({ app, journey }))
          .catch(() => ({ app, journey: null }))
      )
    )
      .then((results) => {
        if (cancelled) return;
        const candidates = results
          .filter(({ journey }) => journey?.steps.some((s) => INTERVIEW_STAGE_KEYS.includes(s.key)))
          .sort((a, b) => rank(a.journey) - rank(b.journey));
        setFound(candidates[0] ?? null);
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
    // `ids` on purpose, as in `useJourneyActions`: the application objects are
    // rebuilt on every context update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  /** Every journey action answers with the whole journey; swap it in. */
  const setJourney = useCallback((journey) => setFound((current) => (current ? { ...current, journey } : current)), []);

  const step = (key) => found?.journey.steps.find((s) => s.key === key) ?? null;

  return {
    isLoading,
    application: found?.app ?? null,
    prepStep: step("interview_prep"),
    recordingStep: step("interview_recording"),
    setJourney,
  };
};
