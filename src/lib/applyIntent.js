import { apiGet, apiPost } from "../api/client";

/**
 * The course the student came here to apply for.
 *
 * The public site mints an intent when Apply Now is pressed and sends the
 * student here with `?intent=<id>`. Everything the intent *means* lives on the
 * server; this module's whole job is to not lose the id between arriving and
 * signing in.
 *
 * ## Why sessionStorage, and why the URL too
 *
 * The id has to survive a navigation the portal owns: a student who lands on
 * `/registration` and presses "Already have an account? Login" moves to a
 * different route, and a value held only in React state dies there. It also
 * has to survive a reload. sessionStorage covers both, and is scoped to the
 * tab so two students on one machine cannot inherit each other's course.
 *
 * It is *not* the source of truth for anything. The worst a tampered
 * sessionStorage value can do is name a different published course, which the
 * server then refuses to claim if it belongs to someone else. The course
 * details themselves are always read back from the API.
 */

const STORAGE_KEY = "ignition_apply_intent";
export const INTENT_PARAM = "intent";

const safeSession = {
  get() {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY);
    } catch {
      // Private mode, blocked storage. The intent is lost; applying is not.
      return null;
    }
  },
  set(value) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
};

/**
 * Lift `?intent=` out of the address bar and remember it.
 *
 * Runs before React mounts (`src/index.js`), for the same reason
 * `captureIncomingHandoff` does: the parameter should not survive into the
 * history entry the student can navigate back to, and a component that reads
 * it on mount races the router.
 */
export const captureIncomingIntent = () => {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const id = url.searchParams.get(INTENT_PARAM);
  if (!id) return safeSession.get();

  safeSession.set(id);
  // Remembered separately from the id: "this page load began with an apply
  // link" is a different fact from "there is an unfinished intent", and only
  // the first justifies taking over navigation (see `consumeArrivedFromApply`).
  // Without the distinction, a student with a half-finished application would
  // be redirected into it every time they opened the dashboard.
  arrivedFromApplyLink = true;
  url.searchParams.delete(INTENT_PARAM);
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  return id;
};

/**
 * True once, for the page load that arrived on an apply link.
 *
 * Module-level rather than stored: it must not survive a reload, because a
 * reload is the student choosing to be where they are.
 */
let arrivedFromApplyLink = false;

export const consumeArrivedFromApply = () => {
  const value = arrivedFromApplyLink;
  arrivedFromApplyLink = false;
  return value;
};

export const peekIntentId = () => safeSession.get();
export const clearIntentId = () => safeSession.clear();

/** The course behind an intent, readable before the student has an account. */
export const getIntentPreview = async (intentId) => {
  if (!intentId) return null;
  try {
    return await apiGet(`/public/apply-intents/${intentId}`, { skipAuth: true });
  } catch {
    // Expired, or minted against a course since unpublished. The auth screens
    // simply drop the "you're applying for" card rather than showing an error
    // about a feature the student never asked for.
    return null;
  }
};

/**
 * Bind the pending intent to the account that just signed in or signed up.
 *
 * Called from `AuthContext` on both paths, which is the whole trick: the
 * public site does not know which door the student will use, and neither does
 * this. Returns the claimed intent, or null if there was nothing to claim.
 */
export const claimPendingIntent = async () => {
  const id = peekIntentId();
  if (!id) return null;
  try {
    const claimed = await apiPost(`/student/me/apply-intent/${id}/claim`);
    // Claimed successfully — the server now remembers it against the account,
    // so the tab-local copy has done its job.
    clearIntentId();
    return claimed;
  } catch {
    // Expired, or already someone else's. Drop it so it stops being retried
    // on every sign-in for the life of the tab.
    clearIntentId();
    return null;
  }
};

/** What onboarding and the dashboard read: the server's answer, not the tab's. */
export const getPendingIntent = async () => {
  try {
    return await apiGet("/student/me/apply-intent");
  } catch {
    return null;
  }
};
