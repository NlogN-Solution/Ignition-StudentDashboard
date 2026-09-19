import React from "react";
import { Link } from "react-router-dom";
import { Award, Building, CalendarClock, ExternalLink, Globe, Info } from "lucide-react";

import { Card, Chip, Note, Section, SpecList, Ticks } from "./primitives";
import EmptyState from "../common/EmptyState";
import {
  durationLabel,
  longDate,
  money,
  routeLabel,
  routeRows,
  specs,
  toSections,
} from "../../lib/catalogue";

/**
 * The six panels behind a course's tabs, mirroring the public platform's
 * `/courses/at/[slug]`.
 *
 * They are the same six questions in the same order, off the same endpoint,
 * because a student who compared four courses on the marketing site and then
 * signed in should not have to relearn where anything is. The portal's answer
 * to each is allowed to be *shorter* — the marketing copy around a fact is not
 * needed once someone has an advisor — but it must never be a different fact.
 *
 * Every block follows the rule the catalogue is rendered under: **a block
 * whose field is absent does not render.** The imported data is uneven (4,575
 * of 4,797 offerings inherit an entry route; the rest inherit nothing), so one
 * component has to serve a fully documented course and a sparse one without
 * either looking broken.
 */

const Panel = ({ children }) => (
  <div className="py-8">
    <div className="max-w-4xl space-y-10">{children}</div>
  </div>
);

/** One route's criteria, in the university's own words. Not tidied. */
export const RouteCard = ({ route }) => {
  const rows = routeRows(route);
  if (!rows.length) return null;

  return (
    <Card className="p-5">
      <h3 className="text-base font-bold tracking-tight text-navy-900">{routeLabel(route)}</h3>
      <dl className="mt-4 space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="border-t border-hairline pt-4 first:border-t-0 first:pt-0">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              {row.label}
            </dt>
            <dd className="mt-1.5 whitespace-pre-line text-sm font-medium leading-relaxed text-ink">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
};

/* --------------------------------------------------------------- Overview */

export const CourseOverviewPanel = ({ course }) => {
  const university = course.university;
  const rows = specs([
    ["Qualification", course.qualification],
    ["Level", course.course_level],
    ["Subject", course.subject],
    [
      "Duration",
      durationLabel(course.duration_years) ??
        (course.duration_months ? `${course.duration_months} months` : null),
    ],
    ["Placement year", course.placement ? "Available" : "Not offered"],
    ["Study mode", course.course_type],
    ["Campus", course.campus],
    ["Intake", course.intake ?? course.intakes_summary?.join(" · ")],
    [
      "University",
      university ? (
        <Link
          to={`/explore/universities/${university.slug}`}
          className="font-semibold text-navy-900 hover:text-navy-900"
        >
          {university.name}
        </Link>
      ) : null,
    ],
  ]);

  return (
    <Panel>
      <Section title="This course">
        <Card className="p-5">
          <SpecList specs={rows} />
        </Card>

        {course.extra_requirements && (
          <Card className="border-ignite-200 bg-ignite-50/40 p-4">
            <p className="flex gap-3 text-sm leading-relaxed text-ink">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
              <span>
                <strong className="font-semibold">Additional requirement.</strong>{" "}
                {course.extra_requirements}
              </span>
            </p>
          </Card>
        )}
      </Section>

      {course.highlights?.length > 0 && (
        <Section title="What stands out">
          <Ticks items={course.highlights} />
        </Section>
      )}

      {course.outcomes?.length > 0 && (
        <Section title="What you come out with">
          <Ticks items={course.outcomes} />
        </Section>
      )}
    </Panel>
  );
};

/* ------------------------------------------------- Admission requirements */

export const CourseEntryPanel = ({ course }) => {
  const university = course.university;
  const sections = toSections(course.requirements);
  const thresholds = specs([
    ["Minimum IELTS", course.minimum_ielts != null ? course.minimum_ielts.toFixed(1) : null],
    ["Minimum GPA", course.minimum_gpa != null ? course.minimum_gpa.toFixed(2) : null],
  ]);

  return (
    <Panel>
      <Section title="Entry criteria">
        {course.route ? (
          <>
            <p>
              {university ? `${university.name} admits` : "This course admits"} this course
              through the route below. These are the criteria Ignition holds for the
              September 2026 intake, written for applicants from Nepal, and they are
              reproduced as the university stated them.
            </p>
            <RouteCard route={course.route} />
          </>
        ) : (
          <EmptyState
            icon={Info}
            title="Not recorded for this course yet"
            description={`Ignition has not attributed this course to one of ${
              university ? university.name : "the university"
            }'s entry routes, so its requirements are not shown here rather than guessed at. Ask your counsellor and we will confirm them with the university.`}
          />
        )}
      </Section>

      {sections.length > 0 && (
        <Section title="What this course asks for">
          <div className="space-y-4">
            {sections.map((section) => (
              <Card key={section.label} className="p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                  {section.label}
                </h3>
                <div className="mt-4">
                  <Ticks items={section.items} />
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {thresholds.length > 0 && (
        <Section title="Minimum thresholds on record">
          <Card className="p-5">
            <SpecList specs={thresholds} />
          </Card>
          <Note>
            A threshold is the floor, not the bar that gets an offer. Where the entry
            route above says something different, the route is the university&rsquo;s own
            wording and wins.
          </Note>
        </Section>
      )}

      <Note>
        Criteria change between intakes and are set by the university, not by Ignition.
        Your counsellor confirms them before anything is submitted.
      </Note>
    </Panel>
  );
};

/* ---------------------------------------------------- Intakes & key dates */

export const CourseIntakesPanel = ({ course }) => {
  const intakes = course.intakes ?? [];
  const keyDates = Object.entries(course.key_dates ?? {})
    .map(([key, value]) => ({ key, value: typeof value === "string" ? value.trim() : "" }))
    .filter((entry) => entry.value);

  if (!intakes.length && !keyDates.length && !course.intake) {
    return (
      <Panel>
        <Section title="When this course runs">
          <EmptyState
            icon={CalendarClock}
            title="No intake recorded yet"
            description="Every course in this catalogue is held for the September 2026 intake unless the university says otherwise. Ask your counsellor and we will confirm the exact dates."
          />
        </Section>
      </Panel>
    );
  }

  return (
    <Panel>
      <Section title="When this course runs">
        <p>
          Applying is a queue, not a deadline: places go as they are offered, and an
          application in October is read against a fuller cohort than the same
          application in February.
        </p>
      </Section>

      {intakes.length > 0 && (
        <Section title="Intakes">
          <ul className="space-y-3">
            {intakes.map((intake) => (
              <li key={intake.name}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-navy-900">
                      <CalendarClock className="h-4 w-4 shrink-0 text-orange" />
                      {intake.name}
                    </h3>
                    {intake.application_deadline && (
                      <Chip>Apply by {longDate(intake.application_deadline)}</Chip>
                    )}
                  </div>
                  {intake.start_date && (
                    <p className="mt-3 text-sm font-medium text-ink-muted">
                      Teaching starts {longDate(intake.start_date)}.
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {keyDates.length > 0 && (
        <Section title="Key dates">
          <Card className="p-5">
            <SpecList
              specs={keyDates.map((entry) => ({
                label: entry.key
                  .replace(/[_-]+/g, " ")
                  .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
                  .replace(/^./, (letter) => letter.toUpperCase()),
                value: longDate(entry.value),
              }))}
            />
          </Card>
        </Section>
      )}

      <Note>
        Dates come from the university&rsquo;s own intake information and move between
        cycles. Your counsellor confirms them before you plan around one.
      </Note>
    </Panel>
  );
};

/* --------------------------------------------------------- Fees & funding */

export const CourseFeesPanel = ({ course }) => {
  const profile = course.university_profile;
  const scholarships = course.scholarships ?? [];
  const routeFees = course.route?.fee_structure;
  const preTravel = specs([
    ["CAS deposit", course.route?.cas_deposit],
    ["Enrolment fee", course.route?.enrolment_fee],
  ]);

  return (
    <Panel>
      <Section title="What this course costs">
        {routeFees ? (
          <>
            <p>
              The fee below is attached to the entry route this course is admitted under,
              in the university&rsquo;s own wording. Where it names a tier, the tier is set
              by the course — this one is
              {course.fee_tier ? ` the ${course.fee_tier} tier` : " not tiered"}.
            </p>
            <Card className="p-5">
              <p className="whitespace-pre-line text-[15px] font-medium leading-relaxed text-ink">
                {routeFees}
              </p>
            </Card>
          </>
        ) : course.tuition_fee != null ? (
          <Card className="p-5">
            <p className="text-3xl font-bold tracking-tight text-navy-900">
              {money(course.tuition_fee, course.currency)}
            </p>
            <p className="mt-1 text-sm font-medium text-ink-muted">tuition, a year</p>
          </Card>
        ) : profile?.tuition_min && profile?.tuition_max ? (
          <p>
            No fee is recorded against this specific course. Tuition at {profile.name} runs
            from {money(profile.tuition_min)} to {money(profile.tuition_max)} a year across
            its courses — ask your counsellor for the exact figure for this one.
          </p>
        ) : (
          <EmptyState
            icon={Info}
            title="No tuition figure recorded yet"
            description="Ignition does not estimate one: a fee you plan a family's savings around has to come from the university. Ask your counsellor and we will confirm it."
          />
        )}
      </Section>

      {profile?.living_cost_monthly ? (
        <Section title="Living costs where you would be">
          <Card className="p-5">
            <SpecList
              specs={[
                {
                  label: `Living costs in ${profile.city ?? "this city"}`,
                  value: `${money(profile.living_cost_monthly)} a month`,
                },
              ]}
            />
          </Card>
          <Note>
            Indicative, for a student living independently, before tuition. What you
            actually spend depends most on rent and on the city.
          </Note>
        </Section>
      ) : null}

      {preTravel.length > 0 && (
        <Section title="What you pay before you travel">
          <Card className="p-5">
            <SpecList specs={preTravel} />
          </Card>
        </Section>
      )}

      {scholarships.length > 0 ? (
        <Section title="Funding this course can draw on">
          <p>
            {profile ? `${profile.name}'s` : "The university's"} published awards, narrowed
            to those open to a course at this level and in this subject. Most of what is
            here is a fee discount — and a fee discount on a course you were going to take
            is still real money.
          </p>
          <ul className="space-y-3">
            {scholarships.map((scholarship) => (
              <li key={scholarship.slug}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-navy-900">
                      <Award className="h-4 w-4 shrink-0 text-orange" />
                      {scholarship.name}
                    </h3>
                    {scholarship.amount && <Chip tone="orange">{scholarship.amount}</Chip>}
                  </div>
                  {scholarship.eligibility && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                      {scholarship.eligibility}
                    </p>
                  )}
                  {(scholarship.deadline || scholarship.apply_via) && (
                    <div className="mt-4">
                      <SpecList
                        specs={specs([
                          ["Deadline", scholarship.deadline],
                          ["Apply via", scholarship.apply_via],
                        ])}
                      />
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </Section>
      ) : course.route?.scholarship_text ? (
        <Section title="Funding this course can draw on">
          <Card className="p-5">
            <p className="whitespace-pre-line text-[15px] font-medium leading-relaxed text-ink">
              {course.route.scholarship_text}
            </p>
          </Card>
          <Note>
            The scholarship terms attached to this course&rsquo;s entry route, in the
            university&rsquo;s own wording.
          </Note>
        </Section>
      ) : null}

      <Note>
        Every figure here is the university&rsquo;s, held for the September 2026 intake.
        Fees and awards change between cycles.
      </Note>
    </Panel>
  );
};

/* ------------------------------------------------------ About the university */

export const CourseUniversityPanel = ({ course }) => {
  const profile = course.university_profile;
  const named = course.university;

  if (!profile) {
    return (
      <Panel>
        <Section title="About the university">
          {named ? (
            <>
              <p>
                This course is taught at {named.name}
                {named.city ? ` in ${named.city}` : ""}. Its full record lives on its own
                page.
              </p>
              <Link
                to={`/explore/universities/${named.slug}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-navy-900 hover:text-navy-900"
              >
                Open {named.name}
                <ExternalLink className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <EmptyState
              icon={Building}
              title="No university record"
              description="This course is not currently attached to a published university."
            />
          )}
        </Section>
      </Panel>
    );
  }

  const rows = specs([
    ["Founded", profile.founded],
    ["Type", profile.kind],
    ["Campus", profile.campus],
    ["City", profile.city],
    ["Region", profile.region],
    ["Students", profile.student_population],
    ["International students", profile.international_students],
    ["Student–staff ratio", profile.student_staff_ratio],
    ["UK ranking", profile.ranking ? `#${profile.ranking}` : null],
    ["Courses in the catalogue", profile.course_count?.toLocaleString()],
  ]);

  return (
    <Panel>
      <Section title={`About ${profile.name}`}>
        {profile.tagline && (
          <p className="text-lg font-semibold leading-snug text-navy-900">{profile.tagline}</p>
        )}
        {profile.overview && <p>{profile.overview}</p>}
        {!profile.tagline && !profile.overview && (
          <p>
            {profile.name}
            {profile.city ? ` is in ${profile.city}` : ""} and teaches{" "}
            {profile.course_count?.toLocaleString() ?? "a range of"} courses in this
            catalogue, including this one.
          </p>
        )}
        {rows.length > 0 && (
          <Card className="p-5">
            <SpecList specs={rows} />
          </Card>
        )}
      </Section>

      {profile.rankings?.length > 0 && (
        <Section title="What it is recognised for">
          <ul className="grid gap-3 sm:grid-cols-2">
            {profile.rankings.map((ranking) => (
              <li key={`${ranking.title}-${ranking.year}`}>
                <Card className="h-full p-5">
                  <div className="flex items-start justify-between gap-3">
                    {ranking.position && (
                      <p className="text-2xl font-bold leading-none tracking-tight text-navy-900">
                        {ranking.position}
                      </p>
                    )}
                    {ranking.scope && <Chip>{ranking.scope}</Chip>}
                  </div>
                  <h3 className="mt-3 text-[15px] font-bold leading-snug text-navy-900">
                    {ranking.title}
                  </h3>
                  {ranking.note && (
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{ranking.note}</p>
                  )}
                  {ranking.source && (
                    <p className="mt-3 text-xs font-medium text-ink-faint">
                      {ranking.source}
                      {ranking.year ? ` · ${ranking.year}` : ""}
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {profile.facilities?.length > 0 && (
        <Section title="On campus">
          <Ticks items={profile.facilities} />
        </Section>
      )}

      {profile.international_support?.length > 0 && (
        <Section title="Support for international students">
          <Ticks items={profile.international_support} />
        </Section>
      )}

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ignite-200 bg-ignite-50 text-orange">
            <Building className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-navy-900">
              The full record for {profile.name}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              Every entry route, every course it teaches, and what a year costs.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link
                to={`/explore/universities/${profile.slug}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-navy-900 hover:text-navy-900"
              >
                Open the university
                <ExternalLink className="h-4 w-4" />
              </Link>
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 text-sm font-bold text-ink-muted hover:text-navy-900"
                >
                  <Globe className="h-4 w-4" />
                  Official site
                </a>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Panel>
  );
};
