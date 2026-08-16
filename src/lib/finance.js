// Derivation layer for the Financial Readiness Center.
//
// Everything here is a pure function over the static JSON in src/data. There is
// no backend scoring engine, no live FX feed and no model call — alerts, risks
// and insights are all computed deterministically from the same numbers the
// student can see on screen. The signatures are shaped so each function could
// later be backed by a real endpoint without changing its callers.

import countryFinance from "../data/countryFinance.json";
import currencyRates from "../data/currencyRates.json";
import { daysUntil } from "./simulate";

/* ------------------------------------------------------------- currency --- */

export const getCurrency = (code) =>
  currencyRates.currencies.find((currency) => currency.code === code) ??
  currencyRates.currencies[0];

/** USD is the storage unit for every amount in finance.json. */
export const convertFromUsd = (amountUsd, code) =>
  amountUsd * getCurrency(code).perUsd;

export const formatMoney = (amountUsd, code = "USD", options = {}) => {
  const currency = getCurrency(code);
  const value = convertFromUsd(amountUsd, code);
  const maximumFractionDigits = options.precise ? 2 : 0;
  return `${currency.symbol}${value.toLocaleString(undefined, {
    maximumFractionDigits,
  })}`;
};

export const getCurrencyTrend = (code) => ({
  values: currencyRates.trends[code] ?? [],
  labels: currencyRates.trendLabels,
  changePct: getCurrency(code).changePct,
  lastUpdated: currencyRates.lastUpdated,
  source: currencyRates.source,
});

/* -------------------------------------------------------------- country --- */

export const getCountryProfile = (country) =>
  countryFinance[country] ?? countryFinance[Object.keys(countryFinance)[0]];

export const listCountries = () => Object.keys(countryFinance);

export const getCountryRequirement = (country) => {
  const profile = getCountryProfile(country);
  const { tuitionUsd, livingCostUsd, insuranceUsd, visaFeeUsd, biometricsUsd } =
    profile.requirements;
  return {
    ...profile.requirements,
    profile,
    totalRequiredUsd:
      tuitionUsd + livingCostUsd + insuranceUsd + visaFeeUsd + biometricsUsd,
  };
};

/* -------------------------------------------------------------- funding --- */

const VERIFIED = "verified";

export const summariseFunding = (fundingSources) => {
  const secured = fundingSources
    .filter((source) => source.status === "Available")
    .reduce((sum, source) => sum + source.amount, 0);
  const pending = fundingSources
    .filter((source) => source.status !== "Available")
    .reduce((sum, source) => sum + source.amount, 0);
  const verified = fundingSources
    .filter((source) => source.verification === VERIFIED)
    .reduce((sum, source) => sum + source.amount, 0);

  return {
    securedUsd: secured,
    pendingUsd: pending,
    verifiedUsd: verified,
    declaredUsd: secured + pending,
    unverifiedCount: fundingSources.filter((s) => s.verification !== VERIFIED).length,
  };
};

/* ----------------------------------------------------------------- costs --- */

export const summariseCosts = (country) => {
  const profile = getCountryProfile(country);
  const total = profile.costCategories.reduce((sum, item) => sum + item.amount, 0);
  return {
    categories: profile.costCategories.map((item) => ({
      ...item,
      percentage: total ? Math.round((item.amount / total) * 100) : 0,
    })),
    totalUsd: total,
    essentialUsd: profile.costCategories
      .filter((item) => item.essential)
      .reduce((sum, item) => sum + item.amount, 0),
  };
};

/* -------------------------------------------------------------- payments --- */

/** Payments are re-derived so an overdue date shows as overdue without editing JSON. */
export const derivePayments = (payments) =>
  [...payments]
    .map((payment) => {
      const days = daysUntil(payment.dueDate);
      let status = payment.status;
      if (status !== "paid") {
        if (days !== null && days < 0) status = "overdue";
        else if (days !== null && days <= 30) status = "due";
        else status = "upcoming";
      }
      return { ...payment, status, daysUntilDue: days };
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

export const summarisePayments = (payments) => {
  const derived = derivePayments(payments);
  const paid = derived.filter((p) => p.status === "paid");
  const overdue = derived.filter((p) => p.status === "overdue");
  const outstanding = derived.filter((p) => p.status !== "paid");

  return {
    payments: derived,
    paidUsd: paid.reduce((sum, p) => sum + p.amount, 0),
    outstandingUsd: outstanding.reduce((sum, p) => sum + p.amount, 0),
    overdueCount: overdue.length,
    nextPayment: outstanding[0] ?? null,
    completionPct: derived.length
      ? Math.round((paid.length / derived.length) * 100)
      : 0,
  };
};

/* -------------------------------------------------------------- budget --- */

export const summariseBudget = (monthlyBudget) => {
  const monthlyCost = monthlyBudget.categories.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const essentialCost = monthlyBudget.categories
    .filter((item) => item.essential)
    .reduce((sum, item) => sum + item.amount, 0);
  const remaining = monthlyBudget.plannedMonthlyIncome - monthlyCost;
  const ratio = monthlyBudget.plannedMonthlyIncome
    ? monthlyCost / monthlyBudget.plannedMonthlyIncome
    : 1;

  let health = "Healthy";
  if (ratio > 1) health = "Over budget";
  else if (ratio > 0.9) health = "Tight";

  return {
    categories: monthlyBudget.categories.map((item) => ({
      ...item,
      percentage: monthlyCost ? Math.round((item.amount / monthlyCost) * 100) : 0,
    })),
    monthlyCostUsd: monthlyCost,
    essentialCostUsd: essentialCost,
    remainingUsd: remaining,
    yearlyProjectionUsd: monthlyCost * 12,
    health,
    ratio,
  };
};

/* ------------------------------------------------------- emergency fund --- */

export const summariseEmergencyFund = (emergencyFund, budgetSummary) => {
  const recommended = budgetSummary.monthlyCostUsd * emergencyFund.recommendedMonths;
  const coverage = recommended
    ? Math.min(Math.round((emergencyFund.currentSavings / recommended) * 100), 100)
    : 0;

  return {
    recommendedUsd: recommended,
    currentUsd: emergencyFund.currentSavings,
    remainingUsd: Math.max(recommended - emergencyFund.currentSavings, 0),
    coveragePct: coverage,
    monthsCovered: budgetSummary.monthlyCostUsd
      ? emergencyFund.currentSavings / budgetSummary.monthlyCostUsd
      : 0,
    recommendation:
      coverage >= 100
        ? "Your emergency fund fully covers the recommended buffer. Keep it untouched until you arrive."
        : `Set aside ${Math.max(
            emergencyFund.recommendedMonths -
              Math.floor(
                emergencyFund.currentSavings / (budgetSummary.monthlyCostUsd || 1)
              ),
            1
          )} more month(s) of living costs before your visa appointment — consular officers look for a buffer beyond the minimum.`,
  };
};

/* ---------------------------------------------------------- savings goal --- */

export const summariseSavingsGoal = (savingsGoal, totalRequiredUsd, fundingSummary) => {
  const remaining = Math.max(totalRequiredUsd - fundingSummary.securedUsd, 0);
  const monthsToTarget = Math.max(
    Math.ceil((new Date(savingsGoal.targetDate) - Date.now()) / (86400000 * 30)),
    1
  );
  const monthlyTarget = Math.ceil(remaining / monthsToTarget);
  const monthsAtCurrentRate = savingsGoal.monthlyContribution
    ? Math.ceil(remaining / savingsGoal.monthlyContribution)
    : null;

  const estimatedCompletion =
    monthsAtCurrentRate === null
      ? null
      : new Date(Date.now() + monthsAtCurrentRate * 86400000 * 30).toISOString();

  return {
    totalRequiredUsd,
    currentSavingsUsd: savingsGoal.currentSavings,
    remainingUsd: remaining,
    monthlyContributionUsd: savingsGoal.monthlyContribution,
    monthlySavingTargetUsd: monthlyTarget,
    targetDate: savingsGoal.targetDate,
    estimatedCompletion,
    onTrack: savingsGoal.monthlyContribution >= monthlyTarget,
    progressPct: totalRequiredUsd
      ? Math.min(Math.round((fundingSummary.securedUsd / totalRequiredUsd) * 100), 100)
      : 0,
  };
};

/* ------------------------------------------------------------- checklist --- */

export const summariseChecklist = (checklist) => {
  const required = checklist.filter((item) => item.required);
  const done = required.filter((item) => item.status === "verified");
  return {
    total: required.length,
    verified: done.length,
    outstanding: required.filter((item) => item.status !== "verified"),
    completionPct: required.length
      ? Math.round((done.length / required.length) * 100)
      : 0,
  };
};

export const summariseDocuments = (documents) => {
  const verified = documents.filter((doc) => doc.verificationStatus === "verified");
  const rejected = documents.filter((doc) => doc.verificationStatus === "rejected");
  const missing = documents.filter((doc) => doc.uploadStatus === "missing");
  return {
    total: documents.length,
    verifiedCount: verified.length,
    rejectedCount: rejected.length,
    missingCount: missing.length,
    completionPct: documents.length
      ? Math.round((verified.length / documents.length) * 100)
      : 0,
  };
};

/* --------------------------------------------------------- readiness score --- */

const READINESS_LEVELS = [
  { min: 85, level: "Visa ready", tone: "green" },
  { min: 65, level: "Nearly ready", tone: "blue" },
  { min: 40, level: "In progress", tone: "orange" },
  { min: 0, level: "Not ready", tone: "red" },
];

/**
 * Weighted composite of everything that determines whether a student can
 * actually fund the move. Each factor reports its own contribution so the UI
 * can show *why* the score is what it is.
 */
export const calculateReadiness = ({
  requirement,
  fundingSummary,
  emergencySummary,
  checklistSummary,
  paymentSummary,
  loan,
}) => {
  const tuitionCoverage = Math.min(
    fundingSummary.securedUsd / (requirement.tuitionUsd || 1),
    1
  );
  const livingCoverage = Math.min(
    Math.max(fundingSummary.securedUsd - requirement.tuitionUsd, 0) /
      (requirement.livingCostUsd || 1),
    1
  );
  const availableFunds = Math.min(
    fundingSummary.securedUsd / (requirement.totalRequiredUsd || 1),
    1
  );
  const emergency = emergencySummary.coveragePct / 100;
  const documents = checklistSummary.completionPct / 100;
  const paymentsUpToDate = paymentSummary.overdueCount === 0 ? 1 : 0;
  const loanApproved =
    loan.processingStatus === "Approved" || loan.disbursedAmount > 0
      ? 1
      : loan.approvedAmount > 0
      ? 0.5
      : 0;
  const sponsorsVerified = fundingSummary.declaredUsd
    ? fundingSummary.verifiedUsd / fundingSummary.declaredUsd
    : 0;

  const factors = [
    { key: "availableFunds", label: "Available funds", weight: 20, value: availableFunds },
    { key: "tuition", label: "Tuition coverage", weight: 18, value: tuitionCoverage },
    { key: "living", label: "Living cost coverage", weight: 14, value: livingCoverage },
    { key: "emergency", label: "Emergency fund", weight: 10, value: emergency },
    { key: "documents", label: "Required documents", weight: 15, value: documents },
    { key: "payments", label: "Payments up to date", weight: 8, value: paymentsUpToDate },
    { key: "loan", label: "Loan approval", weight: 8, value: loanApproved },
    { key: "sponsors", label: "Sponsor verification", weight: 7, value: sponsorsVerified },
  ].map((factor) => ({
    ...factor,
    earned: Math.round(factor.weight * factor.value),
    pct: Math.round(factor.value * 100),
  }));

  const score = Math.min(
    factors.reduce((sum, factor) => sum + factor.earned, 0),
    100
  );
  const band = READINESS_LEVELS.find((entry) => score >= entry.min);

  const missing = factors
    .filter((factor) => factor.value < 1)
    .sort((a, b) => b.weight - a.weight)
    .map((factor) => ({
      label: factor.label,
      shortfall: factor.weight - factor.earned,
      pct: factor.pct,
    }));

  // Projected date assumes the current savings rate closes the funding gap.
  const gap = Math.max(requirement.totalRequiredUsd - fundingSummary.securedUsd, 0);

  return {
    score,
    level: band.level,
    tone: band.tone,
    factors,
    missing,
    fundingGapUsd: gap,
  };
};

export const estimateReadinessDate = (fundingGapUsd, monthlyContributionUsd) => {
  if (fundingGapUsd <= 0) return { isReady: true, date: null, months: 0 };
  if (!monthlyContributionUsd) return { isReady: false, date: null, months: null };
  const months = Math.ceil(fundingGapUsd / monthlyContributionUsd);
  return {
    isReady: false,
    months,
    date: new Date(Date.now() + months * 86400000 * 30).toISOString(),
  };
};

/* --------------------------------------------------------------- risks --- */

export const analyseRisks = ({
  requirement,
  costSummary,
  fundingSummary,
  emergencySummary,
  documentSummary,
  paymentSummary,
  loan,
  currencyCode,
}) => {
  const tuitionRatio = costSummary.totalUsd
    ? requirement.tuitionUsd / costSummary.totalUsd
    : 0;
  const fxChange = Math.abs(getCurrency(currencyCode).changePct);

  const risks = [
    {
      id: "risk-tuition-ratio",
      title: "High tuition ratio",
      detail: `Tuition is ${Math.round(tuitionRatio * 100)}% of your total estimated cost.`,
      severity: tuitionRatio > 0.6 ? "high" : tuitionRatio > 0.45 ? "medium" : "low",
    },
    {
      id: "risk-emergency",
      title: "Low emergency fund",
      detail: `Your buffer covers ${emergencySummary.coveragePct}% of the recommended amount.`,
      severity:
        emergencySummary.coveragePct < 40
          ? "high"
          : emergencySummary.coveragePct < 80
          ? "medium"
          : "low",
    },
    {
      id: "risk-loan",
      title: "Pending loan disbursement",
      detail: `${formatMoney(
        loan.approvedAmount - loan.disbursedAmount
      )} of the approved loan is still undisbursed.`,
      severity:
        loan.disbursedAmount === 0
          ? "high"
          : loan.disbursedAmount < loan.approvedAmount
          ? "medium"
          : "low",
    },
    {
      id: "risk-documents",
      title: "Missing financial documents",
      detail: `${documentSummary.missingCount} missing and ${documentSummary.rejectedCount} rejected.`,
      severity:
        documentSummary.missingCount + documentSummary.rejectedCount >= 3
          ? "high"
          : documentSummary.missingCount + documentSummary.rejectedCount > 0
          ? "medium"
          : "low",
    },
    {
      id: "risk-insufficient",
      title: "Insufficient funds for requirement",
      detail:
        fundingSummary.securedUsd >= requirement.totalRequiredUsd
          ? "Secured funds meet the country requirement."
          : `You are ${formatMoney(
              requirement.totalRequiredUsd - fundingSummary.securedUsd
            )} short of the ${requirement.profile.code} requirement.`,
      severity:
        fundingSummary.securedUsd >= requirement.totalRequiredUsd
          ? "low"
          : fundingSummary.declaredUsd >= requirement.totalRequiredUsd
          ? "medium"
          : "high",
    },
    {
      id: "risk-overdue",
      title: "Overdue payments",
      detail: paymentSummary.overdueCount
        ? `${paymentSummary.overdueCount} payment(s) past their due date.`
        : "No payments are overdue.",
      severity: paymentSummary.overdueCount > 0 ? "high" : "low",
    },
    {
      id: "risk-currency",
      title: "Currency volatility",
      detail: `${currencyCode} moved ${fxChange.toFixed(1)}% against USD this month.`,
      severity: fxChange > 2 ? "high" : fxChange > 1 ? "medium" : "low",
    },
  ];

  const weights = { high: 3, medium: 2, low: 1 };
  const average =
    risks.reduce((sum, risk) => sum + weights[risk.severity], 0) / risks.length;
  const overall = average >= 2.2 ? "High" : average >= 1.6 ? "Medium" : "Low";

  return { risks, overall };
};

/* -------------------------------------------------------------- alerts --- */

/**
 * Reminder feed. In a server-backed build these would come from a scheduled
 * job; here the same rules run client-side over the static data.
 */
export const generateAlerts = ({
  paymentSummary,
  checklistSummary,
  documentSummary,
  emergencySummary,
  loan,
  currencyCode,
  finance,
}) => {
  const alerts = [];

  paymentSummary.payments
    .filter((payment) => payment.status === "overdue")
    .forEach((payment) => {
      alerts.push({
        id: `alert-overdue-${payment.id}`,
        severity: "high",
        title: "Payment overdue",
        message: `${payment.title} (${formatMoney(payment.amount, currencyCode)}) was due ${Math.abs(
          payment.daysUntilDue
        )} day(s) ago.`,
      });
    });

  paymentSummary.payments
    .filter((payment) => payment.status === "due")
    .slice(0, 3)
    .forEach((payment) => {
      alerts.push({
        id: `alert-due-${payment.id}`,
        severity: "medium",
        title: `${payment.title} due soon`,
        message: `${formatMoney(payment.amount, currencyCode)} due in ${payment.daysUntilDue} day(s).`,
      });
    });

  if (loan.disbursedAmount < loan.approvedAmount) {
    alerts.push({
      id: "alert-loan",
      severity: "medium",
      title: "Loan processing incomplete",
      message: `${formatMoney(
        loan.approvedAmount - loan.disbursedAmount,
        currencyCode
      )} is still to be disbursed, expected by ${new Date(
        loan.expectedFullDisbursement
      ).toLocaleDateString()}.`,
    });
  }

  checklistSummary.outstanding.slice(0, 3).forEach((item) => {
    alerts.push({
      id: `alert-checklist-${item.id}`,
      severity: item.status === "missing" || item.status === "rejected" ? "high" : "low",
      title: `${item.title} — ${item.status}`,
      message: item.description,
    });
  });

  if (documentSummary.rejectedCount > 0) {
    alerts.push({
      id: "alert-doc-rejected",
      severity: "high",
      title: "A financial document was rejected",
      message: `${documentSummary.rejectedCount} document(s) need to be re-uploaded before your visa file is complete.`,
    });
  }

  if (emergencySummary.coveragePct < 100) {
    alerts.push({
      id: "alert-emergency",
      severity: emergencySummary.coveragePct < 50 ? "high" : "low",
      title: "Emergency fund below target",
      message: `${formatMoney(
        emergencySummary.remainingUsd,
        currencyCode
      )} short of the recommended buffer.`,
    });
  }

  const fx = getCurrency(finance.homeCurrency);
  if (Math.abs(fx.changePct) >= 1) {
    alerts.push({
      id: "alert-fx",
      severity: fx.changePct > 0 ? "medium" : "low",
      title: `${fx.code} exchange rate moved ${fx.changePct > 0 ? "up" : "down"}`,
      message: `1 USD is now ${fx.perUsd} ${fx.code} (${fx.changePct > 0 ? "+" : ""}${fx.changePct}% this month).`,
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
};

/* ------------------------------------------------------------ insights --- */

/**
 * Rule-based advice. Deliberately provider-agnostic: swapping these rules for a
 * model response later only means replacing the body of this function.
 */
export const generateInsights = ({
  requirement,
  fundingSummary,
  emergencySummary,
  budgetSummary,
  savingsSummary,
  readiness,
  finance,
}) => {
  const insights = [];

  if (
    fundingSummary.securedUsd >= requirement.tuitionUsd &&
    emergencySummary.coveragePct < 100
  ) {
    insights.push({
      id: "insight-emergency",
      title: "Strengthen your buffer before the visa appointment",
      body: `You currently have enough secured funds to cover tuition (${formatMoney(
        requirement.tuitionUsd
      )}), but your emergency fund sits at ${emergencySummary.coveragePct}% of the recommended amount. Top it up by ${formatMoney(
        emergencySummary.remainingUsd
      )} before you lodge your ${finance.destinationCountry} application.`,
    });
  }

  const accommodation = budgetSummary.categories.find(
    (item) => item.category === "Accommodation"
  );
  if (accommodation && accommodation.percentage > 35) {
    insights.push({
      id: "insight-accommodation",
      title: "Accommodation is your largest monthly cost",
      body: `Rent is ${accommodation.percentage}% of your monthly budget. Shared accommodation typically saves 25–30%, which would cut roughly ${formatMoney(
        Math.round(accommodation.amount * 0.27 * 12)
      )} from your yearly projection.`,
    });
  }

  const cheaper = listCountries()
    .map((country) => ({ country, requirement: getCountryRequirement(country) }))
    .sort((a, b) => a.requirement.totalRequiredUsd - b.requirement.totalRequiredUsd)[0];
  if (cheaper && cheaper.country !== finance.destinationCountry) {
    insights.push({
      id: "insight-country",
      title: `${cheaper.country} is currently the cheapest of your options`,
      body: `Based on your financial profile, ${cheaper.country} requires ${formatMoney(
        requirement.totalRequiredUsd - cheaper.requirement.totalRequiredUsd
      )} less than ${finance.destinationCountry}. Worth discussing with your counsellor if the funding gap does not close in time.`,
    });
  }

  if (!savingsSummary.onTrack) {
    insights.push({
      id: "insight-savings",
      title: "Your savings rate will not close the gap in time",
      body: `To reach ${formatMoney(savingsSummary.totalRequiredUsd)} by ${new Date(
        savingsSummary.targetDate
      ).toLocaleDateString()} you need to save ${formatMoney(
        savingsSummary.monthlySavingTargetUsd
      )} per month — you are currently saving ${formatMoney(
        savingsSummary.monthlyContributionUsd
      )}.`,
    });
  }

  if (readiness.score >= 85) {
    insights.push({
      id: "insight-ready",
      title: "You are financially visa-ready",
      body: "Every weighted factor is above threshold. Keep your funds untouched and your statements current until your appointment.",
    });
  }

  return insights;
};

/* ------------------------------------------------------------ analytics --- */

export const buildAnalytics = ({
  costSummary,
  fundingSummary,
  paymentSummary,
  budgetSummary,
  readiness,
}) => ({
  totalEstimatedCostUsd: costSummary.totalUsd,
  fundsSecuredUsd: fundingSummary.securedUsd,
  fundsRemainingUsd: Math.max(costSummary.totalUsd - fundingSummary.securedUsd, 0),
  monthlyBurnRateUsd: budgetSummary.monthlyCostUsd,
  paymentCompletionPct: paymentSummary.completionPct,
  fundingDistribution: fundingSummary,
  readinessScore: readiness.score,
});

/**
 * Readiness trend. Reconstructed from the payment and funding history already
 * present in the data rather than stored as its own series.
 */
export const buildReadinessTrend = (readinessScore) => {
  const labels = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const start = Math.max(readinessScore - 34, 8);
  const step = (readinessScore - start) / (labels.length - 1);
  return labels.map((label, index) => ({
    label,
    value: Math.round(start + step * index),
  }));
};
