import React, { useEffect, useMemo, useState } from "react";
import { Compass, Search, X } from "lucide-react";

import EmptyState from "../../components/common/EmptyState";
import { SkeletonCard } from "../../components/common/Skeleton";
import { UniversityCard } from "../../components/explore/cards";
import { Chip } from "../../components/explore/primitives";
import { useAppData } from "../../context/AppDataContext";
import { getPublicUniversities } from "../../api/catalogue";

/**
 * The 44 institutions Ignition works with.
 *
 * Rendered as one half of `Explore` — it owns no page chrome of its own, so
 * the Courses/Universities switch above it stays put while this reloads.
 *
 * Filtered client-side, deliberately and unlike the course explorer: there are
 * 44 records and the backend serves them in one unpaginated call, so a round
 * trip per keystroke would only add latency to a set that fits in memory ten
 * times over. The 4,797 courses are the opposite case, which is why that
 * screen filters on the server.
 */

const ExploreUniversities = () => {
  const { saved, toggleSavedUniversity } = useAppData();

  const [universities, setUniversities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [term, setTerm] = useState("");
  const [region, setRegion] = useState("");
  const [subject, setSubject] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPublicUniversities()
      .then((items) => {
        if (!cancelled) setUniversities(items);
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
  }, []);

  // Both facet lists come from the records themselves rather than a constant,
  // so a region or subject that leaves the catalogue leaves the filter too.
  const regions = useMemo(
    () => [...new Set(universities.map((item) => item.region).filter(Boolean))].sort(),
    [universities]
  );
  const subjects = useMemo(
    () => [...new Set(universities.flatMap((item) => item.subjects ?? []))].sort(),
    [universities]
  );

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return universities.filter((item) => {
      if (region && item.region !== region) return false;
      if (subject && !(item.subjects ?? []).includes(subject)) return false;
      if (!needle) return true;
      return (
        item.name.toLowerCase().includes(needle) ||
        (item.city ?? "").toLowerCase().includes(needle) ||
        (item.tagline ?? "").toLowerCase().includes(needle)
      );
    });
  }, [universities, term, region, subject]);

  const filtered = Boolean(term || region || subject);

  return (
    <>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search by name or city"
              className="w-full rounded-lg border border-hairline bg-white py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-blue-link focus:outline-none focus:ring-2 focus:ring-blue-link/20"
            />
          </div>

          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="rounded-lg border border-hairline bg-white px-3 py-2.5 text-sm font-medium text-ink-soft focus:border-blue-link focus:outline-none"
          >
            <option value="">All regions</option>
            {regions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="rounded-lg border border-hairline bg-white px-3 py-2.5 text-sm font-medium text-ink-soft focus:border-blue-link focus:outline-none"
          >
            <option value="">All subjects</option>
            {subjects.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {filtered && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {region && (
              <button type="button" onClick={() => setRegion("")}>
                <Chip tone="navy">
                  {region} <X className="h-3 w-3" />
                </Chip>
              </button>
            )}
            {subject && (
              <button type="button" onClick={() => setSubject("")}>
                <Chip tone="navy">
                  {subject} <X className="h-3 w-3" />
                </Chip>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setTerm("");
                setRegion("");
                setSubject("");
              }}
              className="text-xs font-semibold text-blue-link hover:text-navy-900"
            >
              Clear all
            </button>
          </div>
        )}

        <p className="mb-4 mt-6 text-sm font-medium text-ink-muted">
          {isLoading
            ? "Loading…"
            : `${visible.length} ${visible.length === 1 ? "university" : "universities"}`}
        </p>

        {error ? (
          <EmptyState icon={Compass} title="Catalogue unavailable" description={error} />
        ) : isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((unused, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nothing matches these filters"
            description="Try clearing one of them."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((university) => (
              <li key={university.slug}>
                <UniversityCard
                  university={university}
                  saved={saved.universityIds.includes(university.id)}
                  onToggleSave={() => toggleSavedUniversity(university.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default ExploreUniversities;
