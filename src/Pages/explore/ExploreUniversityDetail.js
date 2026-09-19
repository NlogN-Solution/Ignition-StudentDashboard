import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  GraduationCap,
  Heart,
  Info,
  MapPin,
  PoundSterling,
  RefreshCw,
  Route,
  Users,
} from "lucide-react";

import EmptyState from "../../components/common/EmptyState";
import { SkeletonList } from "../../components/common/Skeleton";
import DetailTabs from "../../components/explore/DetailTabs";
import { SaveButton } from "../../components/explore/primitives";
import {
  UniversityAboutPanel,
  UniversityCoursesPanel,
  UniversityFeesPanel,
  UniversityLifePanel,
  UniversityRoutesPanel,
} from "../../components/explore/universityPanels";
import { useAppData } from "../../context/AppDataContext";
import { getPublicUniversity, searchPublicCourses } from "../../api/catalogue";
import { isNotFoundError } from "../../lib/apiErrors";

/**
 * One university, five questions, no navigation between them.
 *
 * Courses sit second, directly after About — the same order the public
 * platform uses, and for the same reason: "do you teach my subject?" is the
 * question that decides whether the other three tabs are worth reading at all.
 *
 * The course list is fetched separately rather than served with the record.
 * Essex alone has 264 offerings and the API caps a page at 100, so bundling
 * them into the university payload would either truncate silently or make
 * every university page pay for a list most visitors never open. A first page
 * of twelve answers "yes, and here is a sample"; the link goes to the explorer
 * for the rest.
 */

const icon = { className: "h-4 w-4" };
const COURSE_PREVIEW = 12;

const ExploreUniversityDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { saved, toggleSavedUniversity, toggleSavedCourse } = useAppData();

  const [university, setUniversity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // `"missing"` when the catalogue answered 404, `"unavailable"` for anything
  // else. See `isNotFoundError` — a failed request is not a withdrawal.
  const [failure, setFailure] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [courses, setCourses] = useState({ items: [], total: 0 });
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setCoursesLoading(true);
    setFailure(null);

    getPublicUniversity(slug)
      .then((found) => {
        if (!cancelled) setUniversity(found);
      })
      .catch((error) => {
        if (!cancelled) setFailure(isNotFoundError(error) ? "missing" : "unavailable");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    searchPublicCourses({ university: slug }, 1, COURSE_PREVIEW)
      .then((found) => {
        if (!cancelled) setCourses({ items: found?.items ?? [], total: found?.total ?? 0 });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCoursesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-9">
        <SkeletonList count={4} />
      </div>
    );
  }

  if (failure === "unavailable") {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-9">
        <EmptyState
          icon={RefreshCw}
          title="We couldn't load this university"
          description="The catalogue didn't answer. The record is almost certainly still there — this is our end."
          action={
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          }
        />
      </div>
    );
  }

  if (failure === "missing" || !university) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-9">
        <EmptyState
          icon={Info}
          title="University not found"
          description="It may have been withdrawn from the catalogue since you last looked."
          action={
            <Link
              to="/explore?view=universities"
              className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Back to universities
            </Link>
          }
        />
      </div>
    );
  }

  const isSaved = saved.universityIds.includes(university.id);

  const tabs = [
    {
      id: "about",
      label: "About",
      hint: "The place and its record",
      icon: <Info {...icon} />,
      panel: () => <UniversityAboutPanel university={university} />,
    },
    {
      id: "courses",
      label: "Courses",
      hint: "Everything this university teaches",
      icon: <GraduationCap {...icon} />,
      panel: () => (
        <UniversityCoursesPanel
          university={university}
          courses={courses.items}
          total={courses.total}
          isLoading={coursesLoading}
          savedIds={saved.courseIds}
          onToggleSave={toggleSavedCourse}
        />
      ),
    },
    {
      id: "entry",
      label: "Entry criteria",
      hint: "What it asks for, route by route",
      icon: <Route {...icon} />,
      panel: () => <UniversityRoutesPanel university={university} />,
    },
    {
      id: "fees",
      label: "Fees and funding",
      hint: "What a year here costs",
      icon: <PoundSterling {...icon} />,
      panel: () => <UniversityFeesPanel university={university} />,
    },
    {
      id: "life",
      label: "Life and support",
      hint: "Campus, support and where it leads",
      icon: <Users {...icon} />,
      panel: () => <UniversityLifePanel university={university} />,
    },
  ];

  return (
    <div className="bg-gray-50 pb-12">
      <div className="border-b border-hairline bg-navy-900 px-4 pb-8 pt-9 lg:px-6">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg font-bold text-white">
                {university.monogram ?? university.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-white">
                  {university.name}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] font-medium text-white/75">
                  {university.city && (
                    <>
                      <MapPin className="h-4 w-4 shrink-0" />
                      {university.city}
                    </>
                  )}
                  {university.region && <span className="text-white/50">· {university.region}</span>}
                  {courses.total > 0 && (
                    <span className="text-white/50">
                      · {courses.total.toLocaleString()} courses
                    </span>
                  )}
                </p>
                {university.tagline && (
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/85">
                    {university.tagline}
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <SaveButton
                saved={isSaved}
                onToggle={() => toggleSavedUniversity(university.id)}
                label="university"
              />
              {isSaved && (
                <p className="mt-2 flex max-w-[15rem] items-start gap-1.5 text-xs font-medium leading-relaxed text-white/60">
                  <Heart className="mt-0.5 h-3 w-3 shrink-0" fill="currentColor" />
                  Your counsellor can see this on your file.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <DetailTabs tabs={tabs} label="University information" />
      </div>
    </div>
  );
};

export default ExploreUniversityDetail;
