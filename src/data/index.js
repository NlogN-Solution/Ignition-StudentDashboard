// Single source of truth for every screen in the app.
//
// These are plain JSON files imported at build time — there is no network layer
// anywhere in this app. The shapes deliberately mirror what a REST response
// would look like so each `get*` below can later be swapped for a real endpoint
// without touching the components that consume it.

import activityFeed from "./activityFeed.json";
import appointments from "./appointments.json";
import applications from "./applications.json";
import blogs from "./blogs.json";
import counsellors from "./counsellors.json";
import countryFinance from "./countryFinance.json";
import courses from "./courses.json";
import currencyRates from "./currencyRates.json";
import documents from "./documents.json";
import finance from "./finance.json";
import formOptions from "./formOptions.json";
import ignitionPoints from "./ignitionPoints.json";
import interviewFeedback from "./interviewFeedback.json";
import interviewTypes from "./interviewTypes.json";
import interviews from "./interviews.json";
import navigation from "./navigation.json";
import notifications from "./notifications.json";
import progressMilestones from "./progressMilestones.json";
import savedItems from "./savedItems.json";
import students from "./students.json";
import tasksChecklist from "./tasksChecklist.json";
import universities from "./universities.json";
import visa from "./visa.json";

export {
  activityFeed,
  appointments,
  applications,
  blogs,
  counsellors,
  countryFinance,
  courses,
  currencyRates,
  documents,
  finance,
  formOptions,
  ignitionPoints,
  interviewFeedback,
  interviewTypes,
  interviews,
  navigation,
  notifications,
  progressMilestones,
  savedItems,
  students,
  universities,
  visa,
};

// Keeps the imported JSON modules immutable — every consumer gets its own copy
// to seed local state from.
const clone = (value) => JSON.parse(JSON.stringify(value));

const byStudent = (collection, studentId) =>
  clone(collection).filter((item) => item.studentId === studentId);

export const getStudentById = (studentId) =>
  clone(students.find((student) => student.id === studentId) || null);

export const getCounsellorById = (counsellorId) =>
  clone(counsellors.find((counsellor) => counsellor.id === counsellorId) || null);

export const getApplicationsFor = (studentId) => byStudent(applications, studentId);
export const getDocumentsFor = (studentId) => byStudent(documents, studentId);
export const getAppointmentsFor = (studentId) => byStudent(appointments, studentId);
export const getNotificationsFor = (studentId) => byStudent(notifications, studentId);
export const getActivityFeedFor = (studentId) => byStudent(activityFeed, studentId);
export const getTasksFor = (studentId) => byStudent(tasksChecklist, studentId);
export const getInterviewSessionsFor = (studentId) =>
  byStudent(interviews.sessions, studentId);

export const getPointsLedgerFor = (studentId) =>
  byStudent(ignitionPoints.ledger, studentId);

export const getFinanceFor = (studentId) =>
  finance.studentId === studentId ? clone(finance) : null;

export const getVisaFor = (studentId) =>
  visa.studentId === studentId ? clone(visa) : null;

export const getQuestionsForType = (typeId) =>
  clone(
    interviews.questionSets.find((set) => set.typeId === typeId)?.questions || []
  );

export const getSavedItems = () => clone(savedItems);

export const getUniversityById = (universityId) =>
  clone(universities.find((university) => university.id === universityId) || null);

export const getCourseById = (courseId) =>
  clone(courses.find((course) => course.id === courseId) || null);

/** Feedback band for a score, highest matching band wins. */
export const getFeedbackForScore = (score) =>
  clone(
    [...interviewFeedback]
      .sort((a, b) => b.minScore - a.minScore)
      .find((band) => score >= band.minScore) || interviewFeedback[0]
  );
