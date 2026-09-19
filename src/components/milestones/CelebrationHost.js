import React, { useCallback, useEffect, useRef, useState } from "react";

import CelebrationModal from "./CelebrationModal";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";
import { getUnseenMilestones, markMilestoneSeen } from "../../api/access";

/**
 * Shows good news the student has not seen yet, on whatever page they are on.
 *
 * ## Why this lives in the app shell, not on the dashboard
 *
 * It used to be a `useEffect` inside the dashboard, run once on mount. That
 * missed the two cases the feature exists for:
 *
 *   - **Coming back after the news.** Login returns a student to the page they
 *     were on when their session lapsed (`location.state.from`), often an
 *     application page rather than `/`. The dashboard never mounted, so the
 *     offer was never celebrated.
 *   - **Already signed in when it happens.** A counsellor records the offer
 *     while the portal is open. The one-off check had already run and found
 *     nothing, and nothing asked again until the student happened to reload
 *     the dashboard.
 *
 * So the host is mounted by `AppLayout` on every signed-in page, and it asks
 * the server again whenever the tab comes back into view and every
 * `POLL_MS` while it is visible. The request is one small indexed query
 * (`student_id`, `seen_at IS NULL`), and it only runs when a person is
 * actually looking at the page.
 *
 * One at a time, oldest first: a student returning after a fortnight should
 * see the offer, acknowledge it, and *then* the CAS that followed.
 */

const POLL_MS = 60_000;

const CelebrationHost = () => {
  const { user, studentId } = useAuth();
  const { reloadApplications } = useAppData();
  const [queue, setQueue] = useState([]);
  // Every milestone id already queued this session. Covers one acknowledged
  // locally whose POST has not landed yet: a poll arriving in between must not
  // bring the same news back.
  const queued = useRef(new Set());
  const inFlight = useRef(false);

  const check = useCallback(async () => {
    if (!studentId || inFlight.current) return;
    inFlight.current = true;
    try {
      const unseen = await getUnseenMilestones();
      const added = unseen.filter((milestone) => !queued.current.has(milestone.id));
      if (added.length === 0) return;
      added.forEach((milestone) => queued.current.add(milestone.id));
      setQueue((current) => [...current, ...added]);
      // New news means the application behind it has moved too; refresh the
      // list so badges and progress cards agree with the celebration.
      reloadApplications?.();
    } finally {
      inFlight.current = false;
    }
  }, [studentId, reloadApplications]);

  useEffect(() => {
    if (!studentId) {
      setQueue([]);
      queued.current = new Set();
      return undefined;
    }

    check();

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const timer = window.setInterval(onVisible, POLL_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.clearInterval(timer);
    };
  }, [studentId, check]);

  const current = queue[0] ?? null;

  const acknowledge = useCallback(() => {
    if (!current) return;
    // Optimistic: the celebration closes on the click, not on the round trip.
    setQueue((items) => items.slice(1));
    markMilestoneSeen(current.id);
  }, [current]);

  if (!current) return null;

  return (
    <CelebrationModal
      key={current.id}
      milestone={current}
      studentName={user?.fullName?.split(" ")[0]}
      onDismiss={acknowledge}
    />
  );
};

export default CelebrationHost;
