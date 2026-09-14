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

/* ------------------------------------------------------------ universities --- */

/** All 44, unpaginated — the backend serves them in one call and so do we. */
export const getPublicUniversities = async () => {
  const data = await apiGet("/public/universities", PUBLIC);
  return data?.items ?? [];
};

export const getPublicUniversity = (slug) =>
  apiGet(`/public/universities/${encodeURIComponent(slug)}`, PUBLIC);

/* ----------------------------------------------------------------- courses --- */

/**
 * The explorer's result set.
 *
 * Server-side, not client-side: there are 4,797 offerings and the old portal
 * screen filtered an in-memory array of 200. Parameter names mirror the public
 * site's filter keys exactly, so a URL copied from one works in the other.
 */
export const searchPublicCourses = (filters = {}, page = 1, limit = 24) =>
  apiGet(
    `/public/courses${query({
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
    })}`,
    PUBLIC
  );

/**
 * What each filter option would leave if it were clicked.
 *
 * Counted leave-one-out by the backend, so an option shows what the click is
 * worth *before* the click — and one that would land on zero can be disabled
 * rather than becoming a dead end.
 */
export const getPublicCourseFacets = (filters = {}) =>
  apiGet(
    `/public/courses/facets${query({
      q: filters.q,
      route: filters.route,
      level: filters.level,
      subject: filters.subject,
      university: filters.university,
      placement: filters.placement,
      duration: filters.duration,
    })}`,
    PUBLIC
  );

export const getPublicCourse = (slug) =>
  apiGet(`/public/courses/${encodeURIComponent(slug)}`, PUBLIC);

/* ------------------------------------------------------------ scholarships --- */

export const getPublicScholarships = async (params = {}) => {
  const data = await apiGet(`/public/scholarships${query({ limit: 50, ...params })}`, PUBLIC);
  return data?.items ?? [];
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
export const getPublicTaxonomies = () => apiGet("/public/taxonomies", PUBLIC);

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
