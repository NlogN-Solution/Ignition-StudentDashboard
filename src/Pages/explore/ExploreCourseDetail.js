import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Building,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileCheck2,
  Info,
  Layers,
  RefreshCw,
  MapPin,
  PoundSterling,
  Send,
} from "lucide-react";

import EmptyState from "../../components/common/EmptyState";
import { SkeletonList } from "../../components/common/Skeleton";
import DetailTabs from "../../components/explore/DetailTabs";
import { SaveButton, Section } from "../../components/explore/primitives";
import { CourseCard } from "../../components/explore/cards";
import {
  CourseEntryPanel,
  CourseFeesPanel,
  CourseIntakesPanel,
  CourseOverviewPanel,
  CourseUniversityPanel,
} from "../../components/explore/coursePanels";
import { useAppData } from "../../context/AppDataContext";
import { getPublicCourse } from "../../api/catalogue";
import { isNotFoundError } from "../../lib/apiErrors";
import { durationLabel } from "../../lib/catalogue";

/**
 * One course, six questions, no navigation between them.
 *
 * The same six tabs, in the same order, off the same endpoint as the public
 * platform's `/courses/at/[slug]`. That is the whole point: a student
 * researches out there without an account and applies in here, and if the
 * course reads as a different, thinner thing once they sign in, the portal
 * looks like a downgrade for having registered.
 *
 * The screen this replaces read from a static `courses.json` fixture and was
 * reached by passing a course through router state — so it could not be
 * linked to, could not be refreshed, and fell back to "the first course in the
 * file" when the state was missing. This is addressed by slug, like every
 * other catalogue URL in the product.
 */

const icon = { className: "h-4 w-4" };

const ExploreCourseDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { saved, toggleSavedCourse, applications } = useAppData();

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // `"missing"` when the catalogue answered 404, `"unavailable"` when the
  // request failed for any other reason. They are different sentences — see
  // `isNotFoundError`.
  const [failure, setFailure] = useState(null);
  // Bumped by the retry button to re-run the effect without a full reload.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setFailure(null);

    getPublicCourse(slug)
      .then((found) => {
        if (!cancelled) setCourse(found);
      })
      .catch((error) => {
        if (!cancelled) setFailure(isNotFoundError(error) ? "missing" : "unavailable");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
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
          title="We couldn't load this course"
          description="The catalogue didn't answer. The course is almost certainly still there — this is our end."
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

  if (failure === "missing" || !course) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-9">
        <EmptyState
          icon={Info}
          title="Course not found"
          description="It may have been withdrawn from the catalogue since you last looked."
          action={
            <Link
              to="/explore"
              className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Back to courses
            </Link>
          }
        />
      </div>
    );
  }

  const university = course.university;
  const isSaved = saved.courseIds.includes(course.id);
  // An application already open against this course turns the primary action
  // from "apply" into "go and see it" — offering to start a second one is how
  // a student ends up with two files for the same place.
  const applied = applications.find((entry) => entry.courseId === course.id) ?? null;
  const duration = durationLabel(course.duration_years);

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      hint: "What the course is, and what you come out with",
      icon: <Info {...icon} />,
      panel: () => <CourseOverviewPanel course={course} />,
    },
    {
      id: "entry",
      label: "Admission requirements",
      hint: "What you need to get in",
      icon: <FileCheck2 {...icon} />,
      panel: () => <CourseEntryPanel course={course} />,
    },
    {
      id: "intakes",
      label: "Intakes and dates",
      hint: "When it runs, and when to apply by",
      icon: <CalendarClock {...icon} />,
      panel: () => <CourseIntakesPanel course={course} />,
    },
    {
      id: "fees",
      label: "Fees and funding",
      hint: "What it costs, and what could pay for it",
      icon: <PoundSterling {...icon} />,
      panel: () => <CourseFeesPanel course={course} />,
    },
    {
      id: "university",
      label: "The university",
      hint: university ? `About ${university.name}` : "Where you would be studying",
      icon: <Building {...icon} />,
      panel: () => <CourseUniversityPanel course={course} />,
    },
    {
      id: "related",
      label: "Related courses",
      hint: "What else this university teaches in the subject",
      icon: <Layers {...icon} />,
      panel: () => (
        <div className="py-8">
          <div className="max-w-4xl">
            <Section title="Other courses in this subject here">
              {course.related?.length ? (
                <>
                  <p>
                    More {course.subject ? course.subject.toLowerCase() : ""} courses at{" "}
                    {university ? university.name : "this university"}. You have already
                    chosen the place; this is what else it teaches.
                  </p>
                  <ul className="grid gap-4 pt-2 sm:grid-cols-2">
                    {course.related.map((related) => (
                      <li key={related.slug}>
                        <CourseCard
                          course={related}
                          saved={saved.courseIds.includes(related.id)}
                          onToggleSave={() => toggleSavedCourse(related.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <EmptyState
                  icon={Layers}
                  title="Nothing else in this subject here"
                  description={`Nothing else at ${
                    university ? university.name : "this university"
                  } is classified under this subject — which usually means the subject is narrow here rather than that the university is small.`}
                  action={
                    <Link
                      to={`/explore${university ? `?university=${university.slug}` : ""}`}
                      className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Search every course here
                    </Link>
                  }
                />
              )}
            </Section>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-50 pb-12">
      {/* The header carries the identity; the tab bar below it carries the
          question. Same division as the public platform's course page. */}
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
            <div className="min-w-0">
              {course.subject && (
                <p className="text-[11px] font-bold uppercase tracking-wider text-ignite-400">
                  {course.subject}
                </p>
              )}
              <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-white">
                {course.title}
              </h1>

              {university && (
                <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] font-semibold text-white/85">
                  <Building className="h-4 w-4 shrink-0" />
                  <Link
                    to={`/explore/universities/${university.slug}`}
                    className="underline decoration-white/30 underline-offset-4 hover:decoration-white"
                  >
                    {university.name}
                  </Link>
                  {(course.campus || course.university_city) && (
                    <>
                      <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" />
                      <span className="font-medium text-white/70">
                        {course.campus ?? course.university_city}
                      </span>
                    </>
                  )}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {course.qualification && (
                  <HeroChip>{course.qualification}</HeroChip>
                )}
                {course.course_level && (
                  <HeroChip icon={<Layers className="h-3.5 w-3.5" />}>
                    {course.course_level}
                  </HeroChip>
                )}
                {duration && (
                  <HeroChip icon={<Clock className="h-3.5 w-3.5" />}>{duration}</HeroChip>
                )}
                {course.placement && (
                  <HeroChip icon={<Briefcase className="h-3.5 w-3.5" />}>
                    Placement year
                  </HeroChip>
                )}
                {course.intake && (
                  <HeroChip icon={<CalendarClock className="h-3.5 w-3.5" />}>
                    {course.intake}
                  </HeroChip>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-stretch gap-2">
              {/* The primary action on the page. Applying used to be something
                  only a counsellor could start, so a student who had found the
                  course they wanted had nowhere to say so — the catalogue was
                  reading matter attached to a product that could not act on
                  it. */}
              {applied ? (
                <Link
                  to={`/applications/${applied.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-navy-900 transition-colors hover:bg-white/90"
                >
                  <CheckCircle2 className="h-4 w-4 text-orange" />
                  View your application
                </Link>
              ) : (
                <Link
                  to={`/apply/${course.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-ignite-600"
                >
                  <Send className="h-4 w-4" />
                  Apply for this course
                </Link>
              )}

              <SaveButton
                saved={isSaved}
                onToggle={() => toggleSavedCourse(course.id)}
                label="course"
              />
              {isSaved && !applied && (
                <p className="max-w-[15rem] text-xs font-medium leading-relaxed text-white/60">
                  Your counsellor can see this on your file.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <DetailTabs tabs={tabs} label="Course information" />
      </div>
    </div>
  );
};

/** The chip language, restated for the dark header where `Chip` would vanish. */
const HeroChip = ({ icon: leading, children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
    {leading}
    {children}
  </span>
);

export default ExploreCourseDetail;
