import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

import { Card } from "../dashboard/ui";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";
import { bookSlot, setStudyGap, submitDocumentsStage, submitReview, tickTask } from "../../api/journey";
import { linkChecklistItemDocumentApi } from "../../api/studentPortal";
import { parseApiErrorDetail } from "../../lib/apiErrors";
import {
  BookingStage,
  ChecklistStage,
  DocumentsStage,
  InfoStage,
  IssuedStage,
  ReviewStage,
} from "./JourneyStages";

/**
 * The application journey: every stage down the left, the chosen one on the
 * right. It opens on the current stage; earlier and later stages can be looked
 * at, but only the current one takes actions — the backend refuses the rest,
 * and the screen does not offer them.
 *
 * Every action answers with the whole journey (`api/journey.js`), which this
 * hands straight up through `onJourney`, so the stepper and the stage never
 * disagree about where the student is.
 */

const STEP_STATE = {
  completed: { dot: "border-emerald-600 bg-emerald-600 text-white", caption: "Completed" },
  current: { dot: "border-navy-900 text-navy-900", caption: "In progress" },
  pending: { dot: "border-hairline text-ink-faint", caption: "Not started" },
  failed: { dot: "border-red-600 bg-red-600 text-white", caption: "Not successful" },
  skipped: { dot: "border-hairline bg-slate-100 text-ink-faint", caption: "Not needed" },
  cancelled: { dot: "border-hairline bg-slate-100 text-ink-faint", caption: "Closed" },
};

const errorMessage = (error, fallback) => parseApiErrorDetail(error?.data?.detail).message || fallback;

const Stepper = ({ steps, selectedId, onSelect }) => (
  <ol className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
    {steps.map((step, index) => {
      const state = STEP_STATE[step.status] ?? STEP_STATE.pending;
      const selected = step.id === selectedId;
      return (
        <li key={step.id} className="flex-shrink-0">
          <button
            type="button"
            onClick={() => onSelect(step.id)}
            aria-current={step.status === "current" ? "step" : undefined}
            className={`flex w-full min-w-[88px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-center lg:flex-row lg:gap-3 lg:px-3 lg:text-left ${
              selected ? "bg-navy-50" : "hover:bg-slate-50"
            }`}
          >
            <span
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${state.dot}`}
            >
              {step.status === "completed" ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : step.status === "failed" ? (
                <X className="h-3.5 w-3.5" aria-hidden />
              ) : (
                index + 1
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold leading-tight text-navy-900 lg:text-sm">{step.name}</span>
              <span className="hidden text-xs text-ink-muted lg:block">
                {step.status === "current" && step.waitingOn === "student" ? "Your turn" : state.caption}
              </span>
            </span>
          </button>
        </li>
      );
    })}
  </ol>
);

const JourneyPanel = ({ applicationId, application, journey, onJourney, documents, onOpenDocument, onFilesChanged }) => {
  const { uploadDocument, documents: vaultDocuments } = useAppData();
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState(journey.currentStepId ?? journey.steps[journey.steps.length - 1]?.id);
  const [busy, setBusy] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState(null);

  // Follow the student forward: when an action opens the next stage, show it.
  useEffect(() => {
    if (journey.currentStepId) setSelectedId(journey.currentStepId);
  }, [journey.currentStepId]);

  const step = journey.steps.find((s) => s.id === selectedId) ?? journey.steps[0];
  const position = journey.steps.indexOf(step);

  const run = async (action, success, fallback) => {
    setBusy(true);
    try {
      onJourney(await action());
      if (success) showToast(success);
      return true;
    } catch (error) {
      showToast(errorMessage(error, fallback), "error");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (item, file) => {
    if (!file) return;
    setUploadingItemId(item.id);
    try {
      const uploaded = await uploadDocument(item.documentType || "other", file, { applicationId });
      await linkChecklistItemDocumentApi(applicationId, item.id, uploaded.id);
      // The checklist on the Documents tab reads the same rows.
      await onFilesChanged();
      showToast(`${item.label} uploaded.`);
    } catch (error) {
      showToast(errorMessage(error, "Couldn't upload that document. Please try again."), "error");
    } finally {
      setUploadingItemId(null);
    }
  };

  /** Answer a request with a file already in the Paper Vault. */
  const handleReuse = async (item, documentId) => {
    setUploadingItemId(item.id);
    try {
      await linkChecklistItemDocumentApi(applicationId, item.id, documentId);
      await onFilesChanged();
      showToast(`${item.label} attached from your Paper Vault.`);
    } catch (error) {
      showToast(errorMessage(error, "Couldn't use that document. Please try again."), "error");
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleReview = async ({ text, file, link, isVideo }) => {
    setBusy(true);
    try {
      let documentId = null;
      if (file) {
        const uploaded = await uploadDocument(isVideo ? "interview_recording" : "other", file, { applicationId });
        documentId = uploaded.id;
      }
      onJourney(await submitReview(applicationId, step.id, { bodyText: text, documentId, externalUrl: link }));
      showToast("Sent to your counsellor for verification.");
      return true;
    } catch (error) {
      showToast(errorMessage(error, "Couldn't send that. Please try again."), "error");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const panel = {
    documents: (
      <DocumentsStage
        step={step}
        journey={journey}
        busy={busy}
        uploadingItemId={uploadingItemId}
        onUpload={handleUpload}
        onReuse={handleReuse}
        vaultDocuments={vaultDocuments}
        onToggleGap={(value) =>
          run(() => setStudyGap(applicationId, value), null, "Couldn't save your answer. Please try again.")
        }
        onSubmit={() =>
          run(
            () => submitDocumentsStage(applicationId, step.id),
            "Documents submitted.",
            "Couldn't submit. Please try again."
          )
        }
      />
    ),
    issued: <IssuedStage step={step} application={application} documents={documents} onOpenDocument={onOpenDocument} />,
    review: <ReviewStage key={step.id} step={step} busy={busy} onSubmit={handleReview} />,
    booking: (
      <BookingStage
        key={step.id}
        step={step}
        busy={busy}
        onBook={(slotId) =>
          run(() => bookSlot(applicationId, slotId), "Interview booked.", "Couldn't book that slot. Please try again.")
        }
      />
    ),
    checklist: (
      <ChecklistStage
        step={step}
        busy={busy}
        onTick={(key, done) =>
          run(() => tickTask(applicationId, step.id, key, done), null, "Couldn't save that. Please try again.")
        }
      />
    ),
  }[step.kind] ?? <InfoStage step={step} />;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Card className="self-start p-2 lg:sticky lg:top-20">
        <Stepper steps={journey.steps} selectedId={step.id} onSelect={setSelectedId} />
      </Card>
      <Card className="min-w-0 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-900">
          Step {position + 1} of {journey.steps.length}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-navy-900">{step.name}</h2>
        {step.description && <p className="mt-1 text-sm text-ink-muted">{step.description}</p>}
        {panel}
      </Card>
    </div>
  );
};

/** The compact version for the top of the page, in place of the status tracker. */
export const JourneySummaryCard = ({ journey, onOpen, className = "" }) => {
  const current = journey.steps.find((s) => s.id === journey.currentStepId);
  const position = current ? journey.steps.indexOf(current) + 1 : journey.steps.length;
  const ended = journey.status === "cancelled";
  return (
    <Card className={`flex flex-col p-5 ${className}`}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[16px] font-semibold text-navy-900">Your journey</h2>
        <span className="text-xs text-ink-muted">{journey.progressPercent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${ended ? "bg-red-500" : "bg-navy-900"} transition-[width] duration-500`}
          style={{ width: `${journey.progressPercent}%` }}
        />
      </div>
      <p className="mt-4 text-xs uppercase tracking-wide text-ink-muted">
        {ended ? "Application closed" : current ? `Step ${position} of ${journey.steps.length}` : "Complete"}
      </p>
      <p className="mt-1 text-lg font-semibold text-navy-900">{current?.name ?? (ended ? "Not successful" : "All done")}</p>
      {current?.waitingOn === "student" && <p className="mt-1 text-sm text-amber-700">Waiting on you</p>}
      {current?.waitingOn === "staff" && <p className="mt-1 text-sm text-ink-muted">With your counsellor</p>}
      <button
        type="button"
        onClick={onOpen}
        className="mt-auto self-start pt-4 text-sm font-semibold text-navy-900 underline-offset-2 hover:underline"
      >
        Open journey →
      </button>
    </Card>
  );
};

export default JourneyPanel;
