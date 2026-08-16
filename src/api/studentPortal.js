// Real backend calls for everything AppDataContext used to seed from
// src/data/*.json. Each function returns data already shaped like the JSON
// fixtures it replaces — snake_case backend fields mapped to the camelCase
// shape every existing component already reads — so AppDataContext's render
// logic doesn't have to change, only where its state comes from.
//
// KNOWN GAP, by backend design (see IGNITION_PLATFORM_PLAN.md Phase 6/7):
// applications, appointment reschedule/cancel, and document removal have no
// student-facing write endpoint — a counsellor opens an application and
// books a confirmed appointment, the same way staff open a `VisaCase`. Those
// mutations in AppDataContext stay local-only, same posture as
// AuthContext's `profileImage`.
import { apiDelete, apiGet, apiPatch, apiPost, apiPut, getCurrentUserId } from "./client";

const toIsoOrNull = (value) => (value ? new Date(value).toISOString() : null);

/* ------------------------------------------------------------------ catalog --- */

// `ProgramRead`/`UniversityRead` don't embed related names (only ids), and
// there's no per-id detail route — the whole catalog is seed-sized (a
// handful of universities/programs), so it's fetched in full and joined
// client-side rather than paginated.

const DEGREE_LEVEL_LABELS = {
  certificate: "Certificate",
  diploma: "Diploma",
  advanced_diploma: "Advanced Diploma",
  bachelor: "Bachelor's",
  postgraduate_diploma: "Postgraduate Diploma",
  master: "Master's",
  doctorate: "Doctorate",
};

const CURRENCY_SYMBOLS = { USD: "$", AUD: "A$", GBP: "£", EUR: "€", CAD: "C$", NPR: "Rs " };

const formatDuration = (months) => {
  if (!months) return "";
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} year${years === 1 ? "" : "s"}`;
  }
  return `${months} month${months === 1 ? "" : "s"}`;
};

const formatTuition = (amount, currency) => {
  if (amount === null || amount === undefined) return "";
  const symbol = CURRENCY_SYMBOLS[currency] ?? (currency ? `${currency} ` : "$");
  return `${symbol}${Number(amount).toLocaleString()}`;
};

const mapUniversity = (u, countryName) => ({
  id: u.id,
  name: u.name,
  country: countryName ?? "",
  city: u.city ?? "",
  worldRanking: u.ranking ?? null,
  acceptanceRate: u.acceptance_rate ?? null,
  faculties: u.faculties ?? [],
  campusType: u.campus_type ?? "",
  highlights: u.highlights ?? [],
});

const mapProgram = (p, universitiesById) => {
  const university = universitiesById.get(p.university_id);
  return {
    id: p.id,
    name: p.name,
    universityId: p.university_id,
    universityName: university?.name ?? "",
    faculty: p.field_of_study ?? "",
    level: DEGREE_LEVEL_LABELS[p.degree_level] ?? p.degree_level ?? "",
    image: p.image_url,
    tuitionFee: formatTuition(p.tuition_fee, p.currency),
    tuitionFeeUsd: p.tuition_fee ?? 0,
    type: p.course_type ?? "",
    duration: formatDuration(p.duration_months),
    intakes: p.intakes_summary?.length ? p.intakes_summary : p.intake ? [p.intake] : [],
    description: "",
    highlights: p.highlights ?? [],
    outcomes: p.outcomes ?? [],
    requirements: p.requirements ?? { academic: [], documents: [] },
    keyDates: p.key_dates ?? {},
  };
};

/** Whole catalog, joined client-side (programs → university → country). */
export const getCatalogApi = async () => {
  const [countriesRes, universitiesRes, programsRes] = await Promise.all([
    apiGet("/student/catalog/countries?limit=200"),
    apiGet("/student/catalog/universities?limit=200"),
    apiGet("/student/catalog/programs?limit=200"),
  ]);
  const countryNameById = new Map(countriesRes.items.map((c) => [c.id, c.name]));
  const universitiesById = new Map(universitiesRes.items.map((u) => [u.id, u]));

  const universities = universitiesRes.items.map((u) => mapUniversity(u, countryNameById.get(u.country_id)));
  const courses = programsRes.items.map((p) => mapProgram(p, universitiesById));
  return { courses, universities };
};

/* ---------------------------------------------------------------- applications --- */

const mapApplication = (a) => ({
  id: a.id,
  studentId: a.student_id,
  universityId: a.program?.university_id ?? null,
  universityName: a.program?.university_name ?? "",
  universityCountry: a.program?.university_country ?? "",
  courseId: a.program_id,
  courseName: a.program?.name ?? "",
  degreeLevel: DEGREE_LEVEL_LABELS[a.program?.degree_level] ?? a.program?.degree_level ?? "",
  intake: a.program?.intake ?? "",
  status: a.status,
  applicationDate: a.application_date,
  submittedAt: toIsoOrNull(a.submission_date),
  offerReceivedDate: a.offer_received_date,
  visaAppliedDate: a.visa_applied_date,
  visaDecisionDate: a.visa_decision_date,
  enrollmentDate: a.enrollment_date,
  tuitionFee: a.tuition_fee,
  scholarshipAmount: a.scholarship_amount,
  universityApplicationId: a.university_application_id,
  deadline: null,
  progress: null,
  missingDocumentIds: [],
  notes: a.remarks ?? "",
  counsellorName: a.counsellor?.full_name ?? "",
  // Not fetched here — the timeline is a separate, per-application call
  // (getApplicationTimeline) since /me/applications never embeds it.
  timeline: [],
});

export const getApplicationsFor = async () => {
  const data = await apiGet("/student/me/applications?limit=100");
  return data.items.map(mapApplication);
};

export const getApplicationTimeline = async (applicationId) => {
  const steps = await apiGet(`/student/me/applications/${applicationId}/timeline`);
  // The backend only ever records what happened, not what's "current" — the
  // most recent transition is the application's live status, everything
  // before it is history.
  return steps.map((step, index) => ({
    id: step.id,
    label: step.new_status,
    date: toIsoOrNull(step.created_at),
    state: index === steps.length - 1 ? "current" : "completed",
    fromStatus: step.old_status,
    remarks: step.remarks,
  }));
};

/* ------------------------------------------------------- application checklist --- */

// A staff-requested document, tied to one application. Lives at the shared
// /applications/{id}/checklist path (not /student/me/...) — ownership is
// checked there, same as any staff caller, since ChecklistService has always
// been a single code path for both sides.

const mapApplicationChecklistItem = (item) => ({
  id: item.id,
  applicationId: item.application_id,
  documentType: item.document_type,
  label: item.custom_label || DOCUMENT_TYPE_LABELS[item.document_type] || "Document",
  isRequired: item.is_required,
  status: item.status,
  documentId: item.document_id,
  notes: item.notes,
});

export const getApplicationChecklistApi = async (applicationId) => {
  const data = await apiGet(`/applications/${applicationId}/checklist`);
  return data.map(mapApplicationChecklistItem);
};

/** The only checklist write a student has: link an uploaded document to the
 * item that requested it. Verifying/rejecting is staff-only (enforced
 * server-side) and happens via the underlying Document, not this call. */
export const linkChecklistItemDocumentApi = async (applicationId, itemId, documentId) => {
  const data = await apiPatch(`/applications/${applicationId}/checklist/${itemId}`, { document_id: documentId });
  return mapApplicationChecklistItem(data);
};

/* ------------------------------------------------------------------ documents --- */

// The backend's `DocumentType` enum (app/models/enums.py) — used both to
// label already-uploaded documents and to populate the "upload a document
// type nobody requested yet" picker.
export const DOCUMENT_TYPE_LABELS = {
  passport: "Passport",
  citizenship: "Citizenship Certificate",
  national_id: "National ID",
  academic_transcript: "Academic Transcript",
  academic_certificate: "Academic Certificate",
  provisional_certificate: "Provisional Certificate",
  character_certificate: "Character Certificate",
  english_test: "English Test Score",
  cv: "CV / Resume",
  statement_of_purpose: "Statement of Purpose",
  recommendation_letter: "Recommendation Letter",
  offer_letter: "Offer Letter",
  visa: "Visa Document",
  financial_document: "Financial Document",
  medical_report: "Medical Report",
  photo: "Photograph",
  other: "Other",
};

const mapDocument = (d) => ({
  id: d.id,
  studentId: d.student_id,
  title: d.title || DOCUMENT_TYPE_LABELS[d.document_type] || d.original_file_name,
  description: "",
  requirements: "",
  category: d.document_type,
  required: false,
  status: d.status,
  file: {
    name: d.original_file_name,
    sizeBytes: d.file_size,
    mimeType: d.mime_type,
    uploadedAt: toIsoOrNull(d.created_at),
  },
  expiryDate: d.expiry_date,
  documentType: d.document_type,
  rejectionReason: d.rejection_reason,
});

export const getDocumentsFor = async () => {
  const data = await apiGet("/student/me/documents?limit=100");
  return data.items.map(mapDocument);
};

/** The one document write a student really has: uploading a file for a given
 * `document_type` (an Ignition `DocumentType` enum value, e.g. "passport",
 * "academic_transcript" — not the same slot IDs the old JSON fixture used). */
export const uploadDocumentFile = async (documentType, file, { title, remarks } = {}) => {
  const form = new FormData();
  // Required by the route even for a student caller — the backend
  // overwrites it with the authenticated user's own id regardless.
  form.append("student_id", getCurrentUserId());
  form.append("document_type", documentType);
  form.append("file", file);
  if (title) form.append("title", title);
  if (remarks) form.append("remarks", remarks);
  const data = await apiPost("/documents/upload", form);
  return mapDocument(data);
};

/* --------------------------------------------------------------- appointments --- */

const mapAppointment = (a) => ({
  id: a.id,
  studentId: a.student_id,
  counsellorId: a.counsellor?.id ?? a.counsellor_id ?? null,
  counsellorName: a.counsellor?.full_name ?? "",
  meetingType: a.appointment_type,
  mode: a.location ? "In person" : "Video call",
  scheduledAt: toIsoOrNull(a.start_time),
  durationMinutes:
    a.start_time && a.end_time
      ? Math.round((new Date(a.end_time) - new Date(a.start_time)) / 60000)
      : 30,
  status: a.status,
  location: a.location,
  meetingLink: a.meeting_link,
  agenda: a.description ?? "",
  notes: a.notes ?? "",
});

export const getAppointmentsFor = async () => {
  const data = await apiGet("/student/me/appointments?limit=100");
  return data.items.map(mapAppointment);
};

/** Only a *request* — the backend sets time/location/counsellor on
 * confirmation. `mode`/`counsellorId`/`durationMinutes` from the old local
 * simulation have nothing to bind to here and are dropped. */
export const requestAppointmentApi = async ({ meetingType, agenda, preferredDate }) => {
  const data = await apiPost("/student/me/appointments/request", {
    title: meetingType,
    appointment_type: "consultation",
    preferred_date: preferredDate,
    description: agenda,
  });
  return mapAppointment(data);
};

/* ------------------------------------------------------------- notifications --- */

const mapNotification = (n) => ({
  id: n.id,
  studentId: n.user_id,
  title: n.title,
  description: n.message,
  type: n.type,
  isRead: n.is_read,
  createdAt: n.created_at,
});

export const getNotificationsFor = async () => {
  const data = await apiGet("/student/me/notifications?limit=100");
  return data.items.map(mapNotification);
};

// Not under /student — the per-notification mark-read route only exists on
// the generic /notifications router, ownership-checked there instead.
export const markNotificationReadApi = (id) => apiPost(`/notifications/${id}/read`);

export const markAllNotificationsReadApi = () => apiPost("/student/me/notifications/read-all");

/* -------------------------------------------------------- checklist ("tasks") --- */

// The portal's "My Checklist" / `tasksChecklist.json` is the Phase 6 journey
// checklist (/student/me/checklist) — dependency-gated, per-student — not the
// generic staff-assignable `Task` model behind /student/me/tasks.

const mapChecklistItem = (item) => ({
  id: item.id,
  key: item.key,
  title: item.title,
  description: item.description,
  stage: item.stage,
  order: item.order,
  dueDate: item.due_date,
  completed: item.is_complete,
  completedAt: item.completed_at,
  dependsOn: item.depends_on_key ? [item.depends_on_key] : [],
  isCustom: item.is_custom,
  isLocked: item.is_locked,
});

export const getTasksFor = async () => {
  const data = await apiGet("/student/me/checklist");
  return data.items.map(mapChecklistItem);
};

export const setChecklistItemCompleted = async (itemId, completed) => {
  const data = await apiPatch(`/student/me/checklist/${itemId}`, { completed });
  return mapChecklistItem(data);
};

/* -------------------------------------------------------------- interviews --- */

const mapInterviewSessionSummary = (s) => ({
  id: s.id,
  typeId: null,
  typeName: s.type_name,
  status: s.status === "completed" ? "completed" : "in-progress",
  startedAt: s.started_at,
  completedAt: s.completed_at,
  score: s.score,
  feedbackId: s.feedback_band ?? null,
  answers: [],
});

export const getInterviewSessionsFor = async () => {
  const data = await apiGet("/student/me/interviews");
  return data.items.map(mapInterviewSessionSummary);
};

// The catalog has no notion of a card color — cycle through the same three
// accents the old fixture used so the landing page keeps its look.
const INTERVIEW_TYPE_ACCENTS = ["blue", "purple", "green"];

const mapInterviewQuestion = (q) => ({
  id: q.id,
  prompt: q.prompt,
  hint: q.hint,
  maxScore: q.max_score,
  order: q.order,
});

const mapInterviewType = (t, index) => ({
  id: t.id,
  name: t.name,
  description: t.description,
  questionCount: t.questions?.length ?? 0,
  durationMinutes: t.duration_minutes,
  passingScore: t.passing_score,
  accent: INTERVIEW_TYPE_ACCENTS[index % INTERVIEW_TYPE_ACCENTS.length],
  questions: (t.questions ?? []).map(mapInterviewQuestion),
});

export const getInterviewTypesApi = async () => {
  const data = await apiGet("/student/catalog/interview-types");
  return data.map(mapInterviewType);
};

// AppDataContext.startInterview reads this raw (session.started_at,
// session.type.id/name/questions) — only the nested question list needs
// snake_case -> camelCase mapping, since that's what Interviews.js renders.
export const startInterviewApi = async (typeId) => {
  const data = await apiPost("/student/me/interviews", { type_id: typeId });
  return {
    ...data,
    type: data.type ? { ...data.type, questions: (data.type.questions ?? []).map(mapInterviewQuestion) } : null,
  };
};

export const answerInterviewQuestionApi = (sessionId, questionId, answerText) =>
  apiPost(`/student/me/interviews/${sessionId}/answers`, { question_id: questionId, answer_text: answerText });

export const completeInterviewApi = (sessionId) => apiPost(`/student/me/interviews/${sessionId}/complete`);

/* ------------------------------------------------------------------- points --- */

export const getPointsFor = async () => {
  const data = await apiGet("/student/me/points");
  return {
    balance: data.balance,
    ledger: data.history.map((entry) => ({
      id: entry.id,
      action: entry.action,
      label: entry.description || entry.action,
      points: entry.points,
      createdAt: entry.created_at,
    })),
  };
};

/* ----------------------------------------------------------------- progress --- */

export const getProgressFor = async () => {
  const data = await apiGet("/student/me/progress");
  return {
    completionPercentage: data.completion_percentage,
    nextMilestone: data.next_milestone,
    milestones: data.milestones.map((m) => ({
      key: m.key,
      label: m.label,
      description: m.description,
      weight: m.weight,
      order: m.order,
      completed: m.is_complete,
      completedAt: m.completed_at,
    })),
  };
};

/* -------------------------------------------------------------------- activity --- */

export const getActivityFeedFor = async () => {
  const data = await apiGet("/student/me/activity?limit=50");
  return data.items.map((entry) => ({
    id: entry.id,
    studentId: null,
    message: entry.message,
    type: entry.type,
    createdAt: entry.created_at,
  }));
};

/* ------------------------------------------------------------------- visa --- */

// KNOWN GAP: no student-facing route exists for uploading a
// VisaDocumentRequirement (no create/update endpoint, no file field on the
// wire at all) — same staff-only posture as the VisaCase itself, which is
// opened by staff rather than a student. That upload stays local-only in
// VisaContext, same pattern as AppDataContext's document/application gaps.

const mapVisaStage = (s) => ({
  id: s.id,
  label: s.label,
  description: s.description,
  date: s.date,
  state: s.state,
  order: s.order,
});

// Backend uses "not_booked"; the page's JSX checks for "not-booked".
const mapVisaAppointment = (a) => ({
  id: a.id,
  title: a.title,
  provider: a.provider,
  scheduledAt: a.scheduled_at,
  status: a.status === "not_booked" ? "not-booked" : a.status,
  note: a.note,
});

const mapVisaDocument = (d) => ({
  id: d.id,
  title: d.title,
  status: d.status,
  note: d.note,
  order: d.order,
});

const mapVisaFee = (f) => ({
  id: f.id,
  label: f.label,
  amountUsd: Number(f.amount_usd),
  dueDate: f.due_date,
  paid: f.paid,
  paidAt: f.paid_at,
});

const mapDepartureItem = (i) => ({
  id: i.id,
  title: i.title,
  completed: i.is_complete,
  completedAt: i.completed_at,
  order: i.order,
});

const mapVisaCase = (c) => ({
  id: c.id,
  applicationId: c.application_id,
  destinationCountry: c.destination_country,
  visaType: c.visa_type,
  applicationNumber: c.application_number,
  status: c.status,
  targetLodgementDate: c.target_lodgement_date,
  programmeStart: c.programme_start,
  processingEstimateWeeks: c.processing_estimate_weeks,
  stages: (c.stages ?? []).map(mapVisaStage),
  appointments: (c.appointments ?? []).map(mapVisaAppointment),
  requiredDocuments: (c.required_documents ?? []).map(mapVisaDocument),
  fees: (c.fees ?? []).map(mapVisaFee),
  departureChecklist: (c.departure_checklist ?? []).map(mapDepartureItem),
});

/** Null means "no case yet" — a counsellor hasn't opened one, same as a
 * fresh student having no applications. */
export const getVisaCaseApi = async () => {
  try {
    const data = await apiGet("/student/me/visa");
    return mapVisaCase(data);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
};

export const bookVisaAppointmentApi = async (appointmentId, scheduledAt) => {
  const data = await apiPost(`/student/me/visa/appointments/${appointmentId}/book`, {
    scheduled_at: scheduledAt,
  });
  return mapVisaAppointment(data);
};

export const cancelVisaAppointmentApi = async (appointmentId) => {
  const data = await apiPost(`/student/me/visa/appointments/${appointmentId}/cancel`);
  return mapVisaAppointment(data);
};

export const setVisaFeePaidApi = async (feeId, paid) => {
  const data = await apiPatch(`/student/me/visa/fees/${feeId}`, { paid });
  return mapVisaFee(data);
};

export const setDepartureItemCompletedApi = async (itemId, completed) => {
  const data = await apiPatch(`/student/me/visa/departure-checklist/${itemId}`, { completed });
  return mapDepartureItem(data);
};

/* --------------------------------------------------------------- finance --- */

// KNOWN GAP: no backend concept at all for a financial-document checklist,
// standalone finance documents, or student-facing payments (real money stays
// on the pre-existing /me/payments — Phase 5a's tuition-style `Payment` — and
// is never duplicated here). `checklist`/`documents`/`payments` in
// FinanceContext stay local-only. Loan disbursement "release" also has no
// write endpoint (lender-controlled) and stays a local-only optimistic
// mutation layered on top of the otherwise-real fetched loan.
//
// Country cost-of-living / currency-rate catalog data (lib/finance.js's
// `getCountryRequirement`/`summariseCosts`/`getCurrency`) is left on its
// static JSON fixture for now — deferred to the catalog-wiring task, since
// /catalog/countries/{id}/cost-of-living and /catalog/currency-rates are
// catalog endpoints, not per-student finance data.

const mapFundingSource = (f) => ({
  id: f.id,
  type: f.source_type,
  provider: f.provider,
  amount: Number(f.amount_usd),
  status: f.status,
  verification: f.verification,
  proofDocumentId: f.proof_document_id,
  remarks: f.remarks ?? "",
});

export const getFundingSourcesApi = async () => {
  const data = await apiGet("/student/me/finance/funding-sources");
  return data.map(mapFundingSource);
};

export const createFundingSourceApi = async (draft) => {
  const data = await apiPost("/student/me/finance/funding-sources", {
    source_type: draft.type,
    provider: draft.provider,
    amount_usd: draft.amount,
    remarks: draft.remarks,
  });
  return mapFundingSource(data);
};

export const updateFundingSourceApi = async (sourceId, patch) => {
  const body = {};
  if (patch.provider !== undefined) body.provider = patch.provider;
  if (patch.amount !== undefined) body.amount_usd = patch.amount;
  if (patch.remarks !== undefined) body.remarks = patch.remarks;
  const data = await apiPatch(`/student/me/finance/funding-sources/${sourceId}`, body);
  return mapFundingSource(data);
};

export const deleteFundingSourceApi = (sourceId) =>
  apiDelete(`/student/me/finance/funding-sources/${sourceId}`);

const mapLoanDocument = (d) => ({ id: d.id, name: d.name, status: d.status });

const mapLoanDisbursement = (d) => ({
  id: d.id,
  label: d.label,
  amount: Number(d.amount),
  date: d.disbursement_date,
  status: d.status,
});

const mapLoan = (l) => ({
  id: l.id,
  provider: l.provider,
  productName: l.product_name,
  approvedAmount: Number(l.approved_amount),
  disbursedAmount: Number(l.disbursed_amount),
  interestRate: l.interest_rate !== null && l.interest_rate !== undefined ? Number(l.interest_rate) : null,
  processingStatus: l.processing_status,
  sanctionedAt: l.sanctioned_at,
  expectedFullDisbursement: l.expected_full_disbursement,
  repaymentStartsAt: l.repayment_starts_at,
  tenureMonths: l.tenure_months,
  monthlyRepayment:
    l.monthly_repayment !== null && l.monthly_repayment !== undefined ? Number(l.monthly_repayment) : null,
  collateral: l.collateral,
  documents: (l.documents ?? []).map(mapLoanDocument),
  disbursements: (l.disbursements ?? []).map(mapLoanDisbursement),
});

/** Null means no loan on file yet — read-only, lender/staff-managed. */
export const getLoanApi = async () => {
  try {
    const data = await apiGet("/student/me/finance/loan");
    return mapLoan(data);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
};

// Categories have no backend id, only a unique `category` name — used as the
// frontend id too, same role the fixture's synthetic "bud-00N" ids played.
const mapBudget = (b) => ({
  plannedMonthlyIncome: b.planned_monthly_income !== null ? Number(b.planned_monthly_income) : 0,
  categories: (b.categories ?? []).map((c) => ({
    id: c.category,
    category: c.category,
    amount: Number(c.amount),
    essential: c.essential,
  })),
});

export const getBudgetApi = async () => {
  const data = await apiGet("/student/me/finance/budget");
  return mapBudget(data);
};

export const replaceBudgetApi = async (budget) => {
  const data = await apiPut("/student/me/finance/budget", {
    planned_monthly_income: budget.plannedMonthlyIncome,
    categories: budget.categories.map((c) => ({
      category: c.category,
      amount: c.amount,
      essential: c.essential,
    })),
  });
  return mapBudget(data);
};

const mapSavingsGoal = (s) => ({
  kind: s.kind,
  currentSavings: Number(s.current_savings),
  monthlyContribution:
    s.monthly_contribution !== null && s.monthly_contribution !== undefined ? Number(s.monthly_contribution) : null,
  targetDate: s.target_date,
  recommendedMonths: s.recommended_months ?? null,
});

export const getSavingsGoalsApi = async () => {
  const data = await apiGet("/student/me/finance/savings");
  return data.map(mapSavingsGoal);
};

export const upsertSavingsGoalApi = async (kind, patch) => {
  const data = await apiPut(`/student/me/finance/savings/${kind}`, {
    current_savings: patch.currentSavings,
    monthly_contribution: patch.monthlyContribution ?? null,
    target_date: patch.targetDate ?? null,
    recommended_months: patch.recommendedMonths ?? null,
  });
  return mapSavingsGoal(data);
};

/* -------------------------------------------------------------- saved / compare --- */

export const getSavedItemsApi = async () => {
  const [courses, universities, compare] = await Promise.all([
    apiGet("/student/me/saved/courses?limit=100"),
    apiGet("/student/me/saved/universities?limit=100"),
    apiGet("/student/me/compare"),
  ]);
  return {
    courseIds: courses.items.map((i) => i.program_id),
    universityIds: universities.items.map((i) => i.university_id),
    compareCourseIds: compare.items.map((i) => i.program_id),
    maxCompare: compare.max_items,
  };
};

export const saveCourseApi = (programId) => apiPost("/student/me/saved/courses", { item_id: programId });
export const unsaveCourseApi = (programId) => apiDelete(`/student/me/saved/courses/${programId}`);
export const saveUniversityApi = (universityId) =>
  apiPost("/student/me/saved/universities", { item_id: universityId });
export const unsaveUniversityApi = (universityId) => apiDelete(`/student/me/saved/universities/${universityId}`);
export const addCompareCourseApi = (programId) => apiPost("/student/me/compare", { item_id: programId });
export const removeCompareCourseApi = (programId) => apiDelete(`/student/me/compare/${programId}`);

/* ------------------------------------------------------------------ dashboard --- */

export const getDashboard = () => apiGet("/student/me/dashboard");

/* --------------------------------------------------------------- preferences --- */

export const getPreferencesApi = () => apiGet("/student/me/preferences");
export const updatePreferencesApi = (patch) => apiPatch("/student/me/preferences", patch);

/* -------------------------------------------------------------------- messages --- */

const mapMessage = (m) => ({
  id: m.id,
  isFromStudent: m.is_from_student,
  body: m.body,
  isRead: m.is_read,
  createdAt: m.created_at,
  senderName: m.sender?.full_name ?? "",
});

export const getMessagesApi = async () => {
  const data = await apiGet("/student/me/messages?limit=200");
  return { items: data.items.map(mapMessage), unreadCount: data.unread_count };
};

export const sendMessageApi = async (body) => {
  const data = await apiPost("/student/me/messages", { body });
  return mapMessage(data);
};

export const markAllMessagesReadApi = () => apiPost("/student/me/messages/read-all");

/* ------------------------------------------------- education / work experience --- */

const mapEducationEntry = (e) => ({
  id: e.id,
  institutionName: e.institution_name,
  degreeLevel: e.degree_level,
  fieldOfStudy: e.field_of_study,
  startDate: e.start_date,
  endDate: e.end_date,
  grade: e.grade,
  isCompleted: e.is_completed,
});

export const getEducationHistoryApi = async (userId) => {
  const data = await apiGet(`/users/${userId}/education`);
  return data.map(mapEducationEntry);
};

export const addEducationHistoryApi = async (userId, entry) => {
  const data = await apiPost(`/users/${userId}/education`, {
    institution_name: entry.institutionName,
    degree_level: entry.degreeLevel || null,
    field_of_study: entry.fieldOfStudy || null,
    start_date: entry.startDate || null,
    end_date: entry.endDate || null,
    grade: entry.grade || null,
    is_completed: entry.isCompleted ?? true,
  });
  return mapEducationEntry(data);
};

export const updateEducationHistoryApi = async (userId, entryId, entry) => {
  const data = await apiPatch(`/users/${userId}/education/${entryId}`, {
    institution_name: entry.institutionName,
    degree_level: entry.degreeLevel || null,
    field_of_study: entry.fieldOfStudy || null,
    start_date: entry.startDate || null,
    end_date: entry.endDate || null,
    grade: entry.grade || null,
    is_completed: entry.isCompleted ?? true,
  });
  return mapEducationEntry(data);
};

export const deleteEducationHistoryApi = (userId, entryId) => apiDelete(`/users/${userId}/education/${entryId}`);

const mapExperienceEntry = (e) => ({
  id: e.id,
  companyName: e.company_name,
  jobTitle: e.job_title,
  startDate: e.start_date,
  endDate: e.end_date,
  isCurrent: e.is_current,
  description: e.description,
});

export const getWorkExperienceApi = async (userId) => {
  const data = await apiGet(`/users/${userId}/experience`);
  return data.map(mapExperienceEntry);
};

export const addWorkExperienceApi = async (userId, entry) => {
  const data = await apiPost(`/users/${userId}/experience`, {
    company_name: entry.companyName,
    job_title: entry.jobTitle,
    start_date: entry.startDate || null,
    end_date: entry.endDate || null,
    is_current: entry.isCurrent ?? false,
    description: entry.description || null,
  });
  return mapExperienceEntry(data);
};

export const updateWorkExperienceApi = async (userId, entryId, entry) => {
  const data = await apiPatch(`/users/${userId}/experience/${entryId}`, {
    company_name: entry.companyName,
    job_title: entry.jobTitle,
    start_date: entry.startDate || null,
    end_date: entry.endDate || null,
    is_current: entry.isCurrent ?? false,
    description: entry.description || null,
  });
  return mapExperienceEntry(data);
};

export const deleteWorkExperienceApi = (userId, entryId) => apiDelete(`/users/${userId}/experience/${entryId}`);
