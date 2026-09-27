import React, { useEffect, useState } from "react";
import { ArrowRight, Compass, FileBadge, Loader2 } from "lucide-react";

import formOptions from "../../data/formOptions.json";
import { seedTests, TestCard, testScoresError, withSectionChange } from "../tests/testScores";
import { FALLBACK_SUBJECTS, getPublicTaxonomies, subjectLabel } from "../../api/catalogue";
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

/** The only destination Ignition places students in. */
const DESTINATION = "United Kingdom";

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
    // Pre-filled, and there is nothing else to pick. Ignition works with UK
    // institutions only, so asking was a question with one answer that a
    // student could still get wrong by skipping — it blocked the step with
    // "Add at least one destination" until they chose the only option.
    country: [DESTINATION],
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
  const [subjects, setSubjects] = useState(() => formOptions.courses ?? FALLBACK_SUBJECTS.map(subjectLabel));

  useEffect(() => {
    let cancelled = false;
    getPublicTaxonomies()
      .then((taxonomies) => {
        if (!cancelled && taxonomies?.subjects?.length) setSubjects(taxonomies.subjects.map(subjectLabel));
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
    setter((prev) => ({ ...prev, [test]: withSectionChange(prev[test], test, sectionKey, value) }));
  };

  const validate = () => {
    const next = {};
    if (!studyPreferences.course) next.course = "Select a preferred course.";
    if (!studyPreferences.studyMode) next.studyMode = "Select a study mode.";

    const testsError = testScoresError(languageTests, otherTests);
    if (testsError) next.tests = testsError;

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
          {/* ---------------------------------------------- destination --- */}
          {/* Stated, not asked. Ignition places students at UK institutions
              and the catalogue behind this wizard has nothing else in it, so a
              picker here offered one option and could still be left empty. */}
          <div>
            <span className="block text-[14px] font-semibold text-ink-soft">Destination</span>
            <p className="mt-[10px] inline-flex items-center gap-2 rounded-full border border-navy-100 bg-navy-50 py-1.5 pl-3 pr-4 text-[14px] font-bold text-navy-900">
              <span aria-hidden>🇬🇧</span>
              {DESTINATION}
            </p>
            <p className="mt-[7px] text-[13.5px] font-medium text-ink-faint">
              Ignition works with UK universities. Everything below is about studying there.
            </p>
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
