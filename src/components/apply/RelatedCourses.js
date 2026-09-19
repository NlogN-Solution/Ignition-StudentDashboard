import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Plus } from "lucide-react";

import { getSimilarCourses } from "../../api/explore";

/**
 * "You may also be interested in", under the course being applied for.
 *
 * Deliberately secondary. The originally selected course stays the primary
 * intent and this never competes with it — no big cards, no Apply buttons of
 * equal weight, no reordering. A student who has just decided is being offered
 * the option of adding, not being asked to decide again.
 *
 * Same subject and level, from the catalogue. Renders nothing when there is
 * nothing genuinely comparable, rather than padding the list out with whatever
 * else exists.
 */
const RelatedCourses = ({ programId, heading = "You may also be interested in" }) => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    let cancelled = false;
    if (!programId) return undefined;
    getSimilarCourses(programId).then((items) => {
      if (!cancelled) setCourses(items.slice(0, 4));
    });
    return () => {
      cancelled = true;
    };
  }, [programId]);

  if (courses.length === 0) return null;

  return (
    <section className="rounded-xl border border-hairline bg-white p-5">
      <h2 className="text-base font-bold tracking-tight text-navy-900">{heading}</h2>
      <p className="mt-1 text-[13.5px] font-medium leading-[1.55] text-ink-muted">
        Same subject and level. Applying for more than one is normal — your counsellor works them
        together.
      </p>

      <ul className="mt-4 divide-y divide-hairline">
        {courses.map((course) => (
          <li key={course.slug} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <Link
                to={`/explore/courses/${course.slug}`}
                className="text-[14.5px] font-semibold text-navy-900 transition-colors hover:text-navy-900"
              >
                {course.title}
              </Link>
              {course.university?.name ? (
                <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-ink-muted">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
                  {course.university.name}
                </p>
              ) : null}
            </div>
            <Link
              to={`/apply/${course.slug}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-ring-idle bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:border-nav/40 hover:bg-navy-50 hover:text-navy-900"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add this course
            </Link>
          </li>
        ))}
      </ul>

      <Link
        to="/explore"
        className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-bold text-navy-900 transition-colors hover:text-navy-900"
      >
        Explore more courses
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </section>
  );
};

export default RelatedCourses;
