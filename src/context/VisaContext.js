import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  bookVisaAppointmentApi,
  getVisaCaseApi,
  setDepartureItemCompletedApi,
  setVisaFeePaidApi,
} from "../api/studentPortal";
import { daysUntil } from "../lib/simulate";
import { useAppData } from "./AppDataContext";
import { useAuth } from "./AuthContext";

// Visa & Departure tracker, backed by the real `/student/me/visa` case.
//
// A `VisaCase` is opened by staff once an application reaches the visa
// stage — same posture as `Application` itself, which a counsellor opens
// rather than a student. A student with no case yet (nothing to track) sees
// the same empty shape a fixture-less page would; every summary below just
// comes out at 0%.

const VisaContext = createContext(null);

const EMPTY_CASE = {
  id: null,
  applicationId: null,
  destinationCountry: "",
  visaType: "",
  applicationNumber: null,
  status: "",
  targetLodgementDate: null,
  programmeStart: null,
  processingEstimateWeeks: null,
  stages: [],
  appointments: [],
  requiredDocuments: [],
  fees: [],
  departureChecklist: [],
};

export const VisaProvider = ({ children }) => {
  const { studentId } = useAuth();
  const { pushActivity, pushNotification } = useAppData();

  const [visaCase, setVisaCase] = useState(EMPTY_CASE);

  useEffect(() => {
    let cancelled = false;
    if (!studentId) {
      setVisaCase(EMPTY_CASE);
      return undefined;
    }
    getVisaCaseApi()
      .then((data) => {
        if (!cancelled) setVisaCase(data ?? EMPTY_CASE);
      })
      .catch(() => {
        if (!cancelled) setVisaCase(EMPTY_CASE);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const appointments = visaCase.appointments;
  const requiredDocuments = visaCase.requiredDocuments;
  const fees = visaCase.fees;
  const departureChecklist = visaCase.departureChecklist;

  // KNOWN GAP: the backend requires a real `scheduled_at` when booking, but
  // this page's "Book appointment" is a single click with no date picker —
  // there's no staff-suggested slot to fall back to either (the real model
  // leaves `scheduled_at` null until booked). Books for "now".
  const bookAppointment = useCallback(
    async (appointmentId) => {
      const target = appointments.find((item) => item.id === appointmentId);
      const updated = await bookVisaAppointmentApi(appointmentId, new Date().toISOString());
      setVisaCase((current) => ({
        ...current,
        appointments: current.appointments.map((item) =>
          item.id === appointmentId ? updated : item
        ),
      }));
      if (target) pushActivity(`${target.title} booked`, "visa");
      return { ok: true };
    },
    [appointments, pushActivity]
  );

  /** No backend route for this — no file field on `VisaDocumentRequirement`
   * at all. Kept as a local-only optimistic mutation. */
  const uploadRequiredDocument = useCallback(async (documentId, file) => {
    const target = requiredDocuments.find((item) => item.id === documentId);
    setVisaCase((current) => ({
      ...current,
      requiredDocuments: current.requiredDocuments.map((item) =>
        item.id === documentId
          ? {
              ...item,
              status: "pending",
              note: "Uploaded — awaiting verification.",
              file: file ? { name: file.name, sizeBytes: file.size } : item.file,
            }
          : item
      ),
    }));
    if (target) pushActivity(`${target.title} uploaded for the visa file`, "visa");
    return { ok: true };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiredDocuments, pushActivity]);

  const markFeePaid = useCallback(
    async (feeId) => {
      const target = fees.find((item) => item.id === feeId);
      const updated = await setVisaFeePaidApi(feeId, true);
      setVisaCase((current) => ({
        ...current,
        fees: current.fees.map((item) => (item.id === feeId ? updated : item)),
      }));
      if (target) {
        pushActivity(`${target.label} paid`, "visa");
        pushNotification("Visa fee paid", `${target.label} has been marked as paid.`, "visa");
      }
      return { ok: true };
    },
    [fees, pushActivity, pushNotification]
  );

  const toggleDepartureItem = useCallback(
    async (itemId) => {
      const target = departureChecklist.find((item) => item.id === itemId);
      const completing = target ? !target.completed : false;
      const updated = await setDepartureItemCompletedApi(itemId, completing);
      setVisaCase((current) => ({
        ...current,
        departureChecklist: current.departureChecklist.map((item) =>
          item.id === itemId ? updated : item
        ),
      }));
      if (target && completing) pushActivity(`${target.title} — done`, "visa");
      return { ok: true };
    },
    [departureChecklist, pushActivity]
  );

  const documentSummary = useMemo(() => {
    const total = requiredDocuments.length;
    const verifiedCount = requiredDocuments.filter((doc) => doc.status === "verified").length;
    const pendingCount = requiredDocuments.filter((doc) => doc.status === "pending").length;
    const missingCount = requiredDocuments.filter((doc) => doc.status === "missing").length;
    return {
      total,
      verifiedCount,
      pendingCount,
      missingCount,
      completionPct: total ? Math.round((verifiedCount / total) * 100) : 0,
    };
  }, [requiredDocuments]);

  const feeSummary = useMemo(() => {
    const total = fees.length;
    const paidCount = fees.filter((fee) => fee.paid).length;
    const totalUsd = fees.reduce((sum, fee) => sum + fee.amountUsd, 0);
    const outstandingUsd = fees
      .filter((fee) => !fee.paid)
      .reduce((sum, fee) => sum + fee.amountUsd, 0);
    const overdueCount = fees.filter(
      (fee) => !fee.paid && (daysUntil(fee.dueDate) ?? 0) < 0
    ).length;
    return {
      total,
      paidCount,
      totalUsd,
      outstandingUsd,
      overdueCount,
      completionPct: total ? Math.round((paidCount / total) * 100) : 0,
    };
  }, [fees]);

  const departureSummary = useMemo(() => {
    const total = departureChecklist.length;
    const completed = departureChecklist.filter((item) => item.completed).length;
    return {
      total,
      completed,
      completionPct: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [departureChecklist]);

  const readinessPct = useMemo(
    () =>
      Math.round(
        (documentSummary.completionPct + feeSummary.completionPct + departureSummary.completionPct) /
          3
      ),
    [departureSummary.completionPct, documentSummary.completionPct, feeSummary.completionPct]
  );

  const daysToLodgement = useMemo(
    () => daysUntil(visaCase.targetLodgementDate),
    [visaCase.targetLodgementDate]
  );
  const daysToProgrammeStart = useMemo(
    () => daysUntil(visaCase.programmeStart),
    [visaCase.programmeStart]
  );

  const value = useMemo(
    () => ({
      visa: visaCase,
      stages: visaCase.stages,
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
    }),
    [
      appointments,
      bookAppointment,
      daysToLodgement,
      daysToProgrammeStart,
      departureChecklist,
      departureSummary,
      documentSummary,
      fees,
      feeSummary,
      markFeePaid,
      readinessPct,
      requiredDocuments,
      toggleDepartureItem,
      uploadRequiredDocument,
      visaCase,
    ]
  );

  return <VisaContext.Provider value={value}>{children}</VisaContext.Provider>;
};

export const useVisa = () => {
  const context = useContext(VisaContext);
  if (!context) {
    throw new Error("useVisa must be used inside a VisaProvider");
  }
  return context;
};

export default VisaContext;
