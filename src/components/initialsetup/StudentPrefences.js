import React, { useEffect, useState } from "react";
import { ArrowRight, Calendar, Check, Compass, FileBadge, Globe2, Loader2, X } from "lucide-react";

import formOptions from "../../data/formOptions.json";
import testSections from "../../data/testSections.json";
import { FALLBACK_SUBJECTS, getPublicTaxonomies } from "../../api/catalogue";
import {
  Field,
  FieldGrid,
  FormError,
  GhostButton,
  Panel,
  PanelBody,
  PanelHead,
  PrimaryButton,
  SelectInput,
  StepActions,
} from "../ui/kit";

const emptyTest = { selected: false, score: "", date: "", sections: {} };

const seedTests = (names) =>
  names.reduce((acc, name) => ({ ...acc, [name]: { ...emptyTest, sections: {} } }), {});

/**
 * Compute the overall from the components, where the test allows it.
 *
 * Returns `""` unless every component is filled: a partial average is a wrong
 * number, and writing one into the field a university reads is worse than
 * leaving it for the student to type. See `data/testSections.json` for what
 * each `derive` mode means and why GRE and GMAT have none.
 */
const deriveOverall = (spec, sections) => {
  if (!spec?.overall?.derive) return "";

  const entered = spec.sections.map((section) => sections?.[section.key] ?? "");
  if (entered.some((value) => value === "")) return "";

  const values = entered.map(Number);
  if (values.some((value) => !Number.isFinite(value))) return "";

  const total = values.reduce((sum, value) => sum + value, 0);
  if (spec.overall.derive === "sum") return String(total);

  const mean = total / values.length;
  if (spec.overall.derive === "mean") return String(Math.round(mean));
  // IELTS rounds to the nearest half band — 6.25 is reported as 6.5, not 6.0.
  return (Math.round(mean * 2) / 2).toFixed(1);
};

/**
 * One test, with its component scores.
 *
 * The card used to take a single "Score" and a date. A university admits on
 * the breakdown — "6.5 overall with no band below 6.0" is the ordinary form of
 * an English requirement — so a single number could not answer the question
 * the requirement asks, and the components were being read off a certificate
 * on a phone call instead.
 *
 * The components are optional and the overall is not. That is the right way
 * round: a student who knows only their band should not be blocked from
 * finishing setup, and one who fills the breakdown in gets the overall
 * computed for them rather than being asked for a number they have already
 * given four parts of. Typing over a derived overall wins — some certificates
 * report a total that is not the mean, and the certificate is the authority.
 *
 * ## On the toggle
 *
 * The checkbox was `className="hidden"`, which removes it from the tab order
 * entirely: the only way to select a test was with a mouse, and a screen
 * reader was offered an unlabelled control with no state. It is now `sr-only`
 * — present, focusable, labelled by the test's name — with the tick drawn by a
 * sibling that takes a visible ring from `peer-focus-visible`. Same picture,
 * and the card can now be reached with a keyboard.
 */
const TestCard = ({ type, testName, data, onToggle, onInputChange, onSectionChange }) => {
  const spec = testSections[testName];
  const overallLabel = spec?.overall?.label ?? "Score";
  const fieldId = `${type}-${testName.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-5 transition-[border-color,box-shadow] ${
        data.selected
          ? "border-navy-300 shadow-lift"
          : "border-hairline shadow-card hover:border-ring-idle"
      }`}
    >
      <label htmlFor={`${fieldId}-toggle`} className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          id={`${fieldId}-toggle`}
          className="peer sr-only"
          checked={data.selected}
          onChange={() => onToggle(type, testName)}
        />
        <span
          aria-hidden
          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-blue-bright/25 ${
            data.selected
              ? "border-navy-900 bg-navy-900 text-white"
              : "border-ring-idle bg-white text-transparent"
          }`}
        >
          <Check className="h-[14px] w-[14px]" strokeWidth={3.2} />
        </span>
        <span className="text-[16px] font-bold tracking-[-0.01em] text-navy-900">{testName}</span>
        {!data.selected ? (
          <span className="ml-auto text-[13px] font-semibold text-ink-faint">Add</span>
        ) : null}
      </label>

      {data.selected && (
        <div className="mt-5 space-y-4 border-t border-hairline pt-5">
          {spec && (
            <fieldset>
              <legend className="text-[11.5px] font-bold uppercase tracking-[0.13em] text-ink-faint">
                Section scores
              </legend>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {spec.sections.map((section) => (
                  <div key={section.key}>
                    <label
                      htmlFor={`${fieldId}-${section.key}`}
                      className="block text-[13px] font-semibold text-ink-muted"
                    >
                      {section.label}
                    </label>
                    <input
                      id={`${fieldId}-${section.key}`}
                      type="number"
                      inputMode="decimal"
                      min={section.min}
                      max={section.max}
                      step={section.step}
                      value={data.sections?.[section.key] ?? ""}
                      onChange={(e) => onSectionChange(type, testName, section.key, e.target.value)}
                      className="mt-1.5 h-[44px] w-full rounded-lg border border-ring-idle bg-white px-3 text-[15px] font-medium text-ink outline-none transition-colors placeholder:text-ink-faint hover:border-nav/40 focus:border-blue-bright focus:ring-4 focus:ring-blue-bright/15"
                      placeholder={`${section.min}–${section.max}`}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12.5px] font-medium leading-[1.5] text-ink-faint">
                {spec.overall.derive
                  ? "Optional — filling all of these works out your overall."
                  : "Optional. This test's total is scaled, so enter it below yourself."}
              </p>
            </fieldset>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`${fieldId}-score`}
                className="block text-[13px] font-semibold text-ink-muted"
              >
                {overallLabel}
                <span className="ml-0.5 text-orange" aria-hidden>
                  *
                </span>
              </label>
              <input
                id={`${fieldId}-score`}
                type="number"
                inputMode="decimal"
                required
                min={spec?.overall?.min}
                max={spec?.overall?.max}
                step={spec?.overall?.step}
                value={data.score}
                onChange={(e) => onInputChange(type, testName, e.target.value, "score")}
                className="mt-1.5 h-[44px] w-full rounded-lg border border-ring-idle bg-white px-3 text-[15px] font-semibold text-ink outline-none transition-colors placeholder:font-medium placeholder:text-ink-faint hover:border-nav/40 focus:border-blue-bright focus:ring-4 focus:ring-blue-bright/15"
                placeholder={spec ? `${spec.overall.min}–${spec.overall.max}` : "Enter your score"}
              />
            </div>

            <div>
              <label
                htmlFor={`${fieldId}-date`}
                className="block text-[13px] font-semibold text-ink-muted"
              >
                Test date
                <span className="ml-0.5 text-orange" aria-hidden>
                  *
                </span>
              </label>
              <div className="relative mt-1.5">
                <Calendar
                  className="pointer-events-none absolute left-3 top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-ink-faint"
                  aria-hidden
                />
                <input
                  id={`${fieldId}-date`}
                  type="date"
                  required
                  value={data.date}
                  onChange={(e) => onInputChange(type, testName, e.target.value, "date")}
                  className="h-[44px] w-full rounded-lg border border-ring-idle bg-white pl-9 pr-3 text-[15px] font-medium text-ink outline-none transition-colors hover:border-nav/40 focus:border-blue-bright focus:ring-4 focus:ring-blue-bright/15"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main StudyPreferences Component
/**
 * `initialValues` lets the wizard open with what the student already told the
 * public Ignition site — the destination they were browsing, and the subject
 * of the first course they saved. Everything stays editable; this only saves
 * them re-entering an answer they have effectively already given.
 */
const StudyPreferences = ({
  onNext,
  onPrevious,
  isLastStep,
  isSubmitting,
  initialValues,
}) => {
  const [studyPreferences, setStudyPreferences] = useState({
    country: [],
    course: "",
    studyMode: "",
    feeStructure: "",
    ...initialValues,
  });
  const [languageTests, setLanguageTests] = useState(() =>
    seedTests(formOptions.languageTests)
  );
  const [otherTests, setOtherTests] = useState(() => seedTests(formOptions.otherTests));
  const [errors, setErrors] = useState({});

  /**
   * "Preferred course" is the catalogue's own subject vocabulary, fetched.
   *
   * It used to be three hard-coded strings — "Computer Science", "Business
   * Administration", "Engineering" — none of which is a value the catalogue
   * uses. So a student's stated preference could not be joined to a single
   * course they might apply for, the public site's course facets and this
   * dropdown disagreed about what a subject even is, and research carried over
   * from the public platform never prefilled because no title or subject in it
   * could ever match one of the three.
   *
   * `formOptions.courses` is now the same ten values as a static fallback, so
   * an unreachable API costs a student the freshness of the list and not the
   * ability to finish setup.
   */
  const [subjects, setSubjects] = useState(() => formOptions.courses ?? FALLBACK_SUBJECTS);

  useEffect(() => {
    let cancelled = false;
    getPublicTaxonomies()
      .then((taxonomies) => {
        if (!cancelled && taxonomies?.subjects?.length) setSubjects(taxonomies.subjects);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTestToggle = (type, test) => {
    const setter = type === "language" ? setLanguageTests : setOtherTests;
    setter((prev) => ({
      ...prev,
      [test]: { ...prev[test], selected: !prev[test].selected },
    }));
  };

  const handleInputChange = (type, test, value, field) => {
    const setter = type === "language" ? setLanguageTests : setOtherTests;
    setter((prev) => ({
      ...prev,
      // `scoreEdited` records that the student typed the overall themselves,
      // which stops a later section edit from overwriting it. A certificate
      // that reports a total the components do not average to is the
      // authority; our arithmetic is not.
      [test]: { ...prev[test], [field]: value, ...(field === "score" ? { scoreEdited: true } : {}) },
    }));
  };

  const handleSectionChange = (type, test, sectionKey, value) => {
    const setter = type === "language" ? setLanguageTests : setOtherTests;
    setter((prev) => {
      const current = prev[test];
      const sections = { ...(current.sections ?? {}), [sectionKey]: value };
      const derived = deriveOverall(testSections[test], sections);

      return {
        ...prev,
        [test]: {
          ...current,
          sections,
          score: current.scoreEdited || !derived ? current.score : derived,
        },
      };
    });
  };

  const handleAddCountry = (country) => {
    if (!country || studyPreferences.country.includes(country)) return;
    setStudyPreferences((prev) => ({ ...prev, country: [...prev.country, country] }));
    setErrors((prev) => ({ ...prev, country: undefined }));
  };

  const handleRemoveCountry = (country) => {
    setStudyPreferences((prev) => ({
      ...prev,
      country: prev.country.filter((c) => c !== country),
    }));
  };

  const validate = () => {
    const next = {};
    if (studyPreferences.country.length === 0) {
      next.country = "Add at least one destination.";
    }
    if (!studyPreferences.course) next.course = "Select a preferred course.";
    if (!studyPreferences.studyMode) next.studyMode = "Select a study mode.";

    const selectedTests = [
      ...Object.entries(languageTests),
      ...Object.entries(otherTests),
    ].filter(([, data]) => data.selected);

    if (selectedTests.some(([, data]) => !data.score || !data.date)) {
      next.tests = "Fill in the overall score and date for every test you selected.";
    } else {
      // Section scores are optional, but a section that *is* filled has to be
      // a score the test can actually award. The input's min/max stops most of
      // it; a pasted or keyboard-nudged value can still land outside, and a
      // Writing band of 12 reaching a counsellor as fact is worse than a
      // rejected form.
      const outOfRange = selectedTests.find(([name, data]) => {
        const spec = testSections[name];
        if (!spec) return false;
        return spec.sections.some((section) => {
          const raw = data.sections?.[section.key];
          if (raw === undefined || raw === "") return false;
          const value = Number(raw);
          return !Number.isFinite(value) || value < section.min || value > section.max;
        });
      });

      if (outOfRange) {
        next.tests = `Check your ${outOfRange[0]} section scores — one is outside the range that test awards.`;
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    onNext({ ...studyPreferences, languageTests, otherTests });
  };

  const selectFields = [
    { label: "Preferred course", field: "course", options: subjects, required: true },
    { label: "Study mode", field: "studyMode", options: formOptions.studyModes, required: true },
    {
      label: "Highest academic qualification",
      field: "highestAcademic",
      options: formOptions.educationLevels,
    },
    {
      label: "College fee structure",
      field: "feeStructure",
      options: formOptions.feeStructures,
    },
  ];

  const setPreference = (field) => (event) => {
    const { value } = event.target;
    setStudyPreferences((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // The destinations not already chosen. Offering a country that is already a
  // chip is offering a control that does nothing when used.
  const remainingDestinations = formOptions.destinations.filter(
    ({ name }) => !studyPreferences.country.includes(name)
  );

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHead
          icon={Compass}
          eyebrow="What you're looking for"
          title="Study preferences"
          description="Enough to start matching you to courses. Your advisor will narrow it down with you — nothing here locks you in."
        />

        <PanelBody className="space-y-6">
          {/* ---------------------------------------------- destinations --- */}
          <div>
            <span className="block text-[14px] font-semibold text-ink-soft" id="destinations-label">
              Preferred destinations
              <span className="ml-0.5 text-orange" aria-hidden>
                *
              </span>
            </span>

            {studyPreferences.country.length > 0 ? (
              <ul className="mt-[10px] flex flex-wrap gap-2">
                {studyPreferences.country.map((country) => (
                  <li key={country}>
                    <span className="inline-flex items-center gap-2 rounded-full border border-navy-100 bg-navy-50 py-1.5 pl-3 pr-1.5 text-[14px] font-bold text-navy-900">
                      <span aria-hidden>
                        {formOptions.destinations.find((c) => c.name === country)?.icon}
                      </span>
                      {country}
                      <button
                        type="button"
                        onClick={() => handleRemoveCountry(country)}
                        aria-label={`Remove ${country}`}
                        className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-navy-500 transition-colors hover:bg-navy-100 hover:text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-bright"
                      >
                        <X className="h-[14px] w-[14px]" strokeWidth={2.6} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-[10px] max-w-[420px]">
              <SelectInput
                id="add-destination"
                aria-labelledby="destinations-label"
                icon={Globe2}
                value=""
                error={errors.country}
                placeholder={
                  remainingDestinations.length
                    ? "Add a destination…"
                    : "Every destination added"
                }
                disabled={remainingDestinations.length === 0}
                options={remainingDestinations.map(({ name, icon }) => ({
                  value: name,
                  label: `${icon} ${name}`,
                }))}
                onChange={(e) => handleAddCountry(e.target.value)}
              />
            </div>
            {errors.country ? (
              <p id="add-destination-error" className="mt-[7px] text-[13.5px] font-semibold text-orange">
                {errors.country}
              </p>
            ) : null}
          </div>

          {/* -------------------------------------------------- the rest --- */}
          <FieldGrid>
            {selectFields.map(({ label, field, options, required }) => (
              <Field key={field} id={field} label={label} required={required} error={errors[field]}>
                <SelectInput
                  placeholder={`Select ${label.toLowerCase()}`}
                  options={options}
                  value={studyPreferences[field] ?? ""}
                  onChange={setPreference(field)}
                />
              </Field>
            ))}
          </FieldGrid>
        </PanelBody>
      </Panel>

      {/* ------------------------------------------------------- tests --- */}
      <Panel>
        <PanelHead
          icon={FileBadge}
          eyebrow="Optional"
          title="Test scores"
          description="Tick any test you have already sat. Skip the rest — you can add a score the day you get it, and an application is not held up waiting for one."
        />

        <PanelBody className="space-y-8">
          <section>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-ink-faint">
              Language tests
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(languageTests).map(([test, data]) => (
                <TestCard
                  key={test}
                  type="language"
                  testName={test}
                  data={data}
                  onToggle={handleTestToggle}
                  onInputChange={handleInputChange}
                  onSectionChange={handleSectionChange}
                />
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-ink-faint">
              Other tests
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(otherTests).map(([test, data]) => (
                <TestCard
                  key={test}
                  type="other"
                  testName={test}
                  data={data}
                  onToggle={handleTestToggle}
                  onInputChange={handleInputChange}
                  onSectionChange={handleSectionChange}
                />
              ))}
            </div>
          </section>

          <FormError>{errors.tests}</FormError>

          <StepActions note="This finishes your setup and opens your dashboard. Everything here stays editable from your profile.">
            <GhostButton type="button" onClick={onPrevious} disabled={isSubmitting}>
              Back
            </GhostButton>
            <PrimaryButton type="button" onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  {isLastStep ? "Finish setup" : "Save and continue"}
                  <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
                </>
              )}
            </PrimaryButton>
          </StepActions>
        </PanelBody>
      </Panel>
    </div>
  );
};

export default StudyPreferences;
