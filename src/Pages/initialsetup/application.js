import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import ApplicationHeader from "../../components/initialsetup/myApplicationHeading";
import AcademicDetails from "../../components/initialsetup/academicDetails";
import StudentPrefences from "../../components/initialsetup/StudentPrefences";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";
import formOptions from "../../data/formOptions.json";
import {
  consumePendingHandoff,
  mergeResearchIntoPreferences,
  peekPendingHandoff,
} from "../../lib/handoff";

const TOTAL_STEPS = 2;

/**
 * What the student researched on the public site, translated into this
 * wizard's option vocabulary.
 *
 * Only exact matches are prefilled. A saved course called "Biomedical Science"
 * has no equivalent in `formOptions.courses` and is left blank rather than
 * approximated — putting the wrong subject in front of a student is worse than
 * putting nothing there.
 */
const defaultsFromResearch = (handoff) => {
  if (!handoff) return undefined;

  const subject = handoff.courses?.[0]?.subject ?? null;
  const title = handoff.courses?.[0]?.title ?? null;
  const course =
    formOptions.courses.find((option) => option === title) ??
    formOptions.courses.find((option) => option === subject) ??
    "";

  return {
    // The public platform is UK-only, so arriving from it is the answer.
    country: ["United Kingdom"],
    course,
  };
};

/**
 * Initial setup wizard. Each step hands its values up here and the whole thing
 * is committed to the student profile via `updateUser` at the end.
 */
const MultiStepForm = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { awardPoints, pushActivity } = useAppData();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [education, setEducation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Peeked, not consumed: the wizard can be abandoned halfway, and the
  // research should still be waiting when the student comes back to it. It is
  // consumed below, once the profile it belongs to actually exists.
  const [research] = useState(peekPendingHandoff);

  const goToPreviousStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleAcademicNext = (values) => {
    setEducation(values);
    setCurrentStep(2);
  };

  const handleFinish = async (preferences) => {
    setIsSubmitting(true);

    await updateUser({
      education: { ...user.education, ...education },
      // This is the call that creates the student's profile row, so it is also
      // the first opportunity to persist research carried over from the public
      // site — a bare PATCH before this point is rejected for want of
      // `education_level`. See AuthContext's `applyPendingResearch`.
      preferences: mergeResearchIntoPreferences(
        {
          ...user.preferences,
          destinations: preferences.country,
          intendedStudyArea: preferences.course,
          studyMode: preferences.studyMode,
          feeStructure: preferences.feeStructure,
        },
        research
      ),
      testScores: {
        language: preferences.languageTests,
        other: preferences.otherTests,
      },
      onboardingCompleted: true,
    });

    if (research) consumePendingHandoff();

    awardPoints("profile.update", "Initial setup completed");
    pushActivity("Initial setup completed", "profile");

    setIsSubmitting(false);
    showToast("Setup complete — welcome to Ignition.");
    navigate("/");
  };

  return (
    <div>
      {/* Dynamic Header */}
      <ApplicationHeader
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        applicationId={user?.id ?? "—"}
      />

      {/* Render Current Step Component */}
      {currentStep === 1 && (
        <AcademicDetails
          initialValues={education}
          isFirstStep
          onNext={handleAcademicNext}
          onPrevious={goToPreviousStep}
          isLastStep={false}
        />
      )}
      {currentStep === 2 && (
        <StudentPrefences
          initialValues={defaultsFromResearch(research)}
          onNext={handleFinish}
          onPrevious={goToPreviousStep}
          isLastStep
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default MultiStepForm;
