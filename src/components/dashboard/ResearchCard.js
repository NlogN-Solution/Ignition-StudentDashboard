import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, GraduationCap, Building2, Sparkles } from "lucide-react";
import { fetchMyResearch } from "../../api/students";

/**
 * "Your research came with you."
 *
 * Shows a student what they carried over from the public Ignition site, so
 * signing in reads as continuing a journey rather than starting a new one. It
 * is the dashboard's answer to the promise the public site made when it asked
 * for an account.
 *
 * Deliberately careful about what it claims. These are things the student was
 * *looking at* — not applications, and not something an admissions office has
 * seen. What changed with the catalogue import is that they are now real
 * institutions: the public site and this backend share one catalogue, so the
 * slugs the browser carried across resolve to catalogue rows, and the card
 * fetches the names rather than printing what was in a URL.
 *
 * `GET /student/me/research` returns `catalogue: "example"` for a handoff
 * minted before the import. Those ids name institutions that never existed, so
 * nothing is resolved and the card falls back to whatever labels travelled
 * with the payload.
 */

const Row = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
      <Icon className="h-4 w-4 text-blue-600" />
    </span>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-1 text-sm text-gray-800">{children}</div>
    </div>
  </div>
);

const ResearchCard = ({ research }) => {
  const [resolved, setResolved] = useState([]);

  useEffect(() => {
    if (!research) return;
    let live = true;
    fetchMyResearch()
      .then((data) => {
        if (live) setResolved(data?.universities ?? []);
      })
      // A shortlist that will not load is not worth an error on a dashboard —
      // the rest of the card is already on the page from the profile.
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [research]);

  if (!research) return null;

  const { career, courses = [], budget } = research;
  // Resolved names when the catalogue has them, the labels that travelled with
  // the payload otherwise.
  const universities = resolved.length
    ? resolved.map((entry) => ({ id: entry.slug, name: entry.name, city: entry.city }))
    : research.universities ?? [];

  if (!career && !courses.length && !universities.length) return null;

  return (
    <div className="mb-6 rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Your research came with you
          </h2>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          From Ignition
        </span>
      </div>

      <p className="mt-2 text-sm text-gray-600">
        What you explored before you had an account. Nothing here is an application
        yet — tell your advisor which of these you want to pursue and they will
        open the applications with you.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
        {career && (
          <Row icon={Compass} label="Career goal">
            <p className="font-medium">{career.title}</p>
            {typeof career.match === "number" && (
              <p className="mt-0.5 text-xs text-gray-500">
                {career.match}% match on your career quiz
              </p>
            )}
          </Row>
        )}

        {courses.length > 0 && (
          <Row icon={GraduationCap} label={`Courses saved (${courses.length})`}>
            <ul className="space-y-0.5">
              {courses.slice(0, 3).map((course) => (
                <li key={course.id ?? course.title} className="font-medium">
                  {course.title}
                  {course.qualification ? (
                    <span className="font-normal text-gray-500"> · {course.qualification}</span>
                  ) : null}
                </li>
              ))}
            </ul>
            {courses.length > 3 && (
              <p className="mt-0.5 text-xs text-gray-500">
                and {courses.length - 3} more
              </p>
            )}
          </Row>
        )}

        {universities.length > 0 && (
          <Row icon={Building2} label={`Universities shortlisted (${universities.length})`}>
            <ul className="space-y-0.5">
              {universities.slice(0, 3).map((university) => (
                <li key={university.id ?? university.name} className="font-medium">
                  {university.name}
                  {university.city ? (
                    <span className="font-normal text-gray-500"> · {university.city}</span>
                  ) : null}
                </li>
              ))}
            </ul>
            {universities.length > 3 && (
              <p className="mt-0.5 text-xs text-gray-500">
                and {universities.length - 3} more
              </p>
            )}
          </Row>
        )}
      </div>

      {budget?.monthlyLiving ? (
        <p className="mt-5 border-t border-gray-100 pt-4 text-sm text-gray-600">
          You budgeted around{" "}
          <span className="font-semibold text-gray-900">
            £{budget.monthlyLiving.toLocaleString()}
          </span>{" "}
          a month for living costs
          {budget.annualTuition ? (
            <>
              , with tuition around{" "}
              <span className="font-semibold text-gray-900">
                £{budget.annualTuition.toLocaleString()}
              </span>{" "}
              a year
            </>
          ) : null}
          . Your advisor can sanity-check that against the courses you apply to.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to="/explore"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Browse the Ignition catalogue
        </Link>
        <Link
          to="/messages"
          className="inline-flex items-center rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Talk to my advisor
        </Link>
      </div>
    </div>
  );
};

export default ResearchCard;
