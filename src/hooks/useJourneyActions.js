import { useEffect, useState } from "react";

import { getJourney } from "../api/journey";
import { STOPPED_STATUSES } from "../lib/applicationStatus";

//: Journey stages whose "your turn" is not already on the dashboard. A
//: documents stage is not here: the files it asks for are checklist items, and
//: those already reach the dashboard through `useRequestedDocuments`.
const SURFACED_KINDS = ["review", "booking", "checklist"];

const describe = (step) => {
  if (step.kind === "booking") return "Pick a time for your interview";
  if (step.kind === "checklist") return `Continue your ${step.name.toLowerCase()} checklist`;
  const latest = step.submissions[step.submissions.length - 1];
  return latest?.status === "changes_requested" ? `Your counsellor sent feedback on ${step.name.toLowerCase()}` : step.name;
};

/**
 * Journey stages waiting on the student, across their open applications.
 *
 * One read per application, because the journey is per application. Students
 * have a handful, and applications without a journey answer null cheaply.
 */
export const useJourneyActions = (applications) => {
  const [actions, setActions] = useState([]);
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
        const found = [];
        for (const { app, journey } of results) {
          const step = journey?.steps.find(
            (s) => s.id === journey.currentStepId && s.waitingOn === "student" && SURFACED_KINDS.includes(s.kind)
          );
          if (step) {
            found.push({
              applicationId: app.id,
              stageId: step.id,
              title: describe(step),
              body: `${app.courseName ?? "Your application"}${app.universityName ? ` · ${app.universityName}` : ""}`,
              kind: step.kind,
            });
          }
        }
        // Bookings first: slots can be taken or expire; the rest are self-paced.
        found.sort((a, b) => (a.kind === "booking" ? -1 : 0) - (b.kind === "booking" ? -1 : 0));
        setActions(found);
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
    // `ids` is the dependency on purpose: the application objects are rebuilt
    // on every context update, and refetching every journey each time would
    // be a request storm for nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  return { actions, isLoading };
};
