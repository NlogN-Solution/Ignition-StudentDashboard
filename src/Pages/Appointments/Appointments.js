import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  CalendarPlus,
  Clock,
  MapPin,
  MessageSquare,
  User,
  Video,
  X,
  CircleCheck,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import { SkeletonList } from "../../components/common/Skeleton";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";
import { formatDateTime, simulateDelay } from "../../lib/simulate";

const MEETING_TYPES = [
  "Application Review",
  "Course Shortlisting",
  "Visa Preparation",
  "Offer Acceptance",
  "Profile Evaluation",
];

const MODES = ["Video call", "In person"];

/** "Sarah Gurung" → "SG". Two letters at most; a single name gives one. */
const initialsOf = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

/** `datetime-local` needs a value with no timezone suffix. */
const toLocalInputValue = (isoString) => {
  const date = isoString ? new Date(isoString) : new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const RequestForm = ({ title, initialValues, onCancel, onSubmit, isSaving, submitLabel }) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!values.meetingType) next.meetingType = "Choose a meeting type.";
    if (!values.scheduledAt) {
      next.scheduledAt = "Pick a date and time.";
    } else if (new Date(values.scheduledAt).getTime() < Date.now()) {
      next.scheduledAt = "Choose a time in the future.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit(values);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-1">
            Requests are held locally until a counsellor confirms them.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600"
          aria-label="Close form"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Who you are seeing, not who you would like to see.

            This was a dropdown of two invented counsellors from a JSON fixture,
            which was wrong twice over: the names were not anybody at the
            agency, and the backend ignores the field entirely — a counsellor is
            assigned to the student through their application, and the office
            sets the time and the person when it confirms. So this states the
            advisor the student already has and asks nothing. */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Counsellor</span>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
              {values.counsellorName ? initialsOf(values.counsellorName) : "—"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {values.counsellorName || "To be assigned"}
              </p>
              <p className="text-xs text-gray-500">
                {values.counsellorName
                  ? "Your assigned advisor"
                  : "We'll assign an advisor when we confirm this"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Meeting type<span className="text-red-500">*</span>
          </label>
          <select
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-navy-900"
            value={values.meetingType}
            onChange={(event) => handleChange("meetingType", event.target.value)}
          >
            <option value="">Select a meeting type</option>
            {MEETING_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.meetingType && <p className="text-sm text-red-500">{errors.meetingType}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Date and time<span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-navy-900"
            value={values.scheduledAt}
            onChange={(event) => handleChange("scheduledAt", event.target.value)}
          />
          {errors.scheduledAt && <p className="text-sm text-red-500">{errors.scheduledAt}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Mode</label>
          <select
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-navy-900"
            value={values.mode}
            onChange={(event) => handleChange("mode", event.target.value)}
          >
            {MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Agenda</label>
          <textarea
            rows="3"
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-navy-900"
            value={values.agenda}
            placeholder="What would you like to cover in this meeting?"
            onChange={(event) => handleChange("agenda", event.target.value)}
          />
        </div>
      </div>

      <div className="px-6 pb-6 flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-100 transition-all duration-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2 rounded-lg text-sm font-medium bg-navy-900 hover:bg-navy-950 text-white transition-all duration-300 disabled:opacity-60"
        >
          {isSaving ? "Sending…" : submitLabel}
        </button>
      </div>
    </form>
  );
};

const AppointmentCard = ({ appointment, onJoin, onReschedule, onCancel, isBusy }) => {
  const isPast = new Date(appointment.scheduledAt).getTime() < Date.now();
  const isClosed = appointment.status === "cancelled" || appointment.status === "completed";

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">{appointment.meetingType}</h3>
            <StatusBadge status={appointment.status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-navy-900" />
              {formatDateTime(appointment.scheduledAt)}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-4 h-4 text-navy-900" />
              {appointment.counsellorName}
            </span>
            <span className="flex items-center gap-1">
              {appointment.mode === "Video call" ? (
                <Video className="w-4 h-4 text-navy-900" />
              ) : (
                <MapPin className="w-4 h-4 text-navy-900" />
              )}
              {appointment.location}
            </span>
            <span className="text-gray-500">{appointment.durationMinutes} min</span>
          </div>
          {appointment.agenda && (
            <p className="text-sm text-gray-600 flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              {appointment.agenda}
            </p>
          )}
          {appointment.notes && (
            <p className="text-xs text-gray-500">{appointment.notes}</p>
          )}
        </div>

        {!isClosed && (
          <div className="flex flex-wrap items-center gap-3">
            {!isPast && (
              <button
                type="button"
                onClick={() => onJoin(appointment)}
                className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-navy-900 hover:bg-navy-950 text-white transition-all duration-300"
              >
                {appointment.mode === "Video call" ? (
                  <>
                    <Video className="w-4 h-4" />
                    Join
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    View details
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => onReschedule(appointment)}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-100 transition-all duration-300"
            >
              Reschedule
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onCancel(appointment)}
              className="px-4 py-2 text-red-600 hover:text-red-700 text-sm font-medium border border-red-200 rounded-lg bg-white hover:bg-red-50 transition-all duration-300 disabled:opacity-60"
            >
              {isBusy ? "Cancelling…" : "Cancel"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Appointments = () => {
  const { showToast } = useToast();
  const {
    applications,
    appointments,
    upcomingAppointments,
    requestAppointment,
    rescheduleAppointment,
    cancelAppointment,
  } = useAppData();

  const [isLoading, setIsLoading] = useState(true);
  const [formState, setFormState] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  // Kept on screen until dismissed or a new request is started, so the
  // confirmation does not vanish with the toast.
  const [requestSent, setRequestSent] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    simulateDelay(500).then(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pastAppointments = useMemo(
    () =>
      appointments
        .filter((apt) => !upcomingAppointments.some((item) => item.id === apt.id))
        .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)),
    [appointments, upcomingAppointments]
  );

  /**
   * The student's actual advisor, from their own records.
   *
   * An application carries the counsellor assigned to it, so the most recently
   * updated one names who is working this student's file now. A past
   * appointment is the fallback, for a student who has been seen but has no
   * application open yet. If neither exists nobody is assigned, and the form
   * says so rather than inventing a name.
   */
  const assignedCounsellor = useMemo(() => {
    const fromApplication = [...applications]
      .sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt ?? 0) - new Date(a.updatedAt ?? a.createdAt ?? 0)
      )
      .find((application) => application.counsellorName);
    if (fromApplication) {
      return { id: fromApplication.counsellorId ?? null, name: fromApplication.counsellorName };
    }
    const fromAppointment = appointments.find((appointment) => appointment.counsellorName);
    return fromAppointment
      ? { id: fromAppointment.counsellorId ?? null, name: fromAppointment.counsellorName }
      : { id: null, name: "" };
  }, [applications, appointments]);

  const handleRequest = async (values) => {
    setIsSaving(true);
    try {
      await requestAppointment({
        // Sent for the local optimistic row only — the server sets the counsellor
        // when the office confirms, and ignores anything passed here.
        counsellorId: assignedCounsellor.id,
        counsellorName: assignedCounsellor.name || "To be assigned",
        meetingType: values.meetingType,
        mode: values.mode,
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        agenda: values.agenda,
      });
      setFormState(null);
      setRequestSent(true);
      showToast("Your appointment request has been submitted. Our team will review it and confirm a time with you.");
    } catch {
      showToast("We couldn't send your appointment request. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReschedule = async (values) => {
    setIsSaving(true);
    await rescheduleAppointment(
      formState.appointment.id,
      new Date(values.scheduledAt).toISOString()
    );
    setIsSaving(false);
    setFormState(null);
    showToast("Reschedule request sent.");
  };

  const handleCancel = async (appointment) => {
    setBusyId(appointment.id);
    await cancelAppointment(appointment.id);
    setBusyId(null);
    showToast(`${appointment.meetingType} cancelled.`, "info");
  };

  const handleJoin = (appointment) => {
    if (appointment.mode === "Video call") {
      // Stub action — this build has no real meeting link.
      showToast(
        `The link for ${appointment.meetingType} opens 15 minutes before the call.`,
        "info"
      );
      return;
    }
    showToast(`${appointment.meetingType} — ${appointment.location}.`, "info");
  };

  return (
    <div className="min-h-screen mt-9 pb-12">
      <PageHeader
        icon={CalendarClock}
        title="Appointments"
        description="Book, reschedule and review your counsellor meetings."
        actions={
          <button
            type="button"
            onClick={() => {
              setRequestSent(false);
              setFormState({ mode: "request" });
            }}
            className="flex items-center gap-2 px-6 py-3 bg-navy-900 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md hover:bg-navy-950 transition-all duration-300"
          >
            <CalendarPlus className="w-5 h-5" />
            Request Appointment
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {requestSent && !formState && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800"
          >
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden />
            <div className="flex-1">
              <p className="font-semibold">Your appointment request has been submitted</p>
              <p className="mt-0.5 text-sm">
                Our team will look into it and confirm a time with you. You&apos;ll get a notification as soon as
                it&apos;s confirmed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRequestSent(false)}
              aria-label="Dismiss"
              className="rounded-md p-1 text-green-700 hover:bg-green-100"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}

        {formState && (
          <RequestForm
            title={
              formState.mode === "request" ? "Request an appointment" : "Reschedule appointment"
            }
            submitLabel={
              formState.mode === "request" ? "Request appointment" : "Request new time"
            }
            isSaving={isSaving}
            initialValues={
              formState.mode === "request"
                ? {
                    counsellorName: assignedCounsellor.name,
                    meetingType: "",
                    scheduledAt: "",
                    mode: MODES[0],
                    agenda: "",
                  }
                : {
                    counsellorName:
                      formState.appointment.counsellorName || assignedCounsellor.name,
                    meetingType: formState.appointment.meetingType,
                    scheduledAt: toLocalInputValue(formState.appointment.scheduledAt),
                    mode: formState.appointment.mode,
                    agenda: formState.appointment.agenda,
                  }
            }
            onCancel={() => setFormState(null)}
            onSubmit={formState.mode === "request" ? handleRequest : handleReschedule}
          />
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming</h2>
          {isLoading ? (
            <SkeletonList count={2} />
          ) : upcomingAppointments.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No upcoming meetings"
              description="Request a session and your counsellor will confirm a time."
              action={
                <button
                  type="button"
                  onClick={() => {
              setRequestSent(false);
              setFormState({ mode: "request" });
            }}
                  className="px-6 py-2 rounded-lg text-sm font-medium bg-navy-900 hover:bg-navy-950 text-white transition-all duration-300"
                >
                  Request an appointment
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AppointmentCard
                    appointment={appointment}
                    isBusy={busyId === appointment.id}
                    onJoin={handleJoin}
                    onCancel={handleCancel}
                    onReschedule={(item) => setFormState({ mode: "reschedule", appointment: item })}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">History</h2>
          {isLoading ? (
            <SkeletonList count={2} />
          ) : pastAppointments.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No past meetings"
              description="Completed and cancelled meetings are archived here."
            />
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  isBusy={busyId === appointment.id}
                  onJoin={handleJoin}
                  onCancel={handleCancel}
                  onReschedule={(item) => setFormState({ mode: "reschedule", appointment: item })}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Appointments;
