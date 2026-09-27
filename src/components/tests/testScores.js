import React from "react";
import { Calendar, Check } from "lucide-react";

import testSections from "../../data/testSections.json";

/**
 * Test scores — shared by the onboarding wizard and Edit Profile.
 *
 * Both write the same shape to `StudentProfile.test_scores`:
 * `{ language: { IELTS: { selected, score, date, sections, scoreEdited } }, other: {...} }`.
 * A test is on the record while `selected` is true; unticking it removes it.
 */

export const emptyTest = { selected: false, score: "", date: "", sections: {} };

export const seedTests = (names) =>
  names.reduce((acc, name) => ({ ...acc, [name]: { ...emptyTest, sections: {} } }), {});

/**
 * Compute the overall from the components, where the test allows it.
 *
 * Returns `""` unless every component is filled: a partial average is a wrong
 * number, and writing one into the field a university reads is worse than
 * leaving it for the student to type. See `data/testSections.json` for what
 * each `derive` mode means and why GRE and GMAT have none.
 */
export const deriveOverall = (spec, sections) => {
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
export const TestCard = ({ type, testName, data, onToggle, onInputChange, onSectionChange }) => {
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
          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-navy-900/25 ${
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
                      className="mt-1.5 h-[44px] w-full rounded-lg border border-ring-idle bg-white px-3 text-[15px] font-medium text-ink outline-none transition-colors placeholder:text-ink-faint hover:border-nav/40 focus:border-navy-900 focus:ring-4 focus:ring-navy-900/15"
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
                className="mt-1.5 h-[44px] w-full rounded-lg border border-ring-idle bg-white px-3 text-[15px] font-semibold text-ink outline-none transition-colors placeholder:font-medium placeholder:text-ink-faint hover:border-nav/40 focus:border-navy-900 focus:ring-4 focus:ring-navy-900/15"
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
                  className="h-[44px] w-full rounded-lg border border-ring-idle bg-white pl-9 pr-3 text-[15px] font-medium text-ink outline-none transition-colors hover:border-nav/40 focus:border-navy-900 focus:ring-4 focus:ring-navy-900/15"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/** Every test in `names`, with whatever was saved for it filled in. */
export const seedTestsFrom = (names, saved) =>
  names.reduce(
    (acc, name) => ({
      ...acc,
      [name]: { ...emptyTest, sections: {}, ...(saved?.[name] ?? {}) },
    }),
    {}
  );

/** A section edit, with the overall re-derived unless the student typed it. */
export const withSectionChange = (current, testName, sectionKey, value) => {
  const sections = { ...(current.sections ?? {}), [sectionKey]: value };
  const derived = deriveOverall(testSections[testName], sections);
  return {
    ...current,
    sections,
    score: current.scoreEdited || !derived ? current.score : derived,
  };
};

/** The first problem with the selected tests, worded for the student, or null. */
export const testScoresError = (languageTests, otherTests) => {
  const selected = [...Object.entries(languageTests), ...Object.entries(otherTests)].filter(
    ([, data]) => data.selected
  );

  if (selected.some(([, data]) => !data.score || !data.date)) {
    return "Fill in the overall score and date for every test you selected.";
  }

  // Section scores are optional, but a section that *is* filled has to be a
  // score the test can actually award. The input's min/max stops most of it;
  // a pasted or keyboard-nudged value can still land outside, and a Writing
  // band of 12 reaching a counsellor as fact is worse than a rejected form.
  const outOfRange = selected.find(([name, data]) => {
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
    return `Check your ${outOfRange[0]} section scores — one is outside the range that test awards.`;
  }
  return null;
};
