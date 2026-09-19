import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Award,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  MapPin,
} from "lucide-react";

import { Card, Chip, SaveButton } from "./primitives";
import { durationLabel, feeSummary, scholarshipSummary } from "../../lib/catalogue";

/**
 * The two cards the explore lists are built from.
 *
 * Both carry the shortlist control on the card itself rather than only on the
 * detail page. A student comparing thirty search results should not have to
 * open each one to keep it — and the shortlist is the artefact their counsellor
 * actually reads, so making it cheap to add to is the point of the screen.
 *
 * The whole card is a link and the shortlist button sits above it. Nesting a
 * button inside an anchor is invalid HTML and would navigate on click, so the
 * link is a stretched overlay (`after:absolute inset-0`) and the button is
 * given a higher stacking context.
 */

/** A small figure with its label above it — the card's money row is two of these. */
const Figure = ({ icon: Icon, label, value, note, tone = "navy" }) => (
  <div className="min-w-0">
    <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-faint">
      <Icon className={`h-3 w-3 ${tone === "orange" ? "text-orange" : "text-ink-faint"}`} />
      {label}
    </p>
    <p
      className={`mt-1 truncate text-[15px] font-bold tracking-tight ${
        tone === "orange" ? "text-orange" : "text-navy-900"
      }`}
    >
      {value}
    </p>
    {note && <p className="mt-0.5 truncate text-[11px] font-medium text-ink-faint">{note}</p>}
  </div>
);

/**
 * What this student's relationship to a course already is.
 *
 * A catalogue card that offers "Apply" for something already applied for is
 * the product forgetting what the student did last week. The state comes from
 * the backend — applications and saves — never from local UI memory, so it is
 * the same on a second device.
 */
const STATE_STYLES = {
  applied: "border-navy-900/30 bg-navy-900/[0.07] text-navy-900",
  selected: "border-ignite-300 bg-ignite-50 text-ignite-700",
  offer: "border-green-300 bg-green-50 text-green-700",
};

const CourseStateBadge = ({ state }) => {
  if (!state) return null;
  const label = {
    applied: "Application in progress",
    selected: "Selected course",
    offer: "Offer received",
  }[state.kind];
  if (!label) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-bold ${
        STATE_STYLES[state.kind] ?? STATE_STYLES.applied
      }`}
    >
      <CheckCircle2 className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
};

export const CourseCard = ({ course, saved, onToggleSave, state, onApply }) => {
  const university = course.university;
  const duration = durationLabel(course.duration_years);

  // Both are prose on the entry route this offering was imported under —
  // there is no numeric fee anywhere in the catalogue. See `feeSummary`.
  const fee = feeSummary(course.fee_text);
  const scholarship = scholarshipSummary(course.scholarship_text);

  return (
    /*
      No gradient bar.

      There used to be a three-pixel orange-to-navy gradient along the top edge
      of every card, lit on hover — decoration standing in for hierarchy. On a
      grid of forty it read as forty highlighted things, which is the same as
      none, and it gave the catalogue a sheen the rest of the portal does not
      have. What distinguishes a card now is what is *in* it: the subject, the
      state badge, the fee. Emphasis comes from the border warming and the
      shadow deepening on hover, and from nothing else.
    */
    <Card className="group relative flex h-full flex-col overflow-hidden p-0 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-ring-idle hover:shadow-lift">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {course.subject && (
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-orange">
                {course.subject}
              </p>
            )}
            <h3 className="mt-1.5 text-[15.5px] font-bold leading-snug tracking-tight text-navy-900 transition-colors group-hover:text-navy-900">
              <Link
                to={`/explore/courses/${course.slug}`}
                className="after:absolute after:inset-0 after:rounded-xl after:content-['']"
              >
                {course.title}
              </Link>
            </h3>
          </div>

          {onToggleSave && (
            <span className="relative z-10 shrink-0">
              <SaveButton saved={saved} size="sm" onToggle={onToggleSave} label="course" />
            </span>
          )}
        </div>

        {state ? (
          <div className="mt-2.5">
            <CourseStateBadge state={state} />
          </div>
        ) : null}

        {/* University and city on their own lines. Inline, the city wrapped
            onto a second line while its pin stayed at the end of the first,
            which read as a stray icon rather than a location. */}
        {university && (
          <div className="mt-3 space-y-1">
            <p className="flex items-start gap-2 text-[13.5px] font-semibold text-ink-soft">
              <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
              <span className="min-w-0">{university.name}</span>
            </p>
            {university.city && (
              <p className="flex items-center gap-2 text-[13px] font-medium text-ink-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                {university.city}
              </p>
            )}
          </div>
        )}

        <div className="mb-4 mt-3.5 flex flex-wrap gap-1.5">
          {course.qualification && <Chip>{course.qualification}</Chip>}
          {course.course_level && <Chip tone="navy">{course.course_level}</Chip>}
          {duration && (
            <Chip>
              <Clock className="h-3 w-3" />
              {duration}
            </Chip>
          )}
          {course.placement && (
            <Chip tone="orange">
              <Briefcase className="h-3 w-3" />
              Placement year
            </Chip>
          )}
        </div>

        {/* The money row, pinned to the bottom so it lines up across a grid of
            cards whose titles wrap to different heights — the whole point of
            putting a fee on a card is being able to compare down a column. */}
        {(fee || scholarship) && (
          <div className="mt-auto grid grid-cols-2 gap-4 border-t border-hairline pt-4">
            {fee ? (
              <Figure
                icon={GraduationCap}
                label="Tuition"
                value={fee.amount}
                // "from" whenever the route names more than one figure: the fee
                // covers several courses at different tiers and this one may be
                // at any of them.
                note={fee.from ? "from · a year" : "a year"}
              />
            ) : (
              <Figure icon={GraduationCap} label="Tuition" value="On request" note="ask your counsellor" />
            )}

            {scholarship ? (
              <Figure
                icon={Award}
                tone="orange"
                label="Scholarship"
                value={scholarship.amount ? `Up to ${scholarship.amount}` : "Available"}
                note={scholarship.amount ? "if you qualify" : "terms on the course"}
              />
            ) : (
              <div />
            )}
          </div>
        )}

        {/* The action, and only where there is one to take.

            `z-10` because the title's `after:` pseudo-element covers the whole
            card to make it clickable — without it this button is under that
            overlay and the student gets the detail page instead of the apply
            flow. An already-applied course shows a link to the application
            rather than a second Apply button. */}
        {onApply && (
          <div className="relative z-10 mt-4">
            {state?.kind === "applied" || state?.kind === "offer" ? (
              <Link
                to={state.applicationId ? `/applications/${state.applicationId}` : "/applications"}
                className="inline-flex h-[38px] w-full items-center justify-center gap-1.5 rounded-lg border border-ring-idle bg-white text-[13.5px] font-semibold text-ink-soft transition-colors hover:border-nav/40 hover:bg-navy-50 hover:text-navy-900"
              >
                View your application
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onApply(course)}
                className="inline-flex h-[38px] w-full items-center justify-center gap-1.5 rounded-lg bg-navy-900 text-[13.5px] font-semibold text-white transition-colors hover:bg-navy-800"
              >
                Apply now
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export const UniversityCard = ({ university, saved, onToggleSave }) => (
  // Same reasoning as `CourseCard`: no gradient edge, no glow. See the note there.
  <Card className="group relative flex h-full flex-col overflow-hidden p-0 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-ring-idle hover:shadow-lift">
    <div className="flex flex-1 flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {/* The monogram is the record's own, and a two-letter fallback beats an
              empty square or a broken image for the many rows with no logo. */}
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-hairline bg-navy-50 text-sm font-bold text-navy-900">
            {university.monogram ?? university.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h3 className="text-[15.5px] font-bold leading-snug tracking-tight text-navy-900 transition-colors group-hover:text-navy-900">
              <Link
                to={`/explore/universities/${university.slug}`}
                className="after:absolute after:inset-0 after:rounded-xl after:content-['']"
              >
                {university.name}
              </Link>
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[13px] font-medium text-ink-muted">
              {university.city && (
                <>
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                  {university.city}
                </>
              )}
              {university.region && <span className="text-ink-faint">· {university.region}</span>}
            </p>
          </div>
        </div>

        {onToggleSave && (
          <span className="relative z-10 shrink-0">
            <SaveButton saved={saved} size="sm" onToggle={onToggleSave} label="university" />
          </span>
        )}
      </div>

      {university.tagline && (
        <p className="mt-3 line-clamp-2 text-[13.5px] leading-relaxed text-ink-soft">
          {university.tagline}
        </p>
      )}

      <div className="mb-4 mt-3.5 flex flex-wrap gap-1.5">
        {university.placement_year && (
          <Chip tone="orange">
            <Briefcase className="h-3 w-3" />
            Placement year
          </Chip>
        )}
        {(university.subjects ?? []).slice(0, 3).map((subject) => (
          <Chip key={subject}>{subject}</Chip>
        ))}
      </div>

      {university.course_count > 0 && (
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-hairline pt-4">
          <Figure
            icon={Layers}
            label="Courses here"
            value={university.course_count.toLocaleString()}
            note="in the Ignition catalogue"
          />
          {(university.tuition_min || university.tuition_max) && (
            <Figure
              icon={GraduationCap}
              label="Tuition"
              value={`£${Number(
                university.tuition_min ?? university.tuition_max
              ).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`}
              note="from · a year"
            />
          )}
        </div>
      )}
    </div>
  </Card>
);
