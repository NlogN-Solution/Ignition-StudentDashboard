// The public catalogue, read by the portal.
//
// **Why the portal reads a public endpoint.** There is one catalogue — 44
// universities and ~4,800 offerings in `universities` / `programs` — and until
// now the portal saw a different, smaller view of it: `/student/catalog/programs`
// capped at 200 rows and mapped through a thinner shape than the marketing
// site's. So a student who shortlisted a course on the public platform signed
// in and found a catalogue that could not show it to them, described in fewer
// words. Reading `/public/*` here is what makes the two the same product.
//
// These routes are unauthenticated by design (see backend/app/routes/public.py):
// they serve only `is_published` rows and clamp `limit`. `skipAuth` is passed
// so a student whose access token has expired still gets the catalogue while
// the refresh happens elsewhere — browsing is not a privileged act.
//
// Ids: every payload carries the catalogue row's UUID alongside its slug. The
// slug is what the URL and the public site speak; the UUID is what
// `/student/me/saved/*` and an application are keyed by. Both are needed, which
// is why both are here.

import { apiGet } from "./client";

const PUBLIC = { skipAuth: true };

const query = (params) => {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
};

/* ------------------------------------------------------------------ cache --- */

/**
 * A tiny read-through cache in front of the catalogue.
 *
 * The portal is a single-page app with no query library, so every screen that
 * wanted a university or a course list fetched it on mount, every time. Opening
 * Explore, clicking a course, pressing Back and clicking the next one made four
 * requests for two facts — and against the catalogue those requests are not
 * cheap. The API now caches its own public responses in Redis
 * (`backend/app/core/public_cache.py`), which fixed the cost per request; this
 * fixes the number of them.
 *
 * Two things, both small:
 *
 *   - **In-flight requests are shared.** The entry holds the promise, not the
 *     value, so three components mounting together make one request. This is
 *     what the university page needed most: it fetches the institution and its
 *     first page of courses side by side, and the explorer behind it had
 *     usually just fetched the same list.
 *   - **Answers are held for `TTL_MS`.** Long enough to cover a browse, short
 *     enough that a published correction reaches a tab someone left open.
 *
 * Deliberately memory-only. `sessionStorage` would survive a reload, but the
 * catalogue is megabytes in aggregate, quota failures are silent and per
 * browser, and a reload is exactly the moment a student is entitled to fresh
 * data. Nothing here is ever written to — it is read-only public data, so a
 * stale entry can be wrong but never someone else's.
 *
 * A rejected request is evicted immediately: a 500 must not be remembered for
 * five minutes, or the "Try again" button on the detail screens would be a lie.
 */
const TTL_MS = 5 * 60 * 1000;

const cache = new Map();

const cached = (key, load) => {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.promise;

  const promise = load().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { promise, expires: Date.now() + TTL_MS });
  return promise;
};

/** Drop everything. Exported for a future "refresh the catalogue" control and
 * used by tests; nothing calls it on the hot path. */
export const clearCatalogueCache = () => cache.clear();

/* ------------------------------------------------------------ universities --- */

/** All 44, unpaginated — the backend serves them in one call and so do we. */
export const getPublicUniversities = () =>
  cached("universities", async () => {
    const data = await apiGet("/public/universities", PUBLIC);
    return data?.items ?? [];
  });

export const getPublicUniversity = (slug) =>
  cached(`university:${slug}`, () =>
    apiGet(`/public/universities/${encodeURIComponent(slug)}`, PUBLIC),
  );

/* ----------------------------------------------------------------- courses --- */

/**
 * The explorer's result set.
 *
 * Server-side, not client-side: there are 4,797 offerings and the old portal
 * screen filtered an in-memory array of 200. Parameter names mirror the public
 * site's filter keys exactly, so a URL copied from one works in the other.
 */
export const searchPublicCourses = (filters = {}, page = 1, limit = 24) => {
  const path = `/public/courses${query({
    q: filters.q,
    route: filters.route,
    level: filters.level,
    subject: filters.subject,
    university: filters.university,
    placement: filters.placement,
    duration: filters.duration,
    sort: filters.sort,
    page,
    limit,
  })}`;
  return cached(path, () => apiGet(path, PUBLIC));
};

/**
 * What each filter option would leave if it were clicked.
 *
 * Counted leave-one-out by the backend, so an option shows what the click is
 * worth *before* the click — and one that would land on zero can be disabled
 * rather than becoming a dead end.
 */
export const getPublicCourseFacets = (filters = {}) => {
  const path = `/public/courses/facets${query({
    q: filters.q,
    route: filters.route,
    level: filters.level,
    subject: filters.subject,
    university: filters.university,
    placement: filters.placement,
    duration: filters.duration,
  })}`;
  return cached(path, () => apiGet(path, PUBLIC));
};

export const getPublicCourse = (slug) =>
  cached(`course:${slug}`, () =>
    apiGet(`/public/courses/${encodeURIComponent(slug)}`, PUBLIC),
  );

/* ------------------------------------------------------------ scholarships --- */

export const getPublicScholarships = (params = {}) => {
  const path = `/public/scholarships${query({ limit: 50, ...params })}`;
  return cached(path, async () => {
    const data = await apiGet(path, PUBLIC);
    return data?.items ?? [];
  });
};

/* ------------------------------------------------------------- taxonomies --- */

/**
 * The controlled vocabularies — the same ten subjects and five course levels
 * the public site's facets are built from.
 *
 * The wizard's "Preferred course" dropdown reads this rather than a local list.
 * It used to offer three options ("Computer Science", "Business Administration",
 * "Engineering") that matched nothing in the catalogue, so a student's stated
 * preference could not be joined to a course they might apply for, and research
 * carried over from the public site never prefilled.
 */
export const getPublicTaxonomies = () =>
  cached("taxonomies", () => apiGet("/public/taxonomies", PUBLIC));

/** What the API returns when it is unreachable. Kept in step with `CourseSubject`. */
export const FALLBACK_SUBJECTS = [
  "Computing",
  "Engineering",
  "Health",
  "Sciences",
  "Business",
  "Law",
  "Arts & Design",
  "Social Sciences",
  "Education",
  "Humanities",
];

export const FALLBACK_COURSE_LEVELS = [
  "Foundation",
  "Undergraduate",
  "Top-Up",
  "Integrated Masters",
  "Postgraduate",
];
