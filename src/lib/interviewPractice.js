/**
 * Which practice interviews a student has finished.
 *
 * Shared by the Interview Preparation page (the Completed chips and the
 * recording hand-in) and the journey's interview stages (the "2 of 3" line),
 * so the two never count differently. The backend counts the same way when it
 * gates the hand-in: a session counts once it is completed, whatever it scored.
 */

/** The journey stages that point at the Interview Preparation page. */
export const INTERVIEW_STAGE_KEYS = ["interview_prep", "interview_recording"];

const isCompleted = (session) => session.status === "completed" && session.typeKey;

/** The type keys, out of `keys`, the student has a completed session of. */
export const completedPracticeKeys = (sessions, keys) =>
  new Set(sessions.filter(isCompleted).map((s) => s.typeKey).filter((key) => keys.includes(key)));

/** Each type's best completed session, keyed by type key. */
export const bestSessionByType = (sessions) => {
  const best = {};
  for (const session of sessions) {
    if (!isCompleted(session)) continue;
    const current = best[session.typeKey];
    if (!current || (session.score ?? 0) > (current.score ?? 0)) best[session.typeKey] = session;
  }
  return best;
};
