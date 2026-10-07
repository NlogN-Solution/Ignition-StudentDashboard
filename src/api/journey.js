import { apiGet, apiPost, apiPut } from "./client";

/**
 * The application journey (backend: routes/journey.py).
 *
 * One read returns every stage with its checklist, review rounds and slots,
 * and every action answers with the whole journey again — so a screen only
 * ever swaps one journey object for the next, and never has to merge a partial
 * response into what it already drew.
 */

const mapItem = (item) => ({
  id: item.id,
  documentType: item.document_type,
  label: item.custom_label || "Document",
  isRequired: item.is_required,
  status: item.status,
  documentId: item.document_id,
  notes: item.notes,
});

const mapSubmission = (s) => ({
  id: s.id,
  round: s.round,
  bodyText: s.body_text,
  documentId: s.document_id,
  documentName: s.document_name,
  externalUrl: s.external_url,
  status: s.status,
  feedback: s.feedback,
  feedbackDocumentIds: s.feedback_document_ids ?? [],
  reviewedAt: s.reviewed_at,
  createdAt: s.created_at,
});

const mapSlot = (slot) => ({
  id: slot.id,
  attempt: slot.attempt,
  startsAt: slot.starts_at,
  endsAt: slot.ends_at,
  location: slot.location,
  meetingLink: slot.meeting_link,
  status: slot.status,
  outcome: slot.outcome,
  outcomeNote: slot.outcome_note,
  appointmentId: slot.appointment_id,
});

const mapStep = (step) => ({
  id: step.id,
  key: step.key,
  name: step.name,
  description: step.description,
  kind: step.kind,
  config: step.config ?? {},
  status: step.status,
  order: step.order,
  startedAt: step.started_at,
  completedAt: step.completed_at,
  progress: step.progress ?? {},
  checklist: (step.checklist ?? []).map(mapItem),
  submissions: (step.submissions ?? []).map(mapSubmission),
  slots: (step.slots ?? []).map(mapSlot),
  waitingOn: step.waiting_on,
});

const mapJourney = (data) => ({
  applicationId: data.application_id,
  templateName: data.template_name,
  status: data.status,
  studyLevel: data.study_level,
  hasStudyGap: data.has_study_gap,
  currentStepId: data.current_step_id,
  progressPercent: data.progress_percent,
  steps: (data.steps ?? []).map(mapStep),
});

/**
 * The journey, or null when the application has none (404) or its workflow
 * is a plain one with no interactive stages — both mean "draw the old
 * tracker", which is not an error.
 */
export const getJourney = async (applicationId) => {
  try {
    const journey = mapJourney(await apiGet(`/applications/${applicationId}/journey`));
    return journey.steps.some((step) => step.kind !== "info") ? journey : null;
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
};

const base = (applicationId) => `/applications/${applicationId}/journey`;

export const setStudyGap = async (applicationId, hasStudyGap) =>
  mapJourney(await apiPut(`${base(applicationId)}/study-gap`, { has_study_gap: hasStudyGap }));

export const submitDocumentsStage = async (applicationId, stepId) =>
  mapJourney(await apiPost(`${base(applicationId)}/steps/${stepId}/submit`));

export const submitReview = async (applicationId, stepId, { bodyText, documentId, externalUrl }) =>
  mapJourney(
    await apiPost(`${base(applicationId)}/steps/${stepId}/submissions`, {
      body_text: bodyText || null,
      document_id: documentId || null,
      external_url: externalUrl || null,
    })
  );

export const bookSlot = async (applicationId, slotId) =>
  mapJourney(await apiPost(`${base(applicationId)}/slots/${slotId}/book`));

export const tickTask = async (applicationId, stepId, key, done) =>
  mapJourney(await apiPut(`${base(applicationId)}/steps/${stepId}/tasks/${key}`, { done }));
