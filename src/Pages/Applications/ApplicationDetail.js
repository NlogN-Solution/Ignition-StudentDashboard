import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Award,
  Building,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Clock,
  FileCheck,
  GraduationCap,
  Hash,
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
import { getApplicationChecklistApi, getApplicationTimeline, linkChecklistItemDocumentApi } from "../../api/studentPortal";
import { formatDate } from "../../lib/simulate";

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

const ApplicationDetail = () => {
  const { applicationId } = useParams();
  const { applications, uploadDocument } = useAppData();
  const { showToast } = useToast();

  const [timeline, setTimeline] = useState([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);
  const [checklist, setChecklist] = useState([]);
  const [isChecklistLoading, setIsChecklistLoading] = useState(true);
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

  const handleUploadForItem = async (item, file) => {
    if (!file) return;
    setUploadingItemId(item.id);
    try {
      const uploaded = await uploadDocument(item.documentType || "other", file);
      const updated = await linkChecklistItemDocumentApi(applicationId, item.id, uploaded.id);
      setChecklist((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
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
                        <span className="text-sm font-medium text-gray-800">{item.label}</span>
                        <StatusBadge status={item.status} />
                      </div>
                      {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
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
    </div>
  );
};

export default ApplicationDetail;
