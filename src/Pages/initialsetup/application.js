import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ApplicationHeader from "../../components/initialsetup/myApplicationHeading";
import AcademicDetails from "../../components/initialsetup/academicDetails";
import StudentPrefences from "../../components/initialsetup/StudentPrefences";
import SelectedCourseCard from "../../components/apply/SelectedCourseCard";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";
import formOptions from "../../data/formOptions.json";
import { subjectLabel } from "../../api/catalogue";
import {
  consumePendingHandoff,
  mergeResearchIntoPreferences,
  peekPendingHandoff,
} from "../../lib/handoff";
import { getPendingIntent } from "../../lib/applyIntent";

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
    formOptions.courses.find((option) => option === subjectLabel(subject)) ??
    "";

  return {
    // The public platform is UK-only, so arriving from it is the answer.
    country: ["United Kingdom"],
    course,
  };
};

/**
 * What the student already told us by pressing Apply Now.
 *
 * `defaultsFromResearch` above prefills from a *shortlist* — several courses
 * somebody browsed, which is a hint. This is different in kind: one course the
 * student explicitly pressed Apply on, which is a decision. So it outranks the
 * shortlist, and the subject is filled in from it rather than guessed.
 *
 * Only exact matches reach `formOptions.courses`, for the same reason as
 * before: the wizard's dropdown is a fixed vocabulary and "MSc Computer
 * Science" may have no entry in it. What the student always sees regardless is
 * the course itself, on the card — the dropdown is a secondary detail about
 * their broader preferences, not the record of what they are applying for.
 */
const defaultsFromIntent = (intent, fallback) => {
  if (!intent?.course) return fallback;
  const { course_name: name } = intent.course;
  const course =
    formOptions.courses.find((option) => option === name) ??
    fallback?.course ??
    "";
  return { country: ["United Kingdom"], course };
};

/**
 * Initial setup wizard. Each step hands its values up here and the whole thing
 * is committed to the student profile via `updateUser` at the end.
 *
 * ## The course is not asked for twice
 *
 * A student who reached this wizard from Apply Now has already chosen their
 * course, and the system has always known which one — it just used to throw it
 * away at the registration boundary and open step 2 with an empty "which
 * course interests you?" dropdown. The intent (see `lib/applyIntent`) is read
 * here, shown as a card, and used to prefill. Finishing the wizard then lands
 * on `/apply/<slug>` rather than the dashboard, because the next thing the
 * student wants is the application they came to make.
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
  // Read from the server, not from the tab: by this point the intent has been
  // claimed against the account (AuthContext), so the account is where it
  // lives. Survives a reload and a different device.
  const [intent, setIntent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPendingIntent().then((value) => {
      if (!cancelled) setIntent(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

    // Straight into the application they came here to make. Landing on the
    // dashboard would ask the student to find the course a third time.
    const slug = intent?.course?.course_slug;
    if (slug) {
      showToast("Profile saved — let's finish your application.");
      navigate(`/apply/${slug}`);
      return;
    }
    showToast("Setup complete — welcome to Ignition.");
    navigate("/");
  };

  return (
    // One column for the whole wizard — the header's step rail and the step's
    // panel share a left edge, which is what makes the rail read as a rail for
    // the thing below it rather than as a banner of its own.
    <div className="mx-auto w-full max-w-[1060px] px-5 pb-16 pt-10 sm:px-8 sm:pt-12">
      <ApplicationHeader
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        applicationId={user?.id ?? "—"}
      />

      {/* The course the student pressed Apply on, above the form and on both
          steps. Not a step of its own: there is nothing to decide here, and a
          confirmation step for a decision already made is a click that only
          adds doubt. */}
      {intent?.course ? (
        <div className="mt-6">
          <SelectedCourseCard course={intent.course} />
          <p className="mt-2 text-[13.5px] font-medium leading-[1.55] text-ink-muted">
            We have kept this from the course you opened. Fill in your details below and we will take
            you straight to it — you can add more courses afterwards.
          </p>
        </div>
      ) : null}

      <div className="mt-8">
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
            initialValues={defaultsFromIntent(intent, defaultsFromResearch(research))}
            onNext={handleFinish}
            onPrevious={goToPreviousStep}
            isLastStep
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
};

export default MultiStepForm;
