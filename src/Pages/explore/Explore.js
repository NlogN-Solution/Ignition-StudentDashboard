import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GraduationCap, Heart, Search, Sparkles } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import ExploreCourses from "./ExploreCourses";
import ExploreFeed from "./ExploreFeed";
import ExploreUniversities from "./ExploreUniversities";
import { useAppData } from "../../context/AppDataContext";

/**
 * One Explore screen, two things to explore.
 *
 * Courses and universities were two sidebar entries and two pages, and that
 * was the wrong shape for the question a student is actually asking. "Where
 * could I study?" and "what could I study?" are two ways into the same
 * catalogue, usually asked in the same sitting and often switched between
 * mid-thought — and splitting them across two nav items made the switch a
 * navigation, put two nearly identical page headers in the product, and made
 * the sidebar longer for no gain.
 *
 * The switch is the only chrome that stays fixed; each half owns its own
 * filters, its own results and nothing else.
 *
 * **`view` lives in the URL** rather than in state. A student who opens a
 * course from here, reads it and presses back must land on the half they were
 * looking at, with the filters they had set — and both halves already keep
 * their filters in the query string, so the mode belongs beside them.
 */

const VIEWS = [
  {
    // The default. A student arriving at Explore usually has a direction
    // rather than a query — "something in computing, in the north" — and the
    // feed answers that, where a search box asks them to construct it. The
    // full catalogue search is one tab away and unchanged.
    id: "for-you",
    label: "For you",
    icon: Sparkles,
    title: "Explore courses",
    description:
      "Programmes picked out for your subject, your level and what you have already looked at. Every row says why it is there.",
  },
  {
    id: "courses",
    label: "Search all",
    icon: Search,
    title: "Search every course",
    description:
      "Every course Ignition works with, searched across all of them. Shortlist what you like — your counsellor sees it straight away.",
  },
  {
    id: "universities",
    label: "Universities",
    icon: GraduationCap,
    title: "Explore universities",
    description:
      "The institutions Ignition works with, and what each of them asks for. Shortlist any of them — your counsellor sees it straight away.",
  },
];

const Explore = () => {
  const [params, setParams] = useSearchParams();
  const { saved } = useAppData();

  const active = VIEWS.find((view) => view.id === params.get("view")) ?? VIEWS[0];
  const shortlisted = saved.courseIds.length + saved.universityIds.length;

  const switchTo = (id) => {
    // A fresh query string, not a merged one: the two halves share no filter
    // keys, so carrying `subject=Computing` from courses into universities
    // would silently apply a filter the student cannot see a control for.
    const next = new URLSearchParams();
    if (id !== VIEWS[0].id) next.set("view", id);
    setParams(next);
  };

  return (
    <div className="pb-12 pt-9">
      <div className="mx-auto max-w-7xl px-4">
        <PageHeader
          icon={active.icon}
          title={active.title}
          description={active.description}
          actions={
            shortlisted > 0 && (
              <Link
                to="/applications"
                className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-white px-4 py-2 text-sm font-semibold text-navy-900 transition-colors hover:border-ring-idle"
              >
                <Heart className="h-4 w-4 text-orange" fill="currentColor" />
                {shortlisted} shortlisted
              </Link>
            )
          }
        />

        <div
          role="tablist"
          aria-label="What to explore"
          className="mt-6 inline-flex gap-1 rounded-xl border border-hairline bg-white p-1 shadow-sm"
        >
          {VIEWS.map((view) => {
            const selected = view.id === active.id;
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => switchTo(view.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                  selected
                    ? "bg-navy-900 text-white shadow-sm"
                    : "text-ink-muted hover:bg-canvas hover:text-navy-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${selected ? "text-white" : "text-ink-faint"}`} />
                {view.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {active.id === "for-you" && <ExploreFeed />}
          {active.id === "courses" && <ExploreCourses />}
          {active.id === "universities" && <ExploreUniversities />}
        </div>
      </div>
    </div>
  );
};

export default Explore;
