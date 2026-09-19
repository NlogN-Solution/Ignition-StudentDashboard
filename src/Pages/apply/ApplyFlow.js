import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Send,
  Upload,
  UserCircle,
} from "lucide-react";

import EmptyState from "../../components/common/EmptyState";
import { SkeletonList } from "../../components/common/Skeleton";
import { Card, Chip, Note } from "../../components/explore/primitives";
import { useAppData } from "../../context/AppDataContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getPublicCourse } from "../../api/catalogue";
import { isNotFoundError } from "../../lib/apiErrors";
import {
  DOCUMENT_TYPE_LABELS,
  getApplicationChecklistApi,
  linkChecklistItemDocumentApi,
  startApplicationApi,
  submitApplicationApi,
} from "../../api/studentPortal";
import { durationLabel } from "../../lib/catalogue";
import RelatedCourses from "../../components/apply/RelatedCourses";

/**
 * Applying for a course, from the course.
 *
 * Until now an application could only be opened by a counsellor. A student who
 * had found the course they wanted had no way to say so except to wait for a
 * call, and the portal's own Applications screen said as much — which made the
 * catalogue a reading exercise attached to a product that could not act on it.
 *
 * Three steps, in the order the work actually blocks on:
 *
 * 1. **Your details** — the fields a UK application cannot be filed without.
 *    Only the *missing* ones are asked for; a student who filled them in
 *    during onboarding sees a confirmation, not a form to retype.
 * 2. **Documents** — what to upload, and the ones already on file marked off.
 * 3. **Review** — what is about to be sent, and to whom.
 *
 * **The application is created between step 1 and step 2**, as a draft. That is
 * the earliest point where the student has committed to something (they filled
 * a form in) and the latest point where the record is needed (the document
 * checklist hangs off it). Opening one on arrival would litter the Applications
 * screen with drafts for every course anyone opened.
 *
 * **Submitting means "I have finished my part", not "this is with the
 * university"** — the backend moves it to `ready_to_submit` and a counsellor
 * files it. The copy says so rather than letting a student believe they have
 * applied to Coventry when they have not.
 */

/**
 * The fields a UK application cannot be filed without.
 *
 * `locked` marks the three that live on the **account**, not the profile:
 * there is no student-facing write path for them (no `PATCH /auth/me` — only
 * staff may edit another user's account fields), so they are shown as facts
 * and **never gate the form**. A required field a student cannot fill is a
 * dead end, not a validation rule: the seeded accounts have no phone number,
 * and gating on it would have stopped them applying with no way to fix it.
 * Where one is blank the student is told who can add it.
 */
const REQUIRED_DETAILS = [
  { key: "fullName", label: "Full name", group: "account", type: "text", locked: true },
  { key: "email", label: "Email", group: "account", type: "email", locked: true },
  { key: "phone", label: "Phone", group: "account", type: "tel", locked: true },
  { key: "dateOfBirth", label: "Date of birth", group: "basicInfo", type: "date" },
  { key: "nationality", label: "Nationality", group: "basicInfo", type: "text" },
  {
    key: "passportNumber",
    label: "Passport number",
    group: "basicInfo",
    type: "text",
    hint: "As printed on your passport. If you have not got one yet, leave it blank and tell your counsellor.",
    optional: true,
  },
  { key: "highestLevel", label: "Highest level of education", group: "education", type: "text" },
  { key: "obtainedMarks", label: "Marks / CGPA", group: "education", type: "text" },
];

/**
 * What to ask for when the application has no checklist of its own.
 *
 * The real list comes from the workflow template attached to the application,
 * which is staff-configurable and per-country. But template resolution can
 * come back empty — no active template, none marked default, none at all —
 * and "we cannot tell you what to bring" is a worse answer than the standard
 * set every UK undergraduate application asks for. Marked clearly as the
 * general list so nobody reads it as this university's specific demand.
 */
const FALLBACK_DOCUMENTS = [
  { documentType: "passport", isRequired: true },
  { documentType: "academic_transcript", isRequired: true },
  { documentType: "academic_certificate", isRequired: true },
  { documentType: "english_test", isRequired: true },
  { documentType: "statement_of_purpose", isRequired: true },
  { documentType: "recommendation_letter", isRequired: false },
  { documentType: "cv", isRequired: false },
  { documentType: "photo", isRequired: false },
];

const STEPS = [
  { id: 1, label: "Your details", icon: UserCircle },
  { id: 2, label: "Documents", icon: FileText },
  { id: 3, label: "Review", icon: Send },
];

const readValue = (user, field) => {
  if (!user) return "";
  if (field.group === "account") return user[field.key] ?? "";
  return user[field.group]?.[field.key] ?? "";
};

const ApplyFlow = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { applications, documents, uploadDocument, reloadApplications } = useAppData();
  const { showToast } = useToast();

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Why the course is missing, when it is. A failed request used to land on
  // the same "it may have been withdrawn" screen as a genuine 404 — which,
  // while `GET /public/courses/{slug}` was 500ing, turned the Apply button
  // into a dead end for every course in the catalogue.
  const [failure, setFailure] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState({});
  const [errors, setErrors] = useState({});
  const [application, setApplication] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [isWorking, setIsWorking] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setFailure(null);
    getPublicCourse(slug)
      .then((found) => {
        if (!cancelled) setCourse(found);
      })
      .catch((error) => {
        if (!cancelled) setFailure(isNotFoundError(error) ? "missing" : "unavailable");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  // Seed the form from the profile once the user is loaded, so the student
  // edits what they already told us rather than a blank page.
  useEffect(() => {
    if (!user) return;
    setDetails(
      REQUIRED_DETAILS.reduce(
        (acc, field) => ({ ...acc, [field.key]: readValue(user, field) }),
        {}
      )
    );
  }, [user]);

  const editable = REQUIRED_DETAILS.filter((field) => !field.locked && !field.optional);

  const missing = useMemo(
    () => editable.filter((field) => !String(details[field.key] ?? "").trim()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [details]
  );

  /** Blank account fields: worth flagging, never worth blocking on. */
  const missingLocked = useMemo(
    () =>
      REQUIRED_DETAILS.filter(
        (field) => field.locked && !String(details[field.key] ?? "").trim()
      ),
    [details]
  );

  /** An application this student already has against this course, if any. */
  const existing = useMemo(
    () => applications.find((entry) => entry.courseId === course?.id) ?? null,
    [applications, course]
  );

  const loadChecklist = useCallback(async (applicationId) => {
    try {
      setChecklist(await getApplicationChecklistApi(applicationId));
    } catch {
      setChecklist([]);
    }
  }, []);

  const handleDetailsNext = async () => {
    const next = {};
    editable.forEach((field) => {
      if (!String(details[field.key] ?? "").trim()) {
        next[field.key] = `${field.label} is needed before this can be filed.`;
      }
    });
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsWorking(true);
    try {
      await updateUser({
        basicInfo: {
          ...user?.basicInfo,
          dateOfBirth: details.dateOfBirth,
          nationality: details.nationality,
          passportNumber: details.passportNumber,
        },
        education: {
          ...user?.education,
          highestLevel: details.highestLevel,
          obtainedMarks: details.obtainedMarks,
        },
      });

      // Resume rather than duplicate. The backend refuses a second live
      // application for the same course with a 409, and coming back to finish
      // one is the ordinary case, not an error to show.
      let record = existing;
      if (!record) {
        try {
          record = await startApplicationApi({ programId: course.id });
          await reloadApplications();
        } catch (error) {
          if (error?.status !== 409) throw error;
          record = existing;
        }
      }

      if (!record) {
        showToast("Could not open the application. Try again in a moment.", "error");
        return;
      }

      setApplication(record);
      await loadChecklist(record.id);
      setStep(2);
    } catch {
      showToast("Could not save your details. Try again in a moment.", "error");
    } finally {
      setIsWorking(false);
    }
  };

  /**
   * What the student still owes, merged with what they have already given.
   *
   * A document already on file counts, whichever application it was uploaded
   * for — documents belong to the student, not to one application, and asking
   * for a second copy of the same passport is how a portal loses someone's
   * patience.
   */
  const requirements = useMemo(() => {
    const source = checklist.length
      ? checklist.map((item) => ({
          id: item.id,
          documentType: item.documentType,
          label: item.label,
          isRequired: item.isRequired,
          linkedDocumentId: item.documentId,
        }))
      : FALLBACK_DOCUMENTS.map((item) => ({
          id: item.documentType,
          documentType: item.documentType,
          label: DOCUMENT_TYPE_LABELS[item.documentType] ?? item.documentType,
          isRequired: item.isRequired,
          linkedDocumentId: null,
        }));

    return source.map((item) => {
      const onFile = documents.find((doc) => doc.documentType === item.documentType) ?? null;
      return { ...item, document: onFile };
    });
  }, [checklist, documents]);

  const outstanding = requirements.filter((item) => item.isRequired && !item.document);

  const handleUpload = async (item, file) => {
    if (!file) return;
    setUploadingType(item.documentType);
    try {
      const uploaded = await uploadDocument(item.documentType, file, { applicationId: application?.id });
      // Link it back to the checklist row that asked for it, where there is
      // one — that is what turns the staff-side item from pending to
      // submitted. The fallback list has no rows to link to.
      if (application && checklist.length && uploaded?.id) {
        try {
          await linkChecklistItemDocumentApi(application.id, item.id, uploaded.id);
          await loadChecklist(application.id);
        } catch {
          // The document is uploaded either way; the link is an enhancement.
        }
      }
      showToast(`${item.label} uploaded.`);
    } catch {
      showToast(`Could not upload ${item.label}. Try again in a moment.`, "error");
    } finally {
      setUploadingType(null);
    }
  };

  const handleSubmit = async () => {
    if (!application) return;
    setIsWorking(true);
    try {
      await submitApplicationApi(application.id);
      await reloadApplications();
      showToast("Sent to your counsellor.");
      navigate(`/applications/${application.id}`);
    } catch {
      showToast("Could not submit. Try again in a moment.", "error");
    } finally {
      setIsWorking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-9">
        <SkeletonList count={4} />
      </div>
    );
  }

  if (failure === "unavailable") {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-9">
        <EmptyState
          icon={AlertTriangle}
          title="We couldn't load this course"
          description="The catalogue didn't answer, so we can't start your application yet. Nothing has been lost — try again."
          action={
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          }
        />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-9">
        <EmptyState
          icon={AlertTriangle}
          title="Course not found"
          description="It may have been withdrawn from the catalogue since you last looked."
          action={
            <Link
              to="/explore"
              className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Back to Explore
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 pb-12">
      <div className="border-b border-hairline bg-navy-900 px-4 pb-7 pt-9 lg:px-6">
        <div className="mx-auto max-w-4xl">
          <Link
            to={`/explore/courses/${course.slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to the course
          </Link>

          <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-ignite-400">
            Applying for
          </p>
          <h1 className="mt-1.5 text-2xl font-bold leading-tight tracking-tight text-white">
            {course.title}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm font-medium text-white/75">
            {course.university?.name}
            {course.university?.city && <span className="text-white/50">· {course.university.city}</span>}
            {durationLabel(course.duration_years) && (
              <span className="text-white/50">· {durationLabel(course.duration_years)}</span>
            )}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 lg:px-6">
        <ol className="mt-6 flex flex-wrap items-center gap-2">
          {STEPS.map((entry) => {
            const Icon = entry.icon;
            const done = entry.id < step;
            const current = entry.id === step;
            return (
              <li
                key={entry.id}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                  current
                    ? "border-navy-200 bg-navy-900 text-white"
                    : done
                    ? "border-hairline bg-white text-navy-900"
                    : "border-hairline bg-white text-ink-faint"
                }`}
              >
                {done ? <Check className="h-4 w-4 text-orange" /> : <Icon className="h-4 w-4" />}
                {entry.label}
              </li>
            );
          })}
        </ol>

        {step === 1 && (
          <div className="mt-6 space-y-5">
            <Card className="p-5">
              <h2 className="text-base font-bold tracking-tight text-navy-900">Your details</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {missing.length === 0
                  ? "Everything a UK application needs is already on your profile. Check it over and carry on."
                  : `${missing.length} ${
                      missing.length === 1 ? "field is" : "fields are"
                    } still missing. An application cannot be filed without them.`}
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {REQUIRED_DETAILS.map((field) => {
                  // The three account fields have no student-facing write path
                  // on the backend (no PATCH /auth/me), so they are shown as
                  // read-only facts rather than as inputs that quietly fail.
                  const locked = Boolean(field.locked);
                  return (
                    <div key={field.key}>
                      <label className="text-sm font-medium text-ink-soft">
                        {field.label}
                        {!field.optional && <span className="text-orange">*</span>}
                      </label>
                      <input
                        type={field.type}
                        readOnly={locked}
                        value={details[field.key] ?? ""}
                        onChange={(event) => {
                          setDetails((prev) => ({ ...prev, [field.key]: event.target.value }));
                          setErrors((prev) => ({ ...prev, [field.key]: undefined }));
                        }}
                        className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-blue-link/20 ${
                          errors[field.key] ? "border-orange" : "border-hairline"
                        } ${locked ? "bg-canvas text-ink-muted" : "bg-white focus:border-blue-link"}`}
                      />
                      {field.hint && <p className="mt-1 text-xs text-ink-faint">{field.hint}</p>}
                      {locked && (
                        <p className="mt-1 text-xs text-ink-faint">
                          Ask your counsellor to change this.
                        </p>
                      )}
                      {errors[field.key] && (
                        <p className="mt-1 text-xs font-medium text-orange">{errors[field.key]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {missingLocked.length > 0 && (
              <Card className="border-ignite-200 bg-ignite-50/40 p-4">
                <p className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
                  <span>
                    Your counsellor will need to add your{" "}
                    {missingLocked.map((field) => field.label.toLowerCase()).join(" and ")} before
                    this is filed — those live on your account and only staff can change them. You
                    can carry on in the meantime.
                  </span>
                </p>
              </Card>
            )}

            {existing && (
              <Card className="border-ignite-200 bg-ignite-50/40 p-4">
                <p className="text-sm leading-relaxed text-ink">
                  You already have an application open for this course. Carrying on will pick it
                  up where you left it rather than starting a second one.
                </p>
              </Card>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleDetailsNext}
                disabled={isWorking}
                className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
              >
                {isWorking && <Loader2 className="h-4 w-4 animate-spin" />}
                Save and continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-5">
            <Card className="p-5">
              <h2 className="text-base font-bold tracking-tight text-navy-900">Your documents</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {checklist.length
                  ? `${course.university?.name ?? "This university"} asks for the documents below.`
                  : "The general set every UK application asks for. Your counsellor will confirm anything specific to this university."}{" "}
                Anything already on your profile is marked off — you do not need to upload it twice.
              </p>

              <ul className="mt-5 divide-y divide-hairline">
                {requirements.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        item.document
                          ? "bg-ignite-50 text-orange"
                          : "border border-hairline bg-canvas text-ink-faint"
                      }`}
                    >
                      {item.document ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-navy-900">{item.label}</p>
                      <p className="text-xs text-ink-muted">
                        {item.document
                          ? item.document.file?.name ?? "On file"
                          : item.isRequired
                          ? "Required"
                          : "Optional"}
                      </p>
                    </div>

                    {!item.isRequired && !item.document && <Chip>Optional</Chip>}

                    <label className="relative z-10 shrink-0 cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(event) => handleUpload(item, event.target.files?.[0])}
                      />
                      <span className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-ring-idle hover:text-navy-900">
                        {uploadingType === item.documentType ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        {item.document ? "Replace" : "Upload"}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </Card>

            <Note>
              You can carry on without every document and add the rest later — your counsellor
              will chase what is missing. Nothing goes to the university until they file it.
            </Note>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-hairline bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 space-y-5">
            <Card className="p-5">
              <h2 className="text-base font-bold tracking-tight text-navy-900">
                Ready to send to your counsellor
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                Submitting hands this to your counsellor to check and file with{" "}
                {course.university?.name ?? "the university"}.{" "}
                <strong className="font-semibold text-ink">
                  It does not go to the university yet
                </strong>{" "}
                — they do that, and you will see it move here when they have.
              </p>

              <dl className="mt-5 divide-y divide-hairline">
                <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3 first:pt-0">
                  <dt className="text-sm font-medium text-ink-muted">Course</dt>
                  <dd className="text-sm font-semibold text-ink">{course.title}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3">
                  <dt className="text-sm font-medium text-ink-muted">University</dt>
                  <dd className="text-sm font-semibold text-ink">{course.university?.name}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3">
                  <dt className="text-sm font-medium text-ink-muted">Documents on file</dt>
                  <dd className="text-sm font-semibold text-ink">
                    {requirements.filter((item) => item.document).length} of {requirements.length}
                  </dd>
                </div>
                {course.intake && (
                  <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3 last:pb-0">
                    <dt className="text-sm font-medium text-ink-muted">Intake</dt>
                    <dd className="text-sm font-semibold text-ink">{course.intake}</dd>
                  </div>
                )}
              </dl>

              {outstanding.length > 0 && (
                <div className="mt-4 rounded-lg border border-ignite-200 bg-ignite-50/40 p-4">
                  <p className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
                    <span>
                      {outstanding.length} required{" "}
                      {outstanding.length === 1 ? "document is" : "documents are"} still missing:{" "}
                      {outstanding.map((item) => item.label).join(", ")}. You can still send this —
                      your counsellor will ask you for the rest.
                    </span>
                  </p>
                </div>
              )}
            </Card>

            {/* Optional extras, under the review and never above it. The
                course they came for is the decision; these are additions. */}
            <RelatedCourses programId={course?.id} />

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-hairline bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isWorking}
                className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
              >
                {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit application
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyFlow;
