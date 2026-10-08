import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { formatDateTime } from "../../lib/simulate";
import StatusBadge from "../common/StatusBadge";

/** Shared by the dashboard and appointment list; always above the app shell. */
const AppointmentDetailsDialog = ({ appointment, onClose }) => {
  const dialog = useRef(null);
  const closeButton = useRef(null);
  useEffect(() => {
    if (!appointment) return undefined;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const nodes = dialog.current?.querySelectorAll('button, a[href]');
      if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", onKeyDown); previous?.focus(); };
  }, [appointment, onClose]);
  if (!appointment) return null;
  const fields = [
    ["Counsellor", appointment.counsellorName || "To be assigned"],
    [appointment.status === "requested" ? "Preferred time" : "Date and time", appointment.scheduledAt ? formatDateTime(appointment.scheduledAt) : "Awaiting confirmation"],
    ["Mode", appointment.mode], ["Location", appointment.location],
    ["Duration", appointment.durationMinutes ? `${appointment.durationMinutes} minutes` : null],
    ["Agenda", appointment.agenda], ["Notes", appointment.notes],
  ];
  return createPortal(<div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-navy-900/50 p-4 pt-[max(1rem,5vh)]" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="appointment-details-title" className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-hairline bg-white p-6 shadow-float">
      <button ref={closeButton} onClick={onClose} aria-label="Close appointment details" className="absolute right-3 top-3 rounded-lg p-2 text-ink-muted hover:bg-canvas"><X className="h-5 w-5" /></button>
      <h2 id="appointment-details-title" className="pr-9 text-xl font-semibold text-navy-900">{appointment.meetingType || "Appointment details"}</h2>
      <div className="mt-3"><StatusBadge status={appointment.status} /></div>
      <dl className="mt-5 space-y-4">{fields.filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-xs font-medium text-ink-muted">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">{value}</dd></div>)}</dl>
      {appointment.meetingLink && <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white">Join meeting</a>}
    </section>
  </div>, document.body);
};
export default AppointmentDetailsDialog;
