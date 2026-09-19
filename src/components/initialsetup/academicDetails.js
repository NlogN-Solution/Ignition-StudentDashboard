import React, { useState } from 'react';
import { ArrowRight, GraduationCap } from 'lucide-react';

import formOptions from '../../data/formOptions.json';
import {
  Field,
  FieldGrid,
  Panel,
  PanelBody,
  PanelHead,
  PrimaryButton,
  GhostButton,
  SelectInput,
  StepActions,
  TextArea,
  TextInput,
} from '../ui/kit';

/**
 * The years a student can pick between, newest first.
 *
 * Both year fields were free `type="number"` inputs, which is a text box that
 * happens to reject letters: it accepted `19999`, `3`, and a year fifty years
 * in the future, and the validation below then had to reject what the control
 * should never have offered. A student typing their completion year is not
 * doing arithmetic — they are choosing one of about eighty answers they
 * already know.
 *
 * The upper bound is five years out rather than the current year. A course a
 * student is *on* has a completion year that has not happened yet, and that is
 * the ordinary case for someone applying, not an edge case.
 */
const CURRENT_YEAR = new Date().getFullYear();
const EARLIEST_YEAR = 1950;
const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR + 5 - EARLIEST_YEAR + 1 },
  (unused, index) => String(CURRENT_YEAR + 5 - index)
);

const AcademicDetails = ({ initialValues, onPrevious, onNext, isLastStep, isFirstStep }) => {
  const [education, setEducation] = useState(
    initialValues ?? {
      highestLevel: '',
      startingYear: '',
      completionYear: '',
      country: '',
      obtainedMarks: '',
      educationGap: '',
      gapReason: '',
    }
  );
  const [errors, setErrors] = useState({});

  const handleEducationChange = (field, value) => {
    setEducation((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    const start = Number(education.startingYear);
    const end = Number(education.completionYear);

    if (!education.highestLevel) next.highestLevel = 'Select your highest level of education.';
    // The range checks the old free-text inputs needed are now the dropdown's
    // job. What is left is what a dropdown cannot enforce: that the two
    // answers agree with each other.
    if (!start) next.startingYear = 'Select the year you started.';
    if (!end) {
      next.completionYear = 'Select your year of completion.';
    } else if (start && end < start) {
      next.completionYear = 'Completion year cannot be before the starting year.';
    }
    if (!education.country) next.country = 'Select the country you studied in.';
    if (!education.obtainedMarks.trim()) next.obtainedMarks = 'Enter your marks or CGPA.';
    if (Number(education.educationGap) > 0 && !education.gapReason.trim()) {
      next.gapReason = 'Explain the gap in your education.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext(education);
  };

  // The gap reason only becomes a question once there is a gap to explain.
  // It stays rendered either way — a field that appears mid-form moves
  // everything under it, and the student is usually mid-sentence when it does.
  const hasGap = Number(education.educationGap) > 0;

  return (
    <Panel>
      <PanelHead
        icon={GraduationCap}
        eyebrow="About you"
        title="Educational background"
        description="Your highest qualification so far. Universities read this first, so it is worth getting exactly right — you can change any of it later from your profile."
      />

      <PanelBody>
        <FieldGrid>
          <Field
            id="highestLevel"
            label="Highest level of education"
            required
            error={errors.highestLevel}
            className="sm:col-span-2"
          >
            <SelectInput
              placeholder="Select education level"
              options={formOptions.educationLevels}
              value={education.highestLevel}
              onChange={(e) => handleEducationChange('highestLevel', e.target.value)}
            />
          </Field>

          <Field id="startingYear" label="Starting year" required error={errors.startingYear}>
            <SelectInput
              placeholder="Select year"
              options={YEAR_OPTIONS}
              value={education.startingYear}
              onChange={(e) => handleEducationChange('startingYear', e.target.value)}
            />
          </Field>

          {/* The hint is said here rather than left to a validation error: a
              student still studying has a completion year in the future, and a
              control that only offered past years would look like it was
              rejecting the truth. */}
          <Field
            id="completionYear"
            label="Year of completion"
            required
            hint="Pick a future year if you have not finished yet."
            error={errors.completionYear}
          >
            <SelectInput
              placeholder="Select year"
              options={YEAR_OPTIONS}
              value={education.completionYear}
              onChange={(e) => handleEducationChange('completionYear', e.target.value)}
            />
          </Field>

          <Field id="country" label="Country of education" required error={errors.country}>
            <SelectInput
              placeholder="Select country"
              options={formOptions.educationCountries}
              value={education.country}
              onChange={(e) => handleEducationChange('country', e.target.value)}
            />
          </Field>

          <Field
            id="obtainedMarks"
            label="Obtained marks / CGPA"
            required
            hint="However your transcript states it — a percentage, a GPA or a classification."
            error={errors.obtainedMarks}
          >
            <TextInput
              value={education.obtainedMarks}
              onChange={(e) => handleEducationChange('obtainedMarks', e.target.value)}
              placeholder="e.g. 3.6 GPA, or 78%"
            />
          </Field>

          <Field
            id="educationGap"
            label="Education gap (in years)"
            hint="Leave blank if you have studied continuously."
          >
            <TextInput
              type="number"
              min="0"
              inputMode="numeric"
              value={education.educationGap}
              onChange={(e) => handleEducationChange('educationGap', e.target.value)}
              placeholder="0"
            />
          </Field>

          <Field
            id="gapReason"
            label="Reason for gap"
            required={hasGap}
            hint={
              hasGap
                ? 'A gap is normal and not held against you — universities only want it accounted for.'
                : 'Only needed if you entered a gap above.'
            }
            error={errors.gapReason}
            className="sm:col-span-2"
          >
            <TextArea
              rows={3}
              value={education.gapReason}
              onChange={(e) => handleEducationChange('gapReason', e.target.value)}
              placeholder="Work, family, a resit year, a change of direction…"
            />
          </Field>
        </FieldGrid>

        <StepActions note="Saved to your profile when you continue. Nothing is sent to a university at this stage.">
          {!isFirstStep && (
            <GhostButton type="button" onClick={onPrevious}>
              Back
            </GhostButton>
          )}
          <PrimaryButton type="button" onClick={handleNext}>
            {isLastStep ? 'Submit application' : 'Save and continue'}
            <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
          </PrimaryButton>
        </StepActions>
      </PanelBody>
    </Panel>
  );
};

export default AcademicDetails;
