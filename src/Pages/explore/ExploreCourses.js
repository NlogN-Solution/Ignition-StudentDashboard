import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Compass, Loader2, Search, SlidersHorizontal, X } from "lucide-react";

import EmptyState from "../../components/common/EmptyState";
import { SkeletonCard } from "../../components/common/Skeleton";
import { CourseCard } from "../../components/explore/cards";
import { Card, Chip } from "../../components/explore/primitives";
import { useAppData } from "../../context/AppDataContext";
import { useCourseState } from "../../hooks/useCourseState";
import { getPublicCourseFacets, searchPublicCourses } from "../../api/catalogue";

/**
 * Every course in the catalogue, searched on the server.
 *
 * Rendered as one half of `Explore` — it owns no page chrome of its own, so
 * the Courses/Universities switch above it stays put while this reloads.
 *
 * What this replaces filtered an in-memory array of at most 200 programs
 * loaded from `/student/catalog/programs` — 4% of the catalogue — against a
 * faculty list of five hard-coded values. A student who had just compared six
 * Coventry courses on the public platform signed in and could not find them.
 *
 * Now it reads `/public/courses`, the same endpoint and the same 4,797 rows
 * the marketing site searches, with the same filter keys. A URL copied from
 * one works in the other.
 *
 * **Facets are counted leave-one-out by the backend**: each option's number is
 * what would be left if you clicked it, counted against every *other* filter.
 * That is what makes a count worth showing at all — it says what a click is
 * worth before the click — and it is why an option reading zero is disabled
 * rather than becoming a dead end.
 *
 * Filter state lives in the URL, not in `useState`. A student who opens a
 * course, reads it and presses back should land on their results, not on an
 * empty search.
 */

const PAGE_SIZE = 24;

const SORTS = [
  { value: "title", label: "Name" },
  { value: "university", label: "University" },
  { value: "duration", label: "Duration" },
];

const FILTER_KEYS = ["q", "route", "level", "subject", "university", "placement", "duration"];

/** One collapsible rail of facet options. */
const FacetGroup = ({ title, options, selected, onSelect }) => {
  if (!options?.length) return null;

  return (
    <div className="border-t border-hairline py-4 first:border-t-0 first:pt-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">{title}</p>
      <div className="mt-3 space-y-1">
        {options.map((option) => {
          const isOn = selected === option.value;
          // Zero would take the student to an empty page; the count is there
          // to prevent exactly that, so it disables rather than warns.
          const dead = option.count === 0 && !isOn;

          return (
            <button
              key={option.value}
              type="button"
              disabled={dead}
              onClick={() => onSelect(isOn ? "" : option.value)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                isOn
                  ? "bg-navy-50 font-semibold text-navy-800"
                  : dead
                  ? "cursor-not-allowed text-ink-faint/60"
                  : "text-ink-soft hover:bg-canvas hover:text-navy-900"
              }`}
            >
              <span className="min-w-0 truncate">{option.label ?? option.value}</span>
              <span className="shrink-0 text-xs tabular-nums text-ink-faint">{option.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ExploreCourses = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { saved, toggleSavedCourse } = useAppData();
  // Applied/selected/offer state for every card in the results.
  const courseStateFor = useCourseState();

  const [results, setResults] = useState({ items: [], total: 0 });
  const [facets, setFacets] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // The search box is local so typing does not push a history entry per
  // keystroke; it is committed to the URL on submit.
  const [term, setTerm] = useState(params.get("q") ?? "");
  useEffect(() => setTerm(params.get("q") ?? ""), [params]);

  const filters = useMemo(() => {
    const next = {};
    FILTER_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) next[key] = value;
    });
    return next;
  }, [params]);

  const page = Number(params.get("page") ?? 1);
  const sort = params.get("sort") ?? "title";

  const update = useCallback(
    (changes) => {
      const next = new URLSearchParams(params);
      Object.entries(changes).forEach(([key, value]) => {
        if (!value) next.delete(key);
        else next.set(key, String(value));
      });
      // Any change to what is being searched invalidates the page number —
      // landing on page 7 of 3 results is the classic version of this bug.
      if (!("page" in changes)) next.delete("page");
      setParams(next);
    },
    [params, setParams]
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      searchPublicCourses({ ...filters, sort }, page, PAGE_SIZE),
      getPublicCourseFacets(filters).catch(() => null),
    ])
      .then(([found, counts]) => {
        if (cancelled) return;
        setResults({ items: found?.items ?? [], total: found?.total ?? 0 });
        setFacets(counts);
      })
      .catch(() => {
        if (!cancelled) setError("The catalogue could not be reached. Try again in a moment.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, page, sort]);

  const active = Object.entries(filters).filter(([key]) => key !== "q");
  const lastPage = Math.max(1, Math.ceil(results.total / PAGE_SIZE));

  const rail = (
    <Card className="p-5">
      <FacetGroup
        title="Study route"
        options={facets?.route}
        selected={filters.route}
        onSelect={(value) => update({ route: value })}
      />
      <FacetGroup
        title="Level"
        options={facets?.level}
        selected={filters.level}
        onSelect={(value) => update({ level: value })}
      />
      <FacetGroup
        title="Subject"
        options={facets?.subject}
        selected={filters.subject}
        onSelect={(value) => update({ subject: value })}
      />
      <FacetGroup
        title="Duration"
        options={facets?.duration}
        selected={filters.duration}
        onSelect={(value) => update({ duration: value })}
      />
      <FacetGroup
        title="University"
        options={facets?.university?.slice(0, 20)}
        selected={filters.university}
        onSelect={(value) => update({ university: value })}
      />
    </Card>
  );

  return (
    <>
      <div>
        <form
          data-tour="course-search"
          className="mt-6 flex flex-wrap items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            update({ q: term.trim() });
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search 4,800 courses by title or university"
              className="w-full rounded-lg border border-hairline bg-white py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
          >
            Search
          </button>

          <button
            type="button"
            onClick={() => setShowFilters((open) => !open)}
            className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-ring-idle lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {active.length > 0 && (
              <span className="rounded-full bg-navy-900 px-1.5 text-xs text-white">
                {active.length}
              </span>
            )}
          </button>

          <select
            value={sort}
            onChange={(event) => update({ sort: event.target.value })}
            className="rounded-lg border border-hairline bg-white px-3 py-2.5 text-sm font-medium text-ink-soft focus:border-navy-900 focus:outline-none"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                Sort by {option.label.toLowerCase()}
              </option>
            ))}
          </select>
        </form>

        {(active.length > 0 || filters.q) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {filters.q && (
              <button type="button" onClick={() => update({ q: "" })}>
                <Chip tone="navy">
                  “{filters.q}” <X className="h-3 w-3" />
                </Chip>
              </button>
            )}
            {active.map(([key, value]) => (
              <button key={key} type="button" onClick={() => update({ [key]: "" })}>
                <Chip tone="navy">
                  {value} <X className="h-3 w-3" />
                </Chip>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setParams(new URLSearchParams())}
              className="text-xs font-semibold text-navy-900 hover:text-navy-900"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className={`${showFilters ? "block" : "hidden"} lg:block`}>{rail}</div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-ink-muted">
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Searching…
                  </span>
                ) : (
                  `${results.total.toLocaleString()} ${
                    results.total === 1 ? "course" : "courses"
                  }`
                )}
              </p>
            </div>

            {error ? (
              <EmptyState icon={Compass} title="Catalogue unavailable" description={error} />
            ) : isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((unused, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : results.items.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Nothing matches these filters"
                description="Try removing one — the counts beside each option show what would be left."
              />
            ) : (
              <>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {results.items.map((course) => (
                    <li key={course.slug}>
                      <CourseCard
                        course={course}
                        // Same state and the same Apply route as the feed, so
                        // a course looks and behaves identically whichever tab
                        // the student found it in.
                        state={courseStateFor(course.id)}
                        saved={saved.courseIds.includes(course.id)}
                        onToggleSave={() => toggleSavedCourse(course.id)}
                        onApply={(item) => navigate(`/apply/${item.slug}`)}
                      />
                    </li>
                  ))}
                </ul>

                {lastPage > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => update({ page: page - 1 })}
                      className="rounded-lg border border-hairline bg-white px-4 py-2 text-sm font-semibold text-ink-soft disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-medium text-ink-muted">
                      Page {page} of {lastPage.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      disabled={page >= lastPage}
                      onClick={() => update({ page: page + 1 })}
                      className="rounded-lg border border-hairline bg-white px-4 py-2 text-sm font-semibold text-ink-soft disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ExploreCourses;
