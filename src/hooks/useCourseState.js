import { useCallback, useMemo } from "react";

import { useAppData } from "../context/AppDataContext";

/**
 * What this student's relationship to a given course already is.
 *
 * Derived from the applications the provider already holds, so it is the
 * backend's answer and not a UI memory — the same badge appears on a second
 * device and after a reload. `courseId` on an application is the programme id,
 * which is what catalogue cards carry as `course.id`.
 *
 * Statuses collapse to three things a card can usefully say:
 *
 *   - **offer** — there is an offer on this one. Outranks everything: it is
 *     the best news the student has and the card should lead with it.
 *   - **applied** — an application exists and is live. Withdrawn and rejected
 *     ones deliberately do *not* count, because applying again after a
 *     rejection is a real thing students do and a card that says "application
 *     in progress" would stop them.
 *   - **selected** — the course they pressed Apply on but have not opened an
 *     application for yet.
 */

const OFFER_STATUSES = ["offer_received", "offer_accepted", "cas_received", "visa_processing", "visa_approved", "enrolled"];
const DEAD_STATUSES = ["withdrawn", "rejected", "offer_declined"];

export const useCourseState = (intentProgramId = null) => {
  const { applications } = useAppData();

  const byCourse = useMemo(() => {
    const map = new Map();
    for (const application of applications) {
      if (!application.courseId || DEAD_STATUSES.includes(application.status)) continue;
      const kind = OFFER_STATUSES.includes(application.status) ? "offer" : "applied";
      const existing = map.get(application.courseId);
      // An offer beats an in-progress application for the same course.
      if (existing && existing.kind === "offer") continue;
      map.set(application.courseId, { kind, applicationId: application.id });
    }
    return map;
  }, [applications]);

  return useCallback(
    (courseId) => {
      if (!courseId) return null;
      const applied = byCourse.get(courseId);
      if (applied) return applied;
      if (intentProgramId && courseId === intentProgramId) return { kind: "selected" };
      return null;
    },
    [byCourse, intentProgramId]
  );
};
