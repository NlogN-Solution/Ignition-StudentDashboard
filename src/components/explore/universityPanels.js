import React from "react";
import { Link } from "react-router-dom";
import { Award, Globe, Info, Route, Search, Trophy } from "lucide-react";

import { Card, Chip, Note, Section, SpecList, Ticks } from "./primitives";
import { RouteCard } from "./coursePanels";
import { CourseCard } from "./cards";
import EmptyState from "../common/EmptyState";
import { money, specs } from "../../lib/catalogue";

/**
 * The five panels behind a university's tabs.
 *
 * Same shape as the public platform's university page, and for the same
 * reason: the institution is the fixed point and the question is what changes.
 * A student comparing six of these was previously losing their place, because
 * "what is this place", "what does it teach", "what does it ask for" and "what
 * will it cost" were four different screens.
 *
 * The imported catalogue is *thin* — one of the 44 records has an overview,
 * none has tuition or imagery — so the hide-when-absent rule is doing more
 * work here than anywhere else in the product. A panel with nothing in it says
 * so plainly rather than rendering a row of headings over empty space.
 */

const Panel = ({ children }) => (
  <div className="py-8">
    <div className="max-w-4xl space-y-10">{children}</div>
  </div>
);

/* ------------------------------------------------------------------ About */

export const UniversityAboutPanel = ({ university }) => {
  const rows = specs([
    ["Founded", university.founded],
    ["Type", university.kind],
    ["Campus", university.campus],
    ["City", university.city],
    ["Region", university.region],
    ["Students", university.student_population],
    ["International students", university.international_students],
    ["Student–staff ratio", university.student_staff_ratio],
    ["UK ranking", university.ranking ? `#${university.ranking}` : null],
    [
      "Acceptance rate",
      university.acceptance_rate != null ? `${university.acceptance_rate}%` : null,
    ],
    ["Courses in the catalogue", university.course_count?.toLocaleString()],
  ]);

  const nothing =
    !university.overview && !university.tagline && rows.length === 0 && !university.highlights?.length;

  return (
    <Panel>
      <Section title={`About ${university.name}`}>
        {university.tagline && (
          <p className="text-lg font-semibold leading-snug text-navy-900">{university.tagline}</p>
        )}
        {university.overview && <p>{university.overview}</p>}

        {nothing && (
          <EmptyState
            icon={Info}
            title="No written profile yet"
            description="Ignition holds this university's courses and entry criteria but has not written up the institution itself. Your counsellor knows it — ask them."
          />
        )}

        {rows.length > 0 && (
          <Card className="p-5">
            <SpecList specs={rows} />
          </Card>
        )}
      </Section>

      {university.highlights?.length > 0 && (
        <Section title="What stands out">
          <Ticks items={university.highlights} />
        </Section>
      )}

      {university.rankings?.length > 0 && (
        <Section title="Rankings and recognition">
          <ul className="grid gap-3 sm:grid-cols-2">
            {university.rankings.map((ranking) => (
              <li key={`${ranking.title}-${ranking.year}`}>
                <Card className="h-full p-5">
                  <div className="flex items-start justify-between gap-3">
                    {ranking.position ? (
                      <p className="text-2xl font-bold leading-none tracking-tight text-navy-900">
                        {ranking.position}
                      </p>
                    ) : (
                      <Trophy className="h-5 w-5 shrink-0 text-orange" />
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

      {university.awards?.length > 0 && (
        <Section title="Awards and accreditations">
          <ul className="space-y-3">
            {university.awards.map((award) => (
              <li key={award.title}>
                <Card className="p-4">
                  <p className="flex items-start gap-2.5 text-[15px] font-semibold text-navy-900">
                    <Award className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
                    {award.title}
                  </p>
                  {award.detail && (
                    <p className="mt-1.5 pl-7 text-sm leading-relaxed text-ink-muted">
                      {award.detail}
                    </p>
                  )}
                  {award.organisation && (
                    <p className="mt-1 pl-7 text-xs font-medium text-ink-faint">
                      {award.organisation}
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* The source document's own sections, verbatim. A placing belongs in
          rankings and an accreditation in awards, but most of what an
          institution publishes about itself is neither. */}
      {university.recognition?.length > 0 && (
        <Section title="More from the university">
          <div className="space-y-5">
            {university.recognition.map((group) => (
              <Card key={group.heading} className="p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                  {group.heading}
                </h3>
                <dl className="mt-4 space-y-3">
                  {(group.items ?? []).map((item) => (
                    <div key={item.label}>
                      <dt className="text-sm font-semibold text-navy-900">{item.label}</dt>
                      {item.detail && (
                        <dd className="mt-0.5 text-sm leading-relaxed text-ink-muted">
                          {item.detail}
                        </dd>
                      )}
                    </div>
                  ))}
                </dl>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {university.website && (
        <a
          href={university.website}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-link hover:text-navy-900"
        >
          <Globe className="h-4 w-4" />
          Official site
        </a>
      )}
    </Panel>
  );
};

/* ---------------------------------------------------------------- Courses */

export const UniversityCoursesPanel = ({
  university,
  courses,
  total,
  isLoading,
  savedIds,
  onToggleSave,
}) => (
  <Panel>
    <Section title="What it teaches">
      <p>
        {total > 0
          ? `${total.toLocaleString()} courses at ${university.name} in the Ignition catalogue.`
          : `No published courses at ${university.name} yet.`}{" "}
        Shortlist any of them and your counsellor sees it on your file.
      </p>

      {isLoading ? (
        <p className="text-sm text-ink-muted">Loading courses…</p>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No courses listed here yet"
          description="Ignition works with this university but has not imported its course list. Ask your counsellor what it offers."
        />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <li key={course.slug}>
                <CourseCard
                  course={course}
                  saved={savedIds.includes(course.id)}
                  onToggleSave={() => onToggleSave(course.id)}
                />
              </li>
            ))}
          </ul>

          {total > courses.length && (
            <Link
              to={`/explore?university=${university.slug}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-link hover:text-navy-900"
            >
              Search all {total.toLocaleString()} courses here
            </Link>
          )}
        </>
      )}
    </Section>
  </Panel>
);

/* ----------------------------------------------------------- Entry routes */

export const UniversityRoutesPanel = ({ university }) => {
  const routes = university.routes ?? [];
  const entry = university.entry ?? {};
  const summary = specs([
    ["Typical offer", entry.typical],
    ["English language", entry.english],
  ]);

  return (
    <Panel>
      <Section title="Entry criteria by route">
        {routes.length ? (
          <>
            <p>
              {university.name} admits through the routes below. These are the criteria
              Ignition holds for the September 2026 intake, written for applicants from
              Nepal, and they are reproduced as the university stated them — the
              conditions in them are the part applicants most often get wrong, so nothing
              is summarised away.
            </p>
            {summary.length > 0 && (
              <Card className="p-5">
                <SpecList specs={summary} />
              </Card>
            )}
            <ul className="space-y-4">
              {routes.map((route) => (
                <li key={`${route.route_key}-${route.label ?? ""}`}>
                  <RouteCard route={route} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState
            icon={Route}
            title="No entry routes recorded"
            description="Ignition has not published this university's entry criteria matrix. Your counsellor can confirm what it asks for."
          />
        )}
      </Section>

      <Note>
        Criteria change between intakes and are set by the university, not by Ignition.
        Your counsellor confirms them before anything is submitted.
      </Note>
    </Panel>
  );
};

/* -------------------------------------------------------- Fees and funding */

export const UniversityFeesPanel = ({ university }) => {
  const scholarships = university.scholarships ?? [];
  const accommodation = university.accommodation ?? {};
  const rows = specs([
    [
      "Tuition",
      university.tuition_min && university.tuition_max
        ? `${money(university.tuition_min)} – ${money(university.tuition_max)} a year`
        : null,
    ],
    [
      "Living costs",
      university.living_cost_monthly ? `${money(university.living_cost_monthly)} a month` : null,
    ],
    [
      "Accommodation",
      accommodation.weeklyMin && accommodation.weeklyMax
        ? `${money(accommodation.weeklyMin)} – ${money(accommodation.weeklyMax)} a week`
        : accommodation.summary ?? null,
    ],
  ]);

  return (
    <Panel>
      <Section title="What a year here costs">
        {rows.length > 0 ? (
          <Card className="p-5">
            <SpecList specs={rows} />
          </Card>
        ) : (
          <EmptyState
            icon={Info}
            title="No fee figures recorded yet"
            description="Ignition does not estimate tuition. The per-course entry routes carry the university's own fee wording — check the course you are interested in, or ask your counsellor."
          />
        )}
      </Section>

      {scholarships.length > 0 && (
        <Section title="Scholarships">
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
      )}

      <Note>
        Every figure here is the university&rsquo;s, held for the September 2026 intake.
        Fees and awards change between cycles.
      </Note>
    </Panel>
  );
};

/* ----------------------------------------------------------- Life & support */

export const UniversityLifePanel = ({ university }) => {
  const employability = university.employability ?? {};
  const anything =
    university.student_experience ||
    university.careers_text ||
    university.facilities?.length ||
    university.international_support?.length ||
    employability.employedRate ||
    (employability.services ?? []).length;

  if (!anything) {
    return (
      <Panel>
        <Section title="Life and support">
          <EmptyState
            icon={Info}
            title="Nothing written up yet"
            description="Ignition has not published this university's student-life or careers material. Your counsellor has been through this with students who went there."
          />
        </Section>
      </Panel>
    );
  }

  return (
    <Panel>
      {university.student_experience && (
        <Section title="Student experience">
          <p>{university.student_experience}</p>
        </Section>
      )}

      {university.facilities?.length > 0 && (
        <Section title="On campus">
          <Ticks items={university.facilities} />
        </Section>
      )}

      {university.international_support?.length > 0 && (
        <Section title="Support for international students">
          <Ticks items={university.international_support} />
        </Section>
      )}

      {(university.careers_text || employability.employedRate) && (
        <Section title="Where it leads">
          {university.careers_text && <p>{university.careers_text}</p>}
          {(employability.employedRate || employability.medianSalary) && (
            <Card className="p-5">
              <SpecList
                specs={specs([
                  ["In work or further study", employability.employedRate],
                  ["Median salary", employability.medianSalary],
                  ["Placement rate", employability.placementRate],
                ])}
              />
            </Card>
          )}
          {employability.employedSource && <Note>{employability.employedSource}</Note>}
          {employability.services?.length > 0 && <Ticks items={employability.services} />}
        </Section>
      )}
    </Panel>
  );
};
