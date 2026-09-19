import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import financeSeed from "../data/finance.json";
import {
  createFundingSourceApi,
  deleteFundingSourceApi,
  getBudgetApi,
  getFundingSourcesApi,
  getLoanApi,
  getSavingsGoalsApi,
  replaceBudgetApi,
  updateFundingSourceApi,
  upsertSavingsGoalApi,
} from "../api/studentPortal";
import {
  analyseRisks,
  buildAnalytics,
  buildReadinessTrend,
  calculateReadiness,
  estimateReadinessDate,
  generateAlerts,
  generateInsights,
  getCountryRequirement,
  summariseBudget,
  summariseChecklist,
  summariseCosts,
  summariseDocuments,
  summariseEmergencyFund,
  summariseFunding,
  summarisePayments,
  summariseSavingsGoal,
} from "../lib/finance";
import { simulateDelay } from "../lib/simulate";
import { useAppData } from "./AppDataContext";
import { useAuth } from "./AuthContext";

// Financial Readiness Center.
//
// Funding sources, loan, budget and savings/emergency-fund now come from the
// real `/student/me/finance/*` endpoints. Payments, the financial-document
// checklist and standalone documents have no backend model at all (real
// tuition-style payments live on the pre-existing /me/payments and are never
// duplicated here) and stay seeded from finance.json, mutated purely in
// React state, same posture as every other local-only known gap in this
// portal. Country cost-of-living / currency-rate catalog data
// (`getCountryRequirement`/`summariseCosts`) is deferred to the catalog-
// wiring task — it's the same fixture as before for now.

const FinanceContext = createContext(null);

const clone = (value) => JSON.parse(JSON.stringify(value));

const EMPTY_LOAN = {
  id: null,
  provider: "",
  productName: "",
  approvedAmount: 0,
  disbursedAmount: 0,
  interestRate: null,
  processingStatus: "",
  sanctionedAt: null,
  expectedFullDisbursement: null,
  repaymentStartsAt: null,
  tenureMonths: null,
  monthlyRepayment: null,
  collateral: "",
  documents: [],
  disbursements: [],
};

const EMPTY_BUDGET = { plannedMonthlyIncome: 0, categories: [] };

const EMPTY_SAVINGS_GOAL = {
  kind: "savings",
  currentSavings: 0,
  monthlyContribution: 0,
  targetDate: null,
  recommendedMonths: null,
};

const EMPTY_EMERGENCY_FUND = {
  kind: "emergency_fund",
  currentSavings: 0,
  monthlyContribution: null,
  targetDate: null,
  recommendedMonths: 3,
};

export const FinanceProvider = ({ children }) => {
  const { studentId } = useAuth();
  const { awardPoints, pushActivity, pushNotification } = useAppData();

  const [destinationCountry, setDestinationCountry] = useState(
    financeSeed.destinationCountry
  );
  const [displayCurrency, setDisplayCurrency] = useState(financeSeed.displayCurrency);

  const [fundingSources, setFundingSources] = useState([]);
  const [payments, setPayments] = useState(() => clone(financeSeed.payments));
  const [checklist, setChecklist] = useState(() => clone(financeSeed.checklist));
  const [documents, setDocuments] = useState(() => clone(financeSeed.documents));
  const [monthlyBudget, setMonthlyBudget] = useState(EMPTY_BUDGET);
  const [emergencyFund, setEmergencyFund] = useState(EMPTY_EMERGENCY_FUND);
  const [savingsGoal, setSavingsGoal] = useState(EMPTY_SAVINGS_GOAL);
  const [loan, setLoan] = useState(EMPTY_LOAN);
  const [dismissedAlertIds, setDismissedAlertIds] = useState([]);

  // Re-fetch whenever the signed-in student changes.
  useEffect(() => {
    let cancelled = false;
    if (!studentId) {
      setFundingSources([]);
      setLoan(EMPTY_LOAN);
      setMonthlyBudget(EMPTY_BUDGET);
      setSavingsGoal(EMPTY_SAVINGS_GOAL);
      setEmergencyFund(EMPTY_EMERGENCY_FUND);
      return undefined;
    }

    const load = async () => {
      const [nextFunding, nextLoan, nextBudget, nextSavingsList] = await Promise.all([
        getFundingSourcesApi().catch(() => []),
        getLoanApi().catch(() => null),
        getBudgetApi().catch(() => EMPTY_BUDGET),
        getSavingsGoalsApi().catch(() => []),
      ]);
      if (cancelled) return;

      setFundingSources(nextFunding);
      setLoan(nextLoan ?? EMPTY_LOAN);
      setMonthlyBudget(nextBudget);
      setSavingsGoal(nextSavingsList.find((goal) => goal.kind === "savings") ?? EMPTY_SAVINGS_GOAL);
      setEmergencyFund(
        nextSavingsList.find((goal) => goal.kind === "emergency_fund") ?? EMPTY_EMERGENCY_FUND
      );
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  /* ------------------------------------------------------------- funding --- */

  const addFundingSource = useCallback(
    async (draft) => {
      const source = await createFundingSourceApi(draft);
      setFundingSources((current) => [...current, source]);
      pushActivity(`${source.type} added as a funding source`, "finance");
      return { ok: true, source };
    },
    [pushActivity]
  );

  const updateFundingSource = useCallback(async (sourceId, patch) => {
    const updated = await updateFundingSourceApi(sourceId, patch);
    setFundingSources((current) =>
      current.map((source) => (source.id === sourceId ? updated : source))
    );
    return { ok: true };
  }, []);

  const removeFundingSource = useCallback(
    async (sourceId) => {
      const removed = fundingSources.find((source) => source.id === sourceId);
      await deleteFundingSourceApi(sourceId);
      setFundingSources((current) => current.filter((source) => source.id !== sourceId));
      if (removed) pushActivity(`${removed.type} removed from funding sources`, "finance");
    },
    [fundingSources, pushActivity]
  );

  /** KNOWN GAP: no student-facing verification endpoint — a counsellor
   * verifies proof of funds, the backend just 400s a student PATCH on an
   * already-verified source. Kept as a local-only optimistic mutation. */
  const verifyFundingSource = useCallback(
    async (sourceId) => {
      await simulateDelay(900);
      const target = fundingSources.find((source) => source.id === sourceId);
      setFundingSources((current) =>
        current.map((source) =>
          source.id === sourceId
            ? { ...source, verification: "verified", status: "Available" }
            : source
        )
      );
      if (target) {
        awardPoints("finance.sponsorVerified", `${target.type} proof verified`);
        pushActivity(`${target.type} funding verified`, "finance");
      }
      return { ok: true };
    },
    [awardPoints, fundingSources, pushActivity]
  );

  /* ------------------------------------------------------------ payments --- */
  /* KNOWN GAP: real payments live on /me/payments (Phase 5a), never duplicated
   * here — these reminder-style rows stay entirely local-only. */

  const markPaymentPaid = useCallback(
    async (paymentId, { method = "Bank transfer" } = {}) => {
      await simulateDelay(900);
      const target = payments.find((payment) => payment.id === paymentId);
      const onTime = target ? new Date(target.dueDate) >= new Date() : true;

      setPayments((current) =>
        current.map((payment) =>
          payment.id === paymentId
            ? {
                ...payment,
                status: "paid",
                paidAt: new Date().toISOString(),
                method,
                reference: `TXN-${Date.now().toString().slice(-6)}`,
              }
            : payment
        )
      );

      if (target) {
        // Paying late still clears the payment but costs points, mirroring the
        // deduction rules in ignitionPoints.json.
        awardPoints(
          onTime ? "finance.paymentOnTime" : "finance.paymentMissed",
          onTime
            ? `${target.title} paid on time`
            : `${target.title} paid after the deadline`
        );
        pushActivity(`${target.title} marked as paid`, "finance");
        pushNotification(
          "Payment recorded",
          `${target.title} has been marked as paid.`,
          "finance"
        );
      }
      return { ok: true, onTime };
    },
    [awardPoints, payments, pushActivity, pushNotification]
  );

  const togglePaymentReminder = useCallback((paymentId) => {
    setPayments((current) =>
      current.map((payment) =>
        payment.id === paymentId ? { ...payment, reminder: !payment.reminder } : payment
      )
    );
  }, []);

  /** Metadata only — the selected File never leaves the browser. */
  const uploadPaymentProof = useCallback(
    async (paymentId, file) => {
      await simulateDelay(1000);
      setPayments((current) =>
        current.map((payment) =>
          payment.id === paymentId
            ? {
                ...payment,
                proofUploaded: true,
                proof: {
                  name: file.name,
                  sizeBytes: file.size,
                  uploadedAt: new Date().toISOString(),
                },
              }
            : payment
        )
      );
      pushActivity("Payment proof uploaded", "finance");
      return { ok: true };
    },
    [pushActivity]
  );

  /* ----------------------------------------------------------- checklist --- */
  /* KNOWN GAP: no backend concept of a financial-document checklist at all. */

  const updateChecklistItem = useCallback(
    async (itemId, status) => {
      await simulateDelay(600);
      const target = checklist.find((item) => item.id === itemId);
      setChecklist((current) =>
        current.map((item) => (item.id === itemId ? { ...item, status } : item))
      );
      if (target) {
        if (status === "verified") {
          awardPoints("finance.documentVerified", `${target.title} verified`);
        } else if (status === "missing") {
          awardPoints("finance.documentMissing", `${target.title} marked missing`);
        }
        pushActivity(`${target.title} — ${status}`, "finance");
      }
      return { ok: true };
    },
    [awardPoints, checklist, pushActivity]
  );

  /* ----------------------------------------------------------- documents --- */
  /* KNOWN GAP: no standalone finance-documents endpoint. */

  const uploadFinancialDocument = useCallback(
    async (documentId, file) => {
      const target = documents.find((doc) => doc.id === documentId);

      setDocuments((current) =>
        current.map((doc) =>
          doc.id === documentId ? { ...doc, uploadStatus: "uploading" } : doc
        )
      );

      await simulateDelay(1200);

      setDocuments((current) =>
        current.map((doc) =>
          doc.id === documentId
            ? {
                ...doc,
                uploadStatus: "uploaded",
                verificationStatus: "pending",
                reviewerNotes: "Awaiting counsellor review.",
                file: {
                  name: file.name,
                  sizeBytes: file.size,
                  uploadedAt: new Date().toISOString(),
                },
              }
            : doc
        )
      );

      if (target) {
        awardPoints("document.upload", `${target.title} uploaded`);
        pushActivity(`${target.title} uploaded to your financial file`, "finance");
      }
      return { ok: true };
    },
    [awardPoints, documents, pushActivity]
  );

  const removeFinancialDocument = useCallback(
    (documentId) => {
      const target = documents.find((doc) => doc.id === documentId);
      setDocuments((current) =>
        current.map((doc) =>
          doc.id === documentId
            ? {
                ...doc,
                uploadStatus: "missing",
                verificationStatus: "pending",
                reviewerNotes: "",
                file: null,
              }
            : doc
        )
      );
      if (target) pushActivity(`${target.title} removed`, "finance");
    },
    [documents, pushActivity]
  );

  /* -------------------------------------------------------------- budget --- */

  const updateBudgetCategory = useCallback(
    async (categoryId, amount) => {
      const previous = monthlyBudget;
      const next = {
        ...monthlyBudget,
        categories: monthlyBudget.categories.map((item) =>
          item.id === categoryId ? { ...item, amount: Math.max(0, Number(amount) || 0) } : item
        ),
      };
      setMonthlyBudget(next);
      try {
        await replaceBudgetApi(next);
      } catch {
        setMonthlyBudget(previous);
      }
    },
    [monthlyBudget]
  );

  const updatePlannedIncome = useCallback(
    async (amount) => {
      const previous = monthlyBudget;
      const next = { ...monthlyBudget, plannedMonthlyIncome: Math.max(0, Number(amount) || 0) };
      setMonthlyBudget(next);
      try {
        await replaceBudgetApi(next);
      } catch {
        setMonthlyBudget(previous);
      }
    },
    [monthlyBudget]
  );

  const updateEmergencyFund = useCallback(
    async (patch) => {
      const previous = emergencyFund;
      const next = { ...emergencyFund, ...patch };
      setEmergencyFund(next);
      try {
        const saved = await upsertSavingsGoalApi("emergency_fund", next);
        setEmergencyFund(saved);
      } catch {
        setEmergencyFund(previous);
      }
    },
    [emergencyFund]
  );

  const updateSavingsGoal = useCallback(
    async (patch) => {
      const previous = savingsGoal;
      const next = { ...savingsGoal, ...patch };
      setSavingsGoal(next);
      try {
        const saved = await upsertSavingsGoalApi("savings", next);
        setSavingsGoal(saved);
      } catch {
        setSavingsGoal(previous);
      }
    },
    [savingsGoal]
  );

  /* ---------------------------------------------------------------- loan --- */
  /* KNOWN GAP: disbursements are lender-controlled and read-only on the
   * backend — no release endpoint. Local-only mutation layered on top of the
   * otherwise-real fetched loan. */

  const releaseTranche = useCallback(
    async (trancheId) => {
      await simulateDelay(900);
      const tranche = loan.disbursements.find((item) => item.id === trancheId);
      setLoan((current) => ({
        ...current,
        disbursedAmount: current.disbursedAmount + (tranche?.amount ?? 0),
        disbursements: current.disbursements.map((item) =>
          item.id === trancheId ? { ...item, status: "released" } : item
        ),
      }));
      if (tranche) pushActivity(`${tranche.label} disbursed`, "finance");
      return { ok: true };
    },
    [loan.disbursements, pushActivity]
  );

  const dismissAlert = useCallback(
    (alertId) => {
      setDismissedAlertIds((current) => [...current, alertId]);
      awardPoints("finance.reminderIgnored", "Financial reminder dismissed");
    },
    [awardPoints]
  );

  /* ------------------------------------------------------------- derived --- */

  const finance = useMemo(
    () => ({ ...financeSeed, destinationCountry, displayCurrency }),
    [destinationCountry, displayCurrency]
  );

  const requirement = useMemo(
    () => getCountryRequirement(destinationCountry),
    [destinationCountry]
  );
  const costSummary = useMemo(
    () => summariseCosts(destinationCountry),
    [destinationCountry]
  );
  const fundingSummary = useMemo(() => summariseFunding(fundingSources), [fundingSources]);
  const paymentSummary = useMemo(() => summarisePayments(payments), [payments]);
  const budgetSummary = useMemo(() => summariseBudget(monthlyBudget), [monthlyBudget]);
  const emergencySummary = useMemo(
    () => summariseEmergencyFund(emergencyFund, budgetSummary),
    [budgetSummary, emergencyFund]
  );
  const checklistSummary = useMemo(() => summariseChecklist(checklist), [checklist]);
  const documentSummary = useMemo(() => summariseDocuments(documents), [documents]);
  const savingsSummary = useMemo(
    () => summariseSavingsGoal(savingsGoal, requirement.totalRequiredUsd, fundingSummary),
    [fundingSummary, requirement.totalRequiredUsd, savingsGoal]
  );

  const readiness = useMemo(
    () =>
      calculateReadiness({
        requirement,
        fundingSummary,
        emergencySummary,
        checklistSummary,
        paymentSummary,
        loan,
      }),
    [checklistSummary, emergencySummary, fundingSummary, loan, paymentSummary, requirement]
  );

  const readinessDate = useMemo(
    () => estimateReadinessDate(readiness.fundingGapUsd, savingsGoal.monthlyContribution),
    [readiness.fundingGapUsd, savingsGoal.monthlyContribution]
  );

  const riskAnalysis = useMemo(
    () =>
      analyseRisks({
        requirement,
        costSummary,
        fundingSummary,
        emergencySummary,
        documentSummary,
        paymentSummary,
        loan,
        currencyCode: finance.homeCurrency,
      }),
    [
      costSummary,
      documentSummary,
      emergencySummary,
      finance.homeCurrency,
      fundingSummary,
      loan,
      paymentSummary,
      requirement,
    ]
  );

  const alerts = useMemo(
    () =>
      generateAlerts({
        paymentSummary,
        checklistSummary,
        documentSummary,
        emergencySummary,
        loan,
        currencyCode: displayCurrency,
        finance,
      }).filter((alert) => !dismissedAlertIds.includes(alert.id)),
    [
      checklistSummary,
      dismissedAlertIds,
      displayCurrency,
      documentSummary,
      emergencySummary,
      finance,
      loan,
      paymentSummary,
    ]
  );

  const insights = useMemo(
    () =>
      generateInsights({
        requirement,
        fundingSummary,
        emergencySummary,
        budgetSummary,
        savingsSummary,
        readiness,
        finance,
      }),
    [
      budgetSummary,
      emergencySummary,
      finance,
      fundingSummary,
      readiness,
      requirement,
      savingsSummary,
    ]
  );

  const analytics = useMemo(
    () =>
      buildAnalytics({
        costSummary,
        fundingSummary,
        paymentSummary,
        budgetSummary,
        readiness,
      }),
    [budgetSummary, costSummary, fundingSummary, paymentSummary, readiness]
  );

  const readinessTrend = useMemo(
    () => buildReadinessTrend(readiness.score),
    [readiness.score]
  );

  const value = useMemo(
    () => ({
      // raw (local) state
      finance,
      destinationCountry,
      displayCurrency,
      fundingSources,
      payments,
      checklist,
      documents,
      monthlyBudget,
      emergencyFund,
      savingsGoal,
      loan,

      // derived
      requirement,
      costSummary,
      fundingSummary,
      paymentSummary,
      budgetSummary,
      emergencySummary,
      checklistSummary,
      documentSummary,
      savingsSummary,
      readiness,
      readinessDate,
      readinessTrend,
      riskAnalysis,
      alerts,
      insights,
      analytics,

      // actions
      setDestinationCountry,
      setDisplayCurrency,
      addFundingSource,
      updateFundingSource,
      removeFundingSource,
      verifyFundingSource,
      markPaymentPaid,
      togglePaymentReminder,
      uploadPaymentProof,
      updateChecklistItem,
      uploadFinancialDocument,
      removeFinancialDocument,
      updateBudgetCategory,
      updatePlannedIncome,
      updateEmergencyFund,
      updateSavingsGoal,
      releaseTranche,
      dismissAlert,
    }),
    [
      addFundingSource,
      alerts,
      analytics,
      budgetSummary,
      checklist,
      checklistSummary,
      costSummary,
      destinationCountry,
      dismissAlert,
      displayCurrency,
      documentSummary,
      documents,
      emergencyFund,
      emergencySummary,
      finance,
      fundingSources,
      fundingSummary,
      insights,
      loan,
      markPaymentPaid,
      monthlyBudget,
      paymentSummary,
      payments,
      readiness,
      readinessDate,
      readinessTrend,
      releaseTranche,
      removeFinancialDocument,
      removeFundingSource,
      requirement,
      riskAnalysis,
      savingsGoal,
      savingsSummary,
      togglePaymentReminder,
      updateBudgetCategory,
      updateChecklistItem,
      updateEmergencyFund,
      updateFundingSource,
      updatePlannedIncome,
      updateSavingsGoal,
      uploadFinancialDocument,
      uploadPaymentProof,
      verifyFundingSource,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used inside a FinanceProvider");
  }
  return context;
};

export default FinanceContext;
