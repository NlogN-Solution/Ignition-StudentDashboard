import React, { useEffect, useState } from "react";
import { Circle, CircleCheck, Calendar, ChevronRight, X } from "lucide-react";

import CustomIcons from "../icons/CustomIcons";
import formOptions from "../../data/formOptions.json";
import testSections from "../../data/testSections.json";
import { FALLBACK_SUBJECTS, getPublicTaxonomies } from "../../api/catalogue";

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
 */
const TestCard = ({ type, testName, data, onToggle, onInputChange, onSectionChange }) => {
  const spec = testSections[testName];
  const overallLabel = spec?.overall?.label ?? "Score";

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:bg-gray-50 transition-all duration-300 flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        <CustomIcons iconType="document" size={30} color="#4CAF50" />
        <h3 className="font-medium text-gray-900">{testName}</h3>
        <label className="flex items-center ml-auto cursor-pointer">
          <input
            type="checkbox"
            className="hidden"
            checked={data.selected}
            onChange={() => onToggle(type, testName)}
          />
          {data.selected ? (
            <CircleCheck className="text-green-500 w-5 h-5" />
          ) : (
            <Circle className="text-gray-300 w-5 h-5" />
          )}
        </label>
      </div>

      {data.selected && (
        <>
          {spec && (
            <div className="mt-2 rounded-md border border-gray-100 bg-white p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Section scores
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {spec.sections.map((section) => (
                  <div key={section.key}>
                    <label className="text-xs text-gray-600">{section.label}</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={section.min}
                      max={section.max}
                      step={section.step}
                      value={data.sections?.[section.key] ?? ""}
                      onChange={(e) => onSectionChange(type, testName, section.key, e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder={`${section.min}–${section.max}`}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {spec.overall.derive
                  ? "Optional — filling all of these works out your overall."
                  : "Optional. This test's total is scaled, so enter it below yourself."}
              </p>
            </div>
          )}

          <div className="mt-3">
            <label className="text-sm text-gray-600">
              {overallLabel}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={spec?.overall?.min}
              max={spec?.overall?.max}
              step={spec?.overall?.step}
              value={data.score}
              onChange={(e) => onInputChange(type, testName, e.target.value, "score")}
              className="w-full mt-1 p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder={spec ? `${spec.overall.min}–${spec.overall.max}` : "Enter your score"}
            />
          </div>

          <div className="mt-4">
            <label className="text-sm text-gray-600">
              Test Date<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute top-2 left-2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={data.date}
                onChange={(e) => onInputChange(type, testName, e.target.value, "date")}
                className="w-full mt-1 pl-10 p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </>
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
    { label: "Preferred Course", field: "course", options: subjects },
    { label: "Study Mode", field: "studyMode", options: formOptions.studyModes },
    {
      label: "Highest Academic Qualification",
      field: "highestAcademic",
      options: formOptions.educationLevels,
    },
    {
      label: "College Fee Structure",
      field: "feeStructure",
      options: formOptions.feeStructures,
    },
  ];

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 bg-white rounded-lg shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Study Preferences & Test Scores
      </h1>

      {/* Study Preferences Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Study Preferences
        </h2>

        <div className="relative">
          <div
            className={`border rounded-lg p-3 ${
              errors.country ? "border-red-400" : "border-gray-200"
            }`}
          >
            <div className="flex flex-wrap gap-2">
              {studyPreferences.country.map((country) => (
                <span
                  key={country}
                  className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                >
                  {formOptions.destinations.find((c) => c.name === country)?.icon} {country}
                  <button
                    type="button"
                    className="ml-2 text-gray-400 hover:text-gray-600"
                    onClick={() => handleRemoveCountry(country)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3">
              <select
                value=""
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => handleAddCountry(e.target.value)}
              >
                <option value="">Add Country</option>
                {formOptions.destinations.map(({ name, icon }) => (
                  <option key={name} value={name}>
                    {icon} {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {errors.country && <p className="text-sm text-red-500 mt-1">{errors.country}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {selectFields.map(({ label, field, options }) => (
            <div key={field}>
              <label className="text-sm text-gray-600 block mb-2">{label}</label>
              <select
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[field] ? "border-red-400" : "border-gray-200"
                }`}
                value={studyPreferences[field] ?? ""}
                onChange={(e) => {
                  setStudyPreferences((prev) => ({ ...prev, [field]: e.target.value }));
                  setErrors((prev) => ({ ...prev, [field]: undefined }));
                }}
              >
                <option value="">Select {label.toLowerCase()}</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors[field] && <p className="text-sm text-red-500 mt-1">{errors[field]}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Test Scores Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Scores</h2>

        {/* Language Tests */}
        <section className="mb-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Language Tests</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Other Tests */}
        <section>
          <h3 className="text-lg font-medium text-gray-700 mb-4">Other Tests</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {errors.tests && <p className="text-sm text-red-500 mt-4">{errors.tests}</p>}
      </section>

      {/* Save & Submit */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onPrevious}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-100 transition-all duration-300"
        >
          Back
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              isLastStep
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            } transition-all duration-300 disabled:opacity-60`}
          >
            {isSubmitting
              ? "Saving…"
              : isLastStep
              ? "Submit Application"
              : "Save & Continue"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading Screen */}
      {isSubmitting && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="p-4 bg-white rounded-lg shadow-lg flex items-center gap-3">
            <div className="border-4 border-t-4 border-blue-500 w-6 h-6 rounded-full animate-spin" />
            <span className="text-gray-700 font-medium">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPreferences;
