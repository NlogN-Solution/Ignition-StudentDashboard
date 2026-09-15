import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Award,
  Building,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  GraduationCap,
  Hash,
  Lock,
  MapPin,
  Stamp,
  Upload,
  User,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge, { STATUS_LABELS } from "../../components/common/StatusBadge";
import { SkeletonList } from "../../components/common/Skeleton";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";
import {
  DOCUMENT_TYPE_LABELS,
  ISSUED_DOCUMENT_TYPES,
  getApplicationChecklistApi,
  getApplicationDocumentsApi,
  getApplicationTimeline,
  linkChecklistItemDocumentApi,
} from "../../api/studentPortal";
import { CAS_STAGES, OFFER_TYPE_LABELS, hasOffer } from "../../lib/applicationStatus";
import UnlockModal from "../../components/access/UnlockModal";
import { useAccess } from "../../hooks/useAccess";
import { openDocumentFile } from "../../lib/documentFile";
import { formatDate, formatFileSize } from "../../lib/simulate";

const InfoRow = ({ icon: Icon, label, value }) =>
  value ? (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  ) : null;

const Timeline = ({ steps }) => (
  <ol className="space-y-4">
    {steps.map((step) => (
      <li key={step.id} className="flex items-start gap-3">
        {step.state === "completed" ? (
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        ) : step.state === "current" ? (
          <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <p
            className={`text-sm ${
              step.state === "upcoming" ? "text-gray-500" : "text-gray-800 font-medium"
            }`}
          >
            {STATUS_LABELS[step.label] ?? step.label}
          </p>
          {step.date && <span className="text-xs text-gray-500">{formatDate(step.date)}</span>}
          {step.remarks && <p className="text-xs text-gray-600 mt-1">{step.remarks}</p>}
        </div>
      </li>
    ))}
  </ol>
);

/**
 * A file filed against this application.
 *
 * `locked` is the offer/CAS paywall. The row still *appears* — the student is
 * told their offer letter exists, which is the whole point of charging for it
 * rather than hiding it — but the actions become one unlock button.
 *
 * Hiding the buttons is not the gate. The backend refuses the file itself with
 * a 402 (`_assert_entitled` in `routes/document.py`), so this is presentation
 * over an enforced boundary rather than the boundary itself.
 */
const LockedDocumentRow = ({ document, label, onUnlock }) => (
  <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
    <div className="flex min-w-0 items-center gap-2.5">
      <Lock className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800">{label}</p>
        <p className="truncate text-xs text-gray-500">Available — unlock your package to open it</p>
      </div>
    </div>
    <button
      type="button"
      onClick={onUnlock}
      className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
    >
      <Lock className="h-3 w-3" aria-hidden />
      Unlock to view
    </button>
  </li>
);

/** A file filed against this application, with the two things you can do to it. */
const DocumentRow = ({ document, onOpen }) => (
  <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-3">
    <div className="flex min-w-0 items-center gap-2.5">
      <FileText className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800">
          {DOCUMENT_TYPE_LABELS[document.documentType] ?? document.title}
        </p>
        <p className="truncate text-xs text-gray-500">
          {document.file?.name}
          {document.file?.sizeBytes ? ` · ${formatFileSize(document.file.sizeBytes)}` : ""}
        </p>
      </div>
    </div>
    <div className="flex flex-shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => onOpen(document, "inline")}
        className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
      >
        <Eye className="h-3.5 w-3.5" aria-hidden />
        View
      </button>
      <button
        type="button"
        onClick={() => onOpen(document, "attachment")}
        className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
      >
        <Download className="h-3.5 w-3.5" aria-hidden />
        Download
      </button>
    </div>
  </li>
);

const ApplicationDetail = () => {
  const { applicationId } = useParams();
  const { applications, uploadDocument } = useAppData();
  const { showToast } = useToast();

  const [timeline, setTimeline] = useState([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);
  const [checklist, setChecklist] = useState([]);
  const [isChecklistLoading, setIsChecklistLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true);
  const [isUnlockOpen, setIsUnlockOpen] = useState(false);
  const { access, hasAccess, reload: reloadAccess } = useAccess();
  const [uploadingItemId, setUploadingItemId] = useState(null);
  const fileInputRefs = useRef({});

  const application = applications.find((app) => app.id === applicationId);

  useEffect(() => {
    let cancelled = false;
    if (!applicationId) return undefined;
    setIsTimelineLoading(true);
    getApplicationTimeline(applicationId)
      .then((steps) => {
        if (!cancelled) setTimeline(steps);
      })
      .catch(() => {
        if (!cancelled) setTimeline([]);
      })
      .finally(() => {
        if (!cancelled) setIsTimelineLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  useEffect(() => {
    let cancelled = false;
    if (!applicationId) return undefined;
    setIsChecklistLoading(true);
    getApplicationChecklistApi(applicationId)
      .then((items) => {
        if (!cancelled) setChecklist(items);
      })
      .catch(() => {
        if (!cancelled) setChecklist([]);
      })
      .finally(() => {
        if (!cancelled) setIsChecklistLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  const loadDocuments = useCallback(async (id) => {
    setIsDocumentsLoading(true);
    try {
      setDocuments(await getApplicationDocumentsApi(id));
    } catch {
      setDocuments([]);
    } finally {
      setIsDocumentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!applicationId) return;
    loadDocuments(applicationId);
  }, [applicationId, loadDocuments]);

  const handleOpenDocument = async (document, disposition) => {
    const result = await openDocumentFile(document.id, { disposition });
    if (result.ok) return;
    // 402 means "pay and this works", which is a different answer from a
    // failure — so it opens the unlock screen instead of an error. The
    // distinction exists on the wire for exactly this reason.
    if (result.error?.status === 402) {
      setIsUnlockOpen(true);
      return;
    }
    showToast("Couldn't open that file. Please try again.", "error");
  };

  const handleUploadForItem = async (item, file) => {
    if (!file) return;
    setUploadingItemId(item.id);
    try {
      const uploaded = await uploadDocument(item.documentType || "other", file, { applicationId });
      const updated = await linkChecklistItemDocumentApi(applicationId, item.id, uploaded.id);
      setChecklist((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
      await loadDocuments(applicationId);
      showToast(`${item.label} uploaded — awaiting review.`);
    } catch {
      showToast("Couldn't upload that document. Please try again.", "error");
    } finally {
      setUploadingItemId(null);
    }
  };

  if (applications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 mt-9 pb-12">
        <main className="max-w-5xl mx-auto px-4 py-8">
          <SkeletonList count={3} />
        </main>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 mt-9 pb-12">
        <main className="max-w-5xl mx-auto px-4 py-8">
          <EmptyState
            icon={FileCheck}
            title="Application not found"
            description="This application doesn't exist or isn't yours."
            action={
              <Link
                to="/applications"
                className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300"
              >
                Back to My Applications
              </Link>
            }
          />
        </main>
      </div>
    );
  }

  // Letters the university issued and Ignition filed (offer, CAS) versus
  // everything else attached to the application — the student's own uploads.
  // They read differently: one is news, the other is a receipt.
  const issuedDocuments = documents.filter((doc) => doc.documentType === "offer_letter");
  const casDocuments = documents.filter((doc) => doc.documentType === "cas_letter");
  const showCasCard = CAS_STAGES.includes(application.status) || casDocuments.length > 0;
  const supportingDocuments = documents.filter(
    (doc) => !ISSUED_DOCUMENT_TYPES.includes(doc.documentType)
  );
  const showOfferCard = hasOffer(application.status) || issuedDocuments.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 mt-9 pb-12">
      <PageHeader
        icon={FileCheck}
        title={application.courseName}
        description={`${application.universityName}${
          application.universityCountry ? ` · ${application.universityCountry}` : ""
        }`}
        actions={<StatusBadge status={application.status} />}
      />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Link
          to="/applications"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to My Applications
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Offer.

                First card on the page once there is one: it is the thing the
                student came to look at. Before this existed the only sign of an
                offer anywhere in the portal was the status badge — the letter a
                counsellor uploaded was filed against the student and read back
                by nothing. */}
            {showOfferCard && (
              <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                      <Award className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {application.status === "offer_declined" ? "Offer declined" : "Your offer"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {application.offerReceivedDate
                          ? `${application.universityName} issued it on ${formatDate(application.offerReceivedDate)}.`
                          : `${application.universityName} has made you an offer.`}
                      </p>
                      {/* Said explicitly. A conditional offer is a place *if*
                          the conditions are met, and a student reading only
                          "Offer received" will reasonably assume otherwise. */}
                      {application.offerType ? (
                        <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                          {OFFER_TYPE_LABELS[application.offerType] ?? application.offerType}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <StatusBadge status={application.status} />
                </div>

                {isDocumentsLoading ? (
                  <div className="mt-4">
                    <SkeletonList count={1} />
                  </div>
                ) : issuedDocuments.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {issuedDocuments.map((document) =>
                      hasAccess ? (
                        <DocumentRow key={document.id} document={document} onOpen={handleOpenDocument} />
                      ) : (
                        <LockedDocumentRow
                          key={document.id}
                          document={document}
                          label={DOCUMENT_TYPE_LABELS[document.documentType] ?? document.title}
                          onUnlock={() => setIsUnlockOpen(true)}
                        />
                      )
                    )}
                  </ul>
                ) : (
                  <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    Your counsellor is filing the letter — it will appear here as soon as it is uploaded.
                  </p>
                )}
              </div>
            )}

            {/* CAS. Its own card, because a student sits between an accepted
                offer and a CAS for weeks and it is the commonest place a UK
                application stalls — so "not yet" is information, not an empty
                state to hide. */}
            {showCasCard && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"
                    >
                      <Stamp className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {application.casReceivedDate ? "Your CAS" : "CAS not issued yet"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {application.casReceivedDate
                          ? `Issued on ${formatDate(application.casReceivedDate)}.${
                              application.casNumber ? ` Reference ${application.casNumber}.` : ""
                            } You need it to apply for your visa.`
                          : "The university issues this once you have accepted your offer and settled the deposit. Your counsellor will chase it."}
                      </p>
                    </div>
                  </div>
                </div>

                {casDocuments.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {casDocuments.map((document) =>
                      hasAccess ? (
                        <DocumentRow key={document.id} document={document} onOpen={handleOpenDocument} />
                      ) : (
                        <LockedDocumentRow
                          key={document.id}
                          document={document}
                          label="CAS letter"
                          onUnlock={() => setIsUnlockOpen(true)}
                        />
                      )
                    )}
                  </ul>
                ) : null}
              </div>
            )}

            {/* Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Application overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Building} label="University" value={application.universityName} />
                <InfoRow icon={MapPin} label="Country" value={application.universityCountry} />
                <InfoRow icon={GraduationCap} label="Course" value={application.courseName} />
                <InfoRow icon={Award} label="Degree level" value={application.degreeLevel} />
                <InfoRow icon={Calendar} label="Intake" value={application.intake} />
                <InfoRow icon={User} label="Counsellor" value={application.counsellorName || "Not yet assigned"} />
                <InfoRow
                  icon={Hash}
                  label="University application ID"
                  value={application.universityApplicationId}
                />
                <InfoRow
                  icon={Stamp}
                  label="Tuition fee"
                  value={application.tuitionFee ? `$${Number(application.tuitionFee).toLocaleString()}` : null}
                />
                <InfoRow
                  icon={Award}
                  label="Scholarship"
                  value={
                    application.scholarshipAmount
                      ? `$${Number(application.scholarshipAmount).toLocaleString()}`
                      : null
                  }
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Timeline</h3>
              {isTimelineLoading ? (
                <SkeletonList count={2} />
              ) : timeline.length === 0 ? (
                <p className="text-sm text-gray-500">No status changes recorded yet.</p>
              ) : (
                <Timeline steps={timeline} />
              )}
            </div>

            {/* Key dates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Key dates</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Calendar} label="Application opened" value={formatDate(application.applicationDate)} />
                <InfoRow icon={Calendar} label="Submitted" value={formatDate(application.submittedAt)} />
                <InfoRow icon={Calendar} label="Offer received" value={formatDate(application.offerReceivedDate)} />
                <InfoRow icon={Calendar} label="Visa applied" value={formatDate(application.visaAppliedDate)} />
                <InfoRow icon={Calendar} label="Visa decision" value={formatDate(application.visaDecisionDate)} />
                <InfoRow icon={Calendar} label="Enrollment" value={formatDate(application.enrollmentDate)} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Required documents */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-3">Requested Documents</h3>
              {isChecklistLoading ? (
                <SkeletonList count={2} />
              ) : checklist.length === 0 ? (
                <div className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-2 rounded-lg text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  Nothing requested yet
                </div>
              ) : (
                <div className="space-y-3">
                  {checklist.map((item) => (
                    <div key={item.id} className="p-3 border border-gray-100 rounded-lg">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-800">
                          {item.label}
                          {!item.isRequired && <span className="ml-1.5 text-xs text-gray-400">(optional)</span>}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                      {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                      {item.documentId && (
                        <button
                          type="button"
                          onClick={() => handleOpenDocument({ id: item.documentId }, "inline")}
                          className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-3 w-3" aria-hidden />
                          View what you sent
                        </button>
                      )}
                      {(item.status === "pending" || item.status === "rejected") && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[item.id]?.click()}
                            disabled={uploadingItemId === item.id}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-60"
                          >
                            <Upload className="h-3 w-3" />
                            {uploadingItemId === item.id
                              ? "Uploading…"
                              : item.status === "rejected"
                              ? "Re-upload"
                              : "Upload"}
                          </button>
                          <input
                            ref={(element) => {
                              fileInputRefs.current[item.id] = element;
                            }}
                            type="file"
                            className="hidden"
                            onChange={(event) => {
                              handleUploadForItem(item, event.target.files?.[0]);
                              event.target.value = "";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Files attached to this application */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-3">Files on this application</h3>
              {isDocumentsLoading ? (
                <SkeletonList count={2} />
              ) : supportingDocuments.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nothing attached yet. Anything you upload for a requested document above lands here.
                </p>
              ) : (
                <ul className="space-y-2">
                  {supportingDocuments.map((document) => (
                    <DocumentRow key={document.id} document={document} onOpen={handleOpenDocument} />
                  ))}
                </ul>
              )}
            </div>

            {/* Counsellor notes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-3">Counsellor notes</h3>
              {application.notes ? (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{application.notes}</p>
              ) : (
                <p className="text-sm text-gray-500">No notes yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {isUnlockOpen ? (
        <UnlockModal
          access={access}
          onClose={() => setIsUnlockOpen(false)}
          onUnlocked={async () => {
            setIsUnlockOpen(false);
            // Re-read from the server, not an optimistic flip: the entitlement
            // is a payment row and this screen should reflect what is actually
            // recorded against the account.
            await reloadAccess();
            showToast("Unlocked — your documents are open.");
          }}
        />
      ) : null}
    </div>
  );
};

export default ApplicationDetail;
