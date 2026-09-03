// Receives the research a student did on the public Ignition site before they
// had an account.
//
// The public platform (Ignition-Landing) keeps an anonymous student's career
// quiz result, saved courses, shortlisted universities, comparison and budget
// in localStorage. That storage belongs to a different origin, so it cannot be
// read from here — the landing site hands it over explicitly, in the URL
// fragment of the link that brought the student to /login or /registration.
//
// The fragment (not the query string) is deliberate on the sending side: it is
// never transmitted to a server, so a shortlist stays out of access logs and
// referrer headers. This module reads it once and strips it from the address
// bar immediately.
//
// Nothing here is trusted. The payload is whatever was in a URL, so it is
// validated field by field, clamped, and stored as research on the student's
// profile. It never becomes an application — only a counsellor opens one of
// those (backend/app/routes/application.py).
//
// Two payload versions are in circulation and the difference matters:
//
//   v2  Ids are the shared catalogue's slugs. `universities.slug` on the
//       backend is the same string, so the shortlist resolves to real rows
//       and a counsellor can act on it.
//   v1  Minted before the catalogue import, when the public site ran on six
//       invented institutions. The ids look identical in shape and mean
//       nothing here. Still accepted — the career goal, the stage and the
//       budget in a v1 payload are as true as they ever were — but stamped
//       so that nothing downstream tries to resolve them.
//
// The stamp travels as `research.catalogue`, and the backend's resolver
// (`student_profile_service.research_shortlist`) refuses to look up anything
// that is not "live". A v1 slug colliding with a real one would otherwise
// attach a student to an institution they never looked at.

const PARAM = "ignition-research";
const PENDING_KEY = "ignition_pending_research";

/** Payload versions this build understands, newest first. */
const VERSIONS = { 2: "live", 1: "example" };

// Matches the sender's cap. A hostile URL is not going to be polite about it.
const MAX_ITEMS = 12;
const MAX_TEXT = 160;

const text = (value) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, MAX_TEXT) : null;

const percent = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : null;

const money = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null;

const career = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const title = text(raw.title);
  if (!title) return null;
  return { id: text(raw.id), title, match: percent(raw.match) };
};

const list = (raw, map) =>
  Array.isArray(raw) ? raw.slice(0, MAX_ITEMS).map(map).filter(Boolean) : [];

const course = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const title = text(raw.title);
  if (!title) return null;
  return {
    id: text(raw.id),
    title,
    qualification: text(raw.qualification),
    subject: text(raw.subject),
  };
};

const university = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const name = text(raw.name);
  if (!name) return null;
  return { id: text(raw.id), name, city: text(raw.city) };
};

/** base64url → object, or null for anything that is not a payload we know. */
const decode = (encoded) => {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    const catalogue = parsed && VERSIONS[parsed.v];
    if (!catalogue) return null;

    const handoff = {
      catalogue,
      at: text(parsed.at),
      stage: text(parsed.stage),
      career: career(parsed.career),
      alsoMatched: list(parsed.alsoMatched, career).slice(0, 3),
      courses: list(parsed.courses, course),
      universities: list(parsed.universities, university),
      compared: list(parsed.compared, text),
      budget:
        parsed.budget && typeof parsed.budget === "object"
          ? {
              annualTuition: money(parsed.budget.annualTuition),
              monthlyLiving: money(parsed.budget.monthlyLiving),
              currency: "GBP",
            }
          : null,
    };

    const empty =
      !handoff.career &&
      !handoff.courses.length &&
      !handoff.universities.length &&
      !handoff.compared.length &&
      !handoff.budget;

    return empty ? null : handoff;
  } catch {
    return null;
  }
};

/**
 * Called once at app start, before anything renders.
 *
 * Held in sessionStorage rather than memory because the student still has to
 * get through registration or login — possibly navigating between the two, and
 * possibly reloading — before there is an account to attach it to. It is
 * cleared as soon as it is applied, and dies with the tab either way.
 */
export const captureIncomingHandoff = () => {
  if (typeof window === "undefined") return;

  const hash = window.location.hash;
  if (!hash || !hash.includes(`${PARAM}=`)) return;

  const encoded = new URLSearchParams(hash.replace(/^#/, "")).get(PARAM);

  // Strip it whether or not it parsed — a student should never be looking at
  // their own shortlist in the address bar, and a bad payload must not be
  // retried on every reload.
  window.history.replaceState(null, "", window.location.pathname + window.location.search);

  const handoff = encoded ? decode(encoded) : null;
  if (!handoff) return;

  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(handoff));
  } catch {
    /* Private browsing or a full quota — the research is simply not carried. */
  }
};

/** Returns the pending handoff without consuming it. */
export const peekPendingHandoff = () => {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** Returns the pending handoff and clears it, so it is applied exactly once. */
export const consumePendingHandoff = () => {
  const handoff = peekPendingHandoff();
  try {
    window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* Nothing to do — the caller has the value. */
  }
  return handoff;
};

/**
 * One-line summary for the auth screens: "Career goal: X, 3 universities".
 *
 * Counts, not names. This runs before there is an account, so there is no
 * catalogue to resolve slugs against — and printing a raw slug at a student
 * who is deciding whether to trust the site with their email is worse than
 * printing nothing.
 */
export const describeHandoff = (handoff) => {
  if (!handoff) return [];
  const parts = [];
  if (handoff.career) parts.push(`Career goal: ${handoff.career.title}`);
  if (handoff.courses.length) {
    parts.push(`${handoff.courses.length} course${handoff.courses.length === 1 ? "" : "s"}`);
  }

  const shortlisted = handoff.universities.length || handoff.compared.length;
  if (shortlisted) {
    parts.push(`${shortlisted} universit${shortlisted === 1 ? "y" : "ies"}`);
  }
  return parts;
};

/**
 * Folds carried-over research into a student's `preferences` blob.
 *
 * Two rules, and both matter:
 *
 *  - The research is stored whole under `preferences.research`, marked with
 *    where it came from and which catalogue its ids belong to. The ids are
 *    slugs, never UUIDs: `research.universities[].id` joins against
 *    `universities.slug`, not `universities.id`, and only when
 *    `catalogue === "live"`. The backend does that join in one place
 *    (`student_profile_service.research_shortlist`); nothing else should.
 *  - Derived fields are only ever written into a blank. A student who has
 *    already told the portal what they want to study outranks anything
 *    inferred from a page they happened to save.
 */
export const mergeResearchIntoPreferences = (preferences, handoff) => {
  if (!handoff) return preferences;

  const next = {
    ...preferences,
    research: {
      source: "ignition-public",
      // Which catalogue the slugs below belong to. Absent on records written
      // before this stamp existed, and the resolver reads a missing value as
      // "example" — those all predate the import.
      catalogue: handoff.catalogue ?? "example",
      importedAt: new Date().toISOString(),
      researchedAt: handoff.at ?? null,
      stage: handoff.stage ?? null,
      career: handoff.career ?? null,
      alsoMatched: handoff.alsoMatched ?? [],
      courses: handoff.courses ?? [],
      universities: handoff.universities ?? [],
      compared: handoff.compared ?? [],
      budget: handoff.budget ?? null,
    },
  };

  if (!next.intendedStudyArea && handoff.courses?.length) {
    next.intendedStudyArea = handoff.courses[0].title;
  }
  // The public platform is UK-only, so a student arriving from it has already
  // said where they want to go by being there at all.
  if (!next.destinations) next.destinations = "United Kingdom";

  return next;
};
