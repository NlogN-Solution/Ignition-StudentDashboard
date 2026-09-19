import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, GraduationCap, Building2, Sparkles } from "lucide-react";
import { fetchMyResearch } from "../../api/students";
import { Card, buttonClass } from "./ui";

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
    <span
      aria-hidden
      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50"
    >
      <Icon className="h-4 w-4 text-navy-900" />
    </span>
    <div className="min-w-0">
      <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink-faint">{label}</p>
      <div className="mt-1.5 text-[15px] leading-[1.5] text-ink-soft">{children}</div>
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
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-navy-900" aria-hidden />
          <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-navy-900">
            Your research came with you
          </h2>
        </div>
        <span className="rounded-full border border-navy-200 bg-white px-3 py-1 text-[12px] font-bold text-navy-900">
          From Ignition
        </span>
      </div>

      <p className="mt-2.5 max-w-[80ch] text-[15px] font-medium leading-[1.6] text-ink-muted">
        What you explored before you had an account. Nothing here is an application
        yet — tell your advisor which of these you want to pursue and they will
        open the applications with you.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {career && (
          <Row icon={Compass} label="Career goal">
            <p className="font-semibold text-navy-900">{career.title}</p>
            {typeof career.match === "number" && (
              <p className="mt-1 text-[13px] font-semibold text-ink-faint">
                {career.match}% match on your career quiz
              </p>
            )}
          </Row>
        )}

        {courses.length > 0 && (
          <Row icon={GraduationCap} label={`Courses saved (${courses.length})`}>
            <ul className="space-y-1">
              {courses.slice(0, 3).map((course) => (
                <li key={course.id ?? course.title} className="font-semibold text-navy-900">
                  {course.title}
                  {course.qualification ? (
                    <span className="font-medium text-ink-muted"> · {course.qualification}</span>
                  ) : null}
                </li>
              ))}
            </ul>
            {courses.length > 3 && (
              <p className="mt-1 text-[13px] font-semibold text-ink-faint">
                and {courses.length - 3} more
              </p>
            )}
          </Row>
        )}

        {universities.length > 0 && (
          <Row icon={Building2} label={`Universities shortlisted (${universities.length})`}>
            <ul className="space-y-1">
              {universities.slice(0, 3).map((university) => (
                <li key={university.id ?? university.name} className="font-semibold text-navy-900">
                  {university.name}
                  {university.city ? (
                    <span className="font-medium text-ink-muted"> · {university.city}</span>
                  ) : null}
                </li>
              ))}
            </ul>
            {universities.length > 3 && (
              <p className="mt-1 text-[13px] font-semibold text-ink-faint">
                and {universities.length - 3} more
              </p>
            )}
          </Row>
        )}
      </div>

      {budget?.monthlyLiving ? (
        <p className="mt-6 border-t border-navy-100 pt-5 text-[15px] font-medium leading-[1.6] text-ink-muted">
          You budgeted around{" "}
          <span className="font-bold text-navy-900">
            £{budget.monthlyLiving.toLocaleString()}
          </span>{" "}
          a month for living costs
          {budget.annualTuition ? (
            <>
              , with tuition around{" "}
              <span className="font-bold text-navy-900">
                £{budget.annualTuition.toLocaleString()}
              </span>{" "}
              a year
            </>
          ) : null}
          . Your advisor can sanity-check that against the courses you apply to.
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/explore"
          className={buttonClass('primary')}
        >
          Browse the Ignition catalogue
        </Link>
        <Link
          to="/messages"
          className={buttonClass('secondary')}
        >
          Talk to my advisor
        </Link>
      </div>
    </Card>
  );
};

export default ResearchCard;
