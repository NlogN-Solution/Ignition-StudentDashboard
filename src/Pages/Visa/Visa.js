import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  ListChecks,
  MapPin,
  Plane,
  Receipt,
  Stamp,
  Upload,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { SkeletonList } from "../../components/common/Skeleton";
import { useToast } from "../../context/ToastContext";
import { useVisa } from "../../context/VisaContext";
import { daysUntil, formatDate, formatDateTime, formatDeadline, simulateDelay } from "../../lib/simulate";

const Timeline = ({ stages }) => (
  <ol className="space-y-4">
    {stages.map((stage) => (
      <li key={stage.id} className="flex items-start gap-3">
        {stage.state === "completed" ? (
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        ) : stage.state === "current" ? (
          <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <p
            className={`text-sm ${
              stage.state === "upcoming" ? "text-gray-500" : "text-gray-800 font-medium"
            }`}
          >
            {stage.label}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{stage.description}</p>
          {stage.date && (
            <span className="text-xs text-gray-400">{formatDate(stage.date)}</span>
          )}
        </div>
      </li>
    ))}
  </ol>
);

const Visa = () => {
  const {
    visa,
    stages,
    appointments,
    requiredDocuments,
    fees,
    departureChecklist,
    documentSummary,
    feeSummary,
    departureSummary,
    readinessPct,
    daysToLodgement,
    daysToProgrammeStart,
    bookAppointment,
    uploadRequiredDocument,
    markFeePaid,
    toggleDepartureItem,
  } = useVisa();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const fileInputs = useRef({});

  useEffect(() => {
    let cancelled = false;
    simulateDelay(500).then(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBook = async (appointment) => {
    setBookingId(appointment.id);
    await bookAppointment(appointment.id);
    setBookingId(null);
    showToast(`${appointment.title} booked.`, "success");
  };

  const handleUpload = async (document, file) => {
    if (!file) return;
    setUploadingId(document.id);
    await uploadRequiredDocument(document.id, file);
    setUploadingId(null);
    showToast(`${document.title} uploaded.`, "success");
  };

  const handlePay = async (fee) => {
    setPayingId(fee.id);
    await markFeePaid(fee.id);
    setPayingId(null);
    showToast(`${fee.label} paid.`, "success");
  };

  const handleToggleDeparture = (item) => {
    toggleDepartureItem(item.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-9 pb-12">
      <PageHeader
        icon={Stamp}
        title="Visa & Departure"
        description={`${visa.visaType} · ${visa.destinationCountry}`}
        actions={<StatusBadge status={visa.status} />}
      />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Snapshot */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Target lodgement",
              value: formatDate(visa.targetLodgementDate),
              hint: daysToLodgement !== null ? formatDeadline(visa.targetLodgementDate) : null,
            },
            {
              label: "Programme starts",
              value: formatDate(visa.programmeStart),
              hint: daysToProgrammeStart !== null ? formatDeadline(visa.programmeStart) : null,
            },
            { label: "Visa readiness", value: `${readinessPct}%` },
            {
              label: "Outstanding fees",
              value: `$${feeSummary.outstandingUsd.toLocaleString()}`,
              tone: feeSummary.outstandingUsd > 0 ? "text-red-600" : "text-green-600",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
            >
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-xl font-bold mt-1 ${stat.tone ?? "text-gray-800"}`}>
                {stat.value}
              </p>
              {stat.hint && <p className="text-xs text-gray-500 mt-1">{stat.hint}</p>}
            </div>
          ))}
        </div>

        {isLoading ? (
          <SkeletonList count={4} />
        ) : (
          <div className="space-y-6">
            {/* Timeline */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-medium text-gray-900 mb-4">Application Timeline</h3>
              <Timeline stages={stages} />
            </motion.div>

            {/* Required documents */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Required Documents
                </h3>
                <span className="text-sm text-gray-500">
                  {documentSummary.verifiedCount}/{documentSummary.total} verified
                </span>
              </div>
              <div className="space-y-3">
                {requiredDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="flex justify-between items-center gap-4 p-3 border border-gray-100 rounded-lg"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-800">{document.title}</p>
                        <StatusBadge status={document.status} />
                      </div>
                      {document.note && (
                        <p className="text-xs text-gray-500 mt-1">{document.note}</p>
                      )}
                    </div>
                    {document.status !== "verified" && (
                      <div className="flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputs.current[document.id]?.click()}
                          disabled={uploadingId === document.id}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-60"
                        >
                          <Upload className="h-3 w-3" />
                          {uploadingId === document.id
                            ? "Uploading…"
                            : document.status === "pending"
                            ? "Replace"
                            : "Upload"}
                        </button>
                        <input
                          ref={(element) => {
                            fileInputs.current[document.id] = element;
                          }}
                          type="file"
                          className="hidden"
                          onChange={(event) => {
                            handleUpload(document, event.target.files?.[0]);
                            event.target.value = "";
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Appointments */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Appointments
              </h3>
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 border border-gray-100 rounded-lg"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-800">{appointment.title}</p>
                        <StatusBadge status={appointment.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {appointment.provider}
                        </span>
                        <span>{formatDateTime(appointment.scheduledAt)}</span>
                      </div>
                      {appointment.note && (
                        <p className="text-xs text-gray-500 mt-1">{appointment.note}</p>
                      )}
                    </div>
                    {appointment.status === "not-booked" && (
                      <button
                        type="button"
                        onClick={() => handleBook(appointment)}
                        disabled={bookingId === appointment.id}
                        className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 disabled:opacity-60"
                      >
                        {bookingId === appointment.id ? "Booking…" : "Book appointment"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Fees */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-500" />
                Fees
              </h3>
              <div className="space-y-3">
                {fees.map((fee) => {
                  const overdue = !fee.paid && (daysUntil(fee.dueDate) ?? 0) < 0;
                  const status = fee.paid ? "paid" : overdue ? "overdue" : "due";
                  return (
                    <div
                      key={fee.id}
                      className="flex justify-between items-center gap-4 p-3 border border-gray-100 rounded-lg"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-800">{fee.label}</p>
                          <StatusBadge status={status} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {fee.paid ? `Paid ${formatDate(fee.paidAt)}` : formatDeadline(fee.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-800">
                          ${fee.amountUsd.toLocaleString()}
                        </p>
                        {!fee.paid && (
                          <button
                            type="button"
                            onClick={() => handlePay(fee)}
                            disabled={payingId === fee.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 disabled:opacity-60"
                          >
                            <Check className="h-3 w-3" />
                            {payingId === fee.id ? "Recording…" : "Mark as paid"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Departure checklist */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Plane className="w-5 h-5 text-blue-500" />
                  Departure Checklist
                </h3>
                <span className="text-sm text-gray-500">
                  {departureSummary.completed}/{departureSummary.total} done
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${departureSummary.completionPct}%` }}
                />
              </div>
              <ul className="space-y-2">
                {departureChecklist.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleToggleDeparture(item)}
                      className="w-full flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition text-left"
                    >
                      {item.completed ? (
                        <ListChecks className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          item.completed ? "text-gray-500 line-through" : "text-gray-800"
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Visa;
