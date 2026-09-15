// Where "has this student seen the dashboard tour?" lives.
//
// Persistence is deliberately two-tiered:
//
//   1. The student's profile on the backend — `StudentProfile.preferences` is
//      a free-form JSON blob that already round-trips through
//      `PATCH /student/me/profile`, so onboarding state follows the student
//      across devices with no schema change and no new endpoint.
//   2. localStorage — written first and always, so the answer is available
//      synchronously on the very next page load (the profile fetch is async,
//      and a tour that flashes up before the profile resolves is worse than
//      no tour) and so a student with no profile row yet still gets sane
//      behaviour.
//
// The backend copy wins on read: it is the one that survives a cleared
// browser. Swapping tier 1 for a dedicated `onboarding` column or endpoint
// later means changing `readRemote`/`writeRemote` here and nothing else.

/** Bump when the walkthrough itself changes. */
export const DASHBOARD_TOUR_VERSION = 1;

/**
 * The lowest tour version that still counts as "already onboarded".
 *
 * Leave it below `DASHBOARD_TOUR_VERSION` to let students who finished an
 * older walkthrough keep their completed state; raise it to
 * `DASHBOARD_TOUR_VERSION` to re-run onboarding for everyone after a
 * significant dashboard change.
 */
export const REQUIRED_TOUR_VERSION = 1;

const LOCAL_KEY = "student-dashboard-tour-completed";

const EMPTY_STATE = {
  dashboardTourCompleted: false,
  dashboardTourCompletedAt: null,
  dashboardTourSkipped: false,
  dashboardTourSkippedAt: null,
  version: 0,
};

// Scoped per user so two students sharing a browser don't inherit each
// other's onboarding. The unscoped key is still read as a fallback for
// anything written before the id was known.
const storageKey = (userId) => (userId ? `${LOCAL_KEY}:${userId}` : LOCAL_KEY);

const readLocal = (userId) => {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(storageKey(userId)) ??
      window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    // Private mode, quota, or a hand-edited value — treat as "never seen".
    return null;
  }
};

const writeLocal = (userId, state) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    // Non-fatal: the tour just offers itself again next session.
  }
};

const readRemote = (user) => {
  const onboarding = user?.preferences?.onboarding;
  return onboarding && typeof onboarding === "object" ? onboarding : null;
};

/** The student's onboarding state, backend copy layered over the local one. */
export const readOnboardingState = (user) => ({
  ...EMPTY_STATE,
  ...(readLocal(user?.id) ?? {}),
  ...(readRemote(user) ?? {}),
});

/**
 * Merges `patch` into the stored state and persists it.
 *
 * The local write is synchronous and unconditional. The profile write is
 * attempted only when a profile row exists — the backend rejects a PATCH that
 * would create one without `education_level`, which only the setup wizard
 * knows — and a failure is swallowed because the local copy already holds the
 * answer.
 */
export const persistOnboardingState = async (patch, { user, updateUser } = {}) => {
  const next = {
    ...readOnboardingState(user),
    ...patch,
    version: DASHBOARD_TOUR_VERSION,
  };

  writeLocal(user?.id, next);

  if (!user || !updateUser || !user.hasProfile) return next;

  try {
    await updateUser({
      preferences: { ...(user.preferences ?? {}), onboarding: next },
    });
  } catch {
    // Local copy stands in until the next successful profile write.
  }

  return next;
};

export const markTourCompleted = (options) =>
  persistOnboardingState(
    {
      dashboardTourCompleted: true,
      dashboardTourCompletedAt: new Date().toISOString(),
      dashboardTourSkipped: false,
    },
    options
  );

export const markTourSkipped = (options) =>
  persistOnboardingState(
    { dashboardTourSkipped: true, dashboardTourSkippedAt: new Date().toISOString() },
    options
  );

/** True when the student has neither finished nor dismissed a tour recent
 * enough to count. */
export const shouldOfferTour = (state) => {
  if (!state) return false;
  const seen = state.dashboardTourCompleted || state.dashboardTourSkipped;
  return !(seen && (state.version ?? 0) >= REQUIRED_TOUR_VERSION);
};
