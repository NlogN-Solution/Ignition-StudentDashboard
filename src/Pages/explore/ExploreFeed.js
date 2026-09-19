import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Compass, Sparkles } from "lucide-react";

import EmptyState from "../../components/common/EmptyState";
import { SkeletonCard } from "../../components/common/Skeleton";
import { CourseCard } from "../../components/explore/cards";
import { useAppData } from "../../context/AppDataContext";
import { useCourseState } from "../../hooks/useCourseState";
import { getExploreFeed } from "../../api/explore";
import { getPendingIntent } from "../../lib/applyIntent";

/**
 * Explore, as a feed rather than a wall.
 *
 * ## What this replaces
 *
 * One grid of ~4,800 identical cards behind a filter rail. Everything the
 * catalogue knew about the student — the course they pressed Apply on, the
 * three they saved, the subject they told onboarding — was known and unused,
 * so every student saw the same alphabetical page and had to construct their
 * own query to get anywhere. The search is still there and unchanged (the
 * Search tab); this is the answer for a student who has not got a query yet.
 *
 * ## Rows, not a grid
 *
 * Each section is one horizontally scrollable row with a title and a *reason*.
 * The reason is the load-bearing part: a feed whose sections cannot say why
 * they exist is a randomiser, and the sections come from the server precisely
 * so the sentence sits beside the query that justifies it. See
 * `RecommendationService`.
 *
 * Horizontal rows are used because the question a student asks here is "what
 * else is like this" — a comparison across a handful of options, which a row
 * suits and a grid buries. Rows scroll with real overflow and snap points, so
 * a trackpad, a touchscreen and the arrow buttons all work, and the buttons
 * hide entirely when there is nothing to scroll to.
 *
 * ## Apply is unchanged
 *
 * The card's Apply button goes to `/apply/:slug`, the same flow the public
 * site and the course page use. Nothing about applying was redesigned — only
 * the discovery around it.
 */

const Row = ({ section, courseStateFor, saved, onToggleSave, onApply }) => {
  const scroller = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = () => {
    const node = scroller.current;
    if (!node) return;
    const { scrollLeft, scrollWidth, clientWidth } = node;
    setEdges({
      start: scrollLeft <= 2,
      // 2px of slack: sub-pixel widths mean scrollLeft rarely lands exactly on
      // the maximum, and a button that never disables looks broken.
      end: scrollLeft + clientWidth >= scrollWidth - 2,
    });
  };

  useEffect(() => {
    measure();
  }, [section.items]);

  const nudge = (direction) => {
    const node = scroller.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.max(280, node.clientWidth * 0.8), behavior: "smooth" });
  };

  const scrollable = section.items.length > 1;

  return (
    <section className="mt-9 first:mt-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[19px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900">
            {section.title}
          </h2>
          {/* The "why am I seeing this" line. Every section has one. */}
          <p className="mt-1 text-[14px] font-medium leading-[1.5] text-ink-muted">{section.reason}</p>
        </div>

        {scrollable && (
          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
            <button
              type="button"
              onClick={() => nudge(-1)}
              disabled={edges.start}
              aria-label={`Scroll ${section.title} left`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-ring-idle bg-white text-ink-soft transition-colors hover:border-nav/40 hover:bg-navy-50 hover:text-navy-900 disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => nudge(1)}
              disabled={edges.end}
              aria-label={`Scroll ${section.title} right`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-ring-idle bg-white text-ink-soft transition-colors hover:border-nav/40 hover:bg-navy-50 hover:text-navy-900 disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}
      </div>

      {/* `-mx-*`/`px-*` so the first and last card can sit flush with the page
          gutter while the row itself still scrolls edge to edge. */}
      <ul
        ref={scroller}
        onScroll={measure}
        className="mt-4 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-1 sm:px-1"
      >
        {section.items.map((course) => (
          <li
            key={`${section.key}-${course.slug}`}
            className="w-[290px] shrink-0 snap-start sm:w-[320px]"
          >
            <CourseCard
              course={course}
              state={courseStateFor(course.id)}
              saved={saved.courseIds.includes(course.id)}
              onToggleSave={() => onToggleSave(course.id)}
              onApply={onApply}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};

const ExploreFeed = () => {
  const navigate = useNavigate();
  const { saved, toggleSavedCourse } = useAppData();
  const [sections, setSections] = useState([]);
  const [intent, setIntent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getExploreFeed().catch(() => []), getPendingIntent()])
      .then(([nextSections, nextIntent]) => {
        if (cancelled) return;
        setSections(nextSections);
        setIntent(nextIntent);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const courseStateFor = useCourseState(intent?.course?.program_id ?? null);
  const handleApply = (course) => navigate(`/apply/${course.slug}`);

  const total = useMemo(
    () => sections.reduce((count, section) => count + section.items.length, 0),
    [sections]
  );

  if (isLoading) {
    return (
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="mt-6">
        <EmptyState
          icon={Compass}
          title="Nothing to show here yet"
          description="Search the catalogue and save a few courses — this page starts to fit you as soon as it has something to go on."
        />
      </div>
    );
  }

  return (
    <div className="mt-2">
      {sections.map((section) => (
        <Row
          key={section.key}
          section={section}
          courseStateFor={courseStateFor}
          saved={saved}
          onToggleSave={toggleSavedCourse}
          onApply={handleApply}
        />
      ))}
    </div>
  );
};

export default ExploreFeed;
