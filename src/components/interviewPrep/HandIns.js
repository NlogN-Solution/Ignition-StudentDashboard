import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, Clock, Hourglass, Loader2, Paperclip, Video } from "lucide-react";

import { submitReview } from "../../api/journey";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";
import { parseApiErrorDetail } from "../../lib/apiErrors";
import { formatDateTime } from "../../lib/simulate";
import { bestSessionByType } from "../../lib/interviewPractice";
import { buttonClass } from "../dashboard/ui";
import { Chip, Note, SubmissionHistory } from "../journey/JourneyStages";

/**
 * What the student hands in from the Interview Preparation page — the same
 * journey submissions the journey screen takes (`submitReview`), so the
 * counsellor reviews them in the one place they already do.
 *
 * - Interview Preparation: a written template, compiled into one text hand-in
 *   with a heading per answer.
 * - Interview Recording: the scores from the three practice interviews, plus
 *   an optional recording. The backend refuses it until all three are done
 *   (`requires_practice`); the button says so before it is ever pressed.
 */

const errorMessage = (error, fallback) => parseApiErrorDetail(error?.data?.detail).message || fallback;

const READINESS_FIELDS = [
  { key: "why_uk", label: "Why do you want to study in the UK?", hint: "The course, the sector, recognition at home — not immigration." },
  { key: "why_course", label: "Why this course?", hint: "Your background → named modules → your career goal." },
  { key: "why_university", label: "Why this university?", hint: "What you compared, and what made this one stand out." },
  { key: "funding", label: "How are your studies funded?", hint: "Your sponsor, their occupation and income, and where the funds are held." },
  { key: "after", label: "What will you do after you graduate?", hint: "A specific role, sector and place." },
];

/** Long answers are lost to a closed tab otherwise; kept in this browser only. */
const draftKey = (stepId) => `ignition.interviewReadiness.${stepId}`;
const loadDraft = (stepId) => {
  try {
    return JSON.parse(window.localStorage.getItem(draftKey(stepId)) ?? "{}") || {};
  } catch {
    return {};
  }
};
const saveDraft = (stepId, value) => {
  try {
    if (value) window.localStorage.setItem(draftKey(stepId), JSON.stringify(value));
    else window.localStorage.removeItem(draftKey(stepId));
  } catch {
    // Storage blocked: the draft lasts for this visit only.
  }
};

/** Where a review step stands, from the student's side. */
const stepState = (step) => {
  const latest = step.submissions[step.submissions.length - 1];
  if (step.status === "completed") return "verified";
  if (step.status !== "current") return step.status === "pending" ? "locked" : "closed";
  if (latest?.status === "submitted") return "waiting";
  return latest ? "resubmit" : "open";
};

const StateNote = ({ state, lockedText }) =>
  state === "verified" ? (
    <Note tone="done" title="Verified by your counsellor" />
  ) : state === "waiting" ? (
    <Note tone="wait" icon={Clock} title="Submitted for verification">
      Your counsellor will verify it or send feedback.
    </Note>
  ) : state === "locked" ? (
    <Note tone="navy" icon={Hourglass} title="Not open yet">
      {lockedText}
    </Note>
  ) : state === "closed" ? (
    <Note tone="navy" title="No longer needed">
      Your application has moved past this stage.
    </Note>
  ) : null;

const HandInCard = ({ title, description, state, children }) => (
  <div className="rounded-2xl border border-hairline bg-white p-5 shadow-card sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h3 className="font-semibold text-navy-900">{title}</h3>
        <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
      </div>
      {state === "verified" && <Chip tone="done">Verified</Chip>}
      {state === "waiting" && <Chip tone="wait">With your counsellor</Chip>}
      {state === "resubmit" && <Chip tone="wait">Feedback to act on</Chip>}
    </div>
    {children}
  </div>
);

/* ------------------------------------------------------------ readiness --- */

const ReadinessHandIn = ({ applicationId, step, onJourney }) => {
  const { uploadDocument } = useAppData();
  const { showToast } = useToast();
  const state = stepState(step);
  const [answers, setAnswers] = useState(() => loadDraft(step.id));
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => {
    const hasText = Object.values(answers).some((v) => v?.trim());
    saveDraft(step.id, hasText ? answers : null);
  }, [answers, step.id]);

  const complete = READINESS_FIELDS.every((f) => answers[f.key]?.trim());
  const canSubmit = state === "open" || state === "resubmit";

  const send = async () => {
    setBusy(true);
    try {
      let documentId = null;
      if (file) documentId = (await uploadDocument("other", file, { applicationId })).id;
      const bodyText = READINESS_FIELDS.map((f) => `## ${f.label}\n${answers[f.key].trim()}`).join("\n\n");
      onJourney(await submitReview(applicationId, step.id, { bodyText, documentId }));
      setAnswers({});
      setFile(null);
      saveDraft(step.id, null);
      showToast("Sent to your counsellor for verification.");
    } catch (error) {
      showToast(errorMessage(error, "Couldn't send that. Please try again."), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <HandInCard
      title="Your written answers"
      description="Once you've read the guides, answer these in your own words. Your counsellor reviews them before your interviews."
      state={state}
    >
      <SubmissionHistory submissions={step.submissions} />
      {canSubmit ? (
        <div className="mt-5 space-y-4">
          {READINESS_FIELDS.map((field) => (
            <div key={field.key}>
              <label htmlFor={`readiness-${field.key}`} className="block text-sm font-semibold text-navy-900">
                {field.label}
              </label>
              <p className="text-xs text-ink-muted">{field.hint}</p>
              <textarea
                id={`readiness-${field.key}`}
                value={answers[field.key] ?? ""}
                onChange={(event) => setAnswers((current) => ({ ...current, [field.key]: event.target.value }))}
                rows={4}
                className="mt-1.5 w-full rounded-xl border border-hairline bg-white p-3 text-sm focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-100"
              />
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInput}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-2 text-sm text-ink-soft hover:border-navy-200 hover:text-navy-900"
            >
              <Paperclip className="h-4 w-4" aria-hidden />
              {file ? "Change file" : "Attach notes (optional)"}
            </button>
            {file && <span className="truncate text-xs text-ink-muted">{file.name}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={buttonClass()} disabled={!complete || busy} onClick={send}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {state === "resubmit" ? "Resubmit" : "I'm ready — send to my counsellor"}
            </button>
            {!complete && <span className="text-xs text-ink-muted">Answer all five to send. Your draft is saved in this browser.</span>}
          </div>
        </div>
      ) : (
        <StateNote state={state} lockedText="This opens once your offer letter is in." />
      )}
    </HandInCard>
  );
};

/* ------------------------------------------------------------ recording --- */

const RecordingHandIn = ({ applicationId, step, interviewTypes, onJourney }) => {
  const { uploadDocument, interviewSessions } = useAppData();
  const { showToast } = useToast();
  const state = stepState(step);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef(null);

  const requiredKeys = step.config.requires_practice ?? interviewTypes.map((t) => t.key);
  // Only sets the catalogue still offers — the backend skips retired ones too.
  const required = interviewTypes.filter((t) => requiredKeys.includes(t.key));
  const best = bestSessionByType(interviewSessions);
  const doneCount = required.filter((t) => best[t.key]).length;
  const allDone = required.length > 0 && doneCount === required.length;
  const canSubmit = state === "open" || state === "resubmit";

  const send = async () => {
    setBusy(true);
    try {
      let documentId = null;
      if (file) documentId = (await uploadDocument("interview_recording", file, { applicationId })).id;
      const lines = required.map((t) => {
        const session = best[t.key];
        return `- ${t.name}: ${session.score ?? 0}% (${formatDateTime(session.completedAt)})`;
      });
      const bodyText = `Practice interview results (best attempt each):\n${lines.join("\n")}`;
      onJourney(await submitReview(applicationId, step.id, { bodyText, documentId, externalUrl: link.trim() || null }));
      setFile(null);
      setLink("");
      showToast("Sent to your counsellor for verification.");
    } catch (error) {
      showToast(errorMessage(error, "Couldn't send that. Please try again."), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <HandInCard
      title="Your recorded practice"
      description="Complete all three practice interviews above, then send your scores to your counsellor."
      state={state}
    >
      <ul className="mt-4 divide-y divide-hairline rounded-xl border border-hairline">
        {required.map((type) => {
          const session = best[type.key];
          return (
            <li key={type.key} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <span className="flex items-center gap-2.5 text-sm font-medium text-navy-900">
                {session ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
                ) : (
                  <Circle className="h-5 w-5 text-ink-faint" aria-hidden />
                )}
                {type.name}
              </span>
              {session ? (
                <Chip tone="done">Completed · best {session.score ?? 0}%</Chip>
              ) : (
                <Chip tone="quiet">Not yet</Chip>
              )}
            </li>
          );
        })}
      </ul>

      <SubmissionHistory submissions={step.submissions} isVideo />

      {canSubmit ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-ink-muted">
            Optional: add your best recording so your counsellor can watch it.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInput}
              type="file"
              className="hidden"
              accept="video/*,audio/*,.mp4,.mov,.webm,.m4v,.m4a,.mp3"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-2 text-sm text-ink-soft hover:border-navy-200 hover:text-navy-900"
            >
              <Video className="h-4 w-4" aria-hidden />
              {file ? "Change file" : "Upload a recording"}
            </button>
            {file && <span className="truncate text-xs text-ink-muted">{file.name}</span>}
            <span className="text-xs text-ink-muted">Up to 50 MB.</span>
          </div>
          <div>
            <label className="text-xs text-ink-muted" htmlFor="recording-link">
              Or paste a link (unlisted YouTube, Google Drive…)
            </label>
            <input
              id="recording-link"
              type="url"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://"
              className="mt-1 h-10 w-full rounded-xl border border-hairline px-3 text-sm focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={buttonClass()} disabled={!allDone || busy} onClick={send}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {state === "resubmit" ? "Resubmit" : "Send to my counsellor"}
            </button>
            {!allDone && (
              <span className="text-xs text-ink-muted">
                {doneCount} of {required.length} practice interviews completed
              </span>
            )}
          </div>
        </div>
      ) : (
        <StateNote state={state} lockedText="This opens once your counsellor has verified your written answers." />
      )}
    </HandInCard>
  );
};

/* ---------------------------------------------------------------- page --- */

const HandIns = ({ application, prepStep, recordingStep, interviewTypes, onJourney }) => (
  <section>
    <h2 className="mb-1 text-lg font-semibold text-navy-900">3. Hand in to your counsellor</h2>
    <p className="mb-4 text-sm text-ink-muted">
      For {application.courseName ?? "your application"}
      {application.universityName ? ` · ${application.universityName}` : ""}
    </p>
    <div className="space-y-4">
      {prepStep && <ReadinessHandIn applicationId={application.id} step={prepStep} onJourney={onJourney} />}
      {recordingStep && (
        <RecordingHandIn
          applicationId={application.id}
          step={recordingStep}
          interviewTypes={interviewTypes}
          onJourney={onJourney}
        />
      )}
    </div>
  </section>
);

export default HandIns;
