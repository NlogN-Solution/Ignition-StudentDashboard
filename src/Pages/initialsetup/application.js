import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import ApplicationHeader from "../../components/initialsetup/myApplicationHeading";
import AcademicDetails from "../../components/initialsetup/academicDetails";
import StudentPrefences from "../../components/initialsetup/StudentPrefences";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";

const TOTAL_STEPS = 2;

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
      preferences: {
        ...user.preferences,
        destinations: preferences.country,
        intendedStudyArea: preferences.course,
        studyMode: preferences.studyMode,
        feeStructure: preferences.feeStructure,
      },
      testScores: {
        language: preferences.languageTests,
        other: preferences.otherTests,
      },
      onboardingCompleted: true,
    });

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
