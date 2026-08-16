import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  DollarSign,
  FileText,
  Globe,
  Landmark,
  Plus,
  Trash2,
  Upload,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import PageHeader from "../../components/common/PageHeader";
import { SkeletonList } from "../../components/common/Skeleton";
import { useFinance } from "../../context/FinanceContext";
import { useToast } from "../../context/ToastContext";
import { formatMoney } from "../../lib/finance";
import { formatDate, formatDeadline, daysUntil, simulateDelay } from "../../lib/simulate";
import currencyRates from "../../data/currencyRates.json";
import formOptions from "../../data/formOptions.json";
import {
  DetailRow,
  HeaderPill,
  ListRow,
  Meter,
  SeverityPill,
  StatTile,
  StatusPill,
  containerVariants,
  itemVariants,
} from "./components/FinanceUI";

const emptyDraft = { type: "", provider: "", amount: "", status: "Pending", remarks: "" };

// A single, focused view of what this student needs financially for the
// programme they've actually chosen — cost, funding, payments, documents and
// (if they have one) a loan. No cross-country comparisons, no analytics
// dashboards: just what's required and what's still outstanding.
const FinancialPlanning = () => {
  const {
    finance,
    readiness,
    requirement,
    costSummary,
    fundingSources,
    fundingSummary,
    paymentSummary,
    documents,
    documentSummary,
    loan,
    alerts,
    displayCurrency,
    setDisplayCurrency,
    addFundingSource,
    removeFundingSource,
    markPaymentPaid,
    uploadFinancialDocument,
    removeFinancialDocument,
  } = useFinance();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isAddingFund, setIsAddingFund] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState({});
  const [isSavingFund, setIsSavingFund] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
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

  const money = (amount) => formatMoney(amount, displayCurrency);

  const shortfall = Math.max(requirement.totalRequiredUsd - fundingSummary.securedUsd, 0);
  const eligible = shortfall <= 0;
  const coveragePct = Math.min(
    Math.round((fundingSummary.securedUsd / (requirement.totalRequiredUsd || 1)) * 100),
    100
  );

  const validateDraft = () => {
    const next = {};
    if (!draft.type) next.type = "Choose a funding type.";
    if (!draft.provider.trim()) next.provider = "Tell us who is providing the funds.";
    const amount = Number(draft.amount);
    if (!draft.amount) next.amount = "Enter an amount.";
    else if (Number.isNaN(amount) || amount <= 0) next.amount = "Amount must be greater than zero.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAddFund = async (event) => {
    event.preventDefault();
    if (!validateDraft()) return;
    setIsSavingFund(true);
    await addFundingSource(draft);
    setIsSavingFund(false);
    setDraft(emptyDraft);
    setIsAddingFund(false);
    showToast("Funding source added.", "success");
  };

  const handlePay = async (payment) => {
    setPayingId(payment.id);
    const result = await markPaymentPaid(payment.id);
    setPayingId(null);
    showToast(
      result.onTime
        ? `${payment.title} paid — points awarded.`
        : `${payment.title} paid late — points deducted.`,
      result.onTime ? "success" : "info"
    );
  };

  const handleUpload = async (document, file) => {
    if (!file) return;
    setUploadingId(document.id);
    await uploadFinancialDocument(document.id, file);
    setUploadingId(null);
    showToast(`${document.title} uploaded.`, "success");
  };

  const sortedPayments = [...paymentSummary.payments].sort((a, b) => {
    if (a.status === "paid" && b.status !== "paid") return 1;
    if (a.status !== "paid" && b.status === "paid") return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  const hasLoan = loan && loan.approvedAmount > 0;
  const loanDisbursedPct = hasLoan
    ? Math.round((loan.disbursedAmount / loan.approvedAmount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wallet}
        title="Finance"
        description={`${finance.courseName} · ${finance.universityName} · ${finance.destinationCountry} · ${finance.intake}`}
        actions={
          <div className="flex items-center gap-3">
            <select
              value={displayCurrency}
              onChange={(event) => setDisplayCurrency(event.target.value)}
              aria-label="Display currency"
              className="px-3 py-1.5 border rounded-lg text-sm text-gray-700 bg-white"
            >
              {currencyRates.currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code}
                </option>
              ))}
            </select>
         className="space-y-3"   <HeaderPill tone={readiness.tone}>
              {readiness.score}% ready
            </HeaderPill>
          </div>
        }
      />

      {/* Headline numbers, always visible */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total required", value: money(requirement.totalRequiredUsd) },
          { label: "Funds secured", value: money(fundingSummary.securedUsd), tone: "text-green-600" },
          {
            label: "Still needed",
            value: money(shortfall),
            tone: shortfall > 0 ? "text-red-600" : "text-green-600",
          },
          { label: "Readiness", value: `${readiness.score}%` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-xl font-bold mt-1 ${stat.tone ?? "text-gray-800"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} >
          {/* Needs attention */}
          {alerts.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Needs Attention
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm text-gray-800 font-medium">{alert.title}</p>
                        <SeverityPill severity={alert.severity} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost breakdown */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>What This Costs</span>
                    <HeaderPill>{money(costSummary.totalUsd)}/year</HeaderPill>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {costSummary.categories.map((item) => (
                    <div key={item.id} className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="text-gray-800 font-medium text-sm">{item.category}</span>
                          {!item.essential && (
                            <span className="text-xs text-gray-400">optional</span>
                          )}
                        </div>
                        <span className="text-gray-700 font-semibold text-sm">
                          {money(item.amount)}
                        </span>
                      </div>
                      <Meter value={item.percentage} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Requirement + eligibility */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-green-500" />
                      {finance.destinationCountry} Requirement
                    </span>
                    <span className="text-lg">{requirement.profile.flag}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DetailRow label="Tuition" value={money(requirement.tuitionUsd)} />
                  <DetailRow label="Living cost" value={money(requirement.livingCostUsd)} />
                  <DetailRow label="Insurance" value={money(requirement.insuranceUsd)} />
                  <DetailRow label="Visa fee" value={money(requirement.visaFeeUsd)} />
                  <DetailRow label="Biometrics" value={money(requirement.biometricsUsd)} />
                  <DetailRow
                    label="Total required"
                    value={money(requirement.totalRequiredUsd)}
                    strong
                  />
                  <Meter
                    value={coveragePct}
                    tone={eligible ? "green" : coveragePct > 60 ? "yellow" : "red"}
                    className="mt-4"
                  />
                  <div className={`flex items-start gap-2 mt-3 p-3 rounded-lg ${eligible ? "bg-green-50" : "bg-red-50"}`}>
                    {eligible ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <p className={`text-sm ${eligible ? "text-green-700" : "text-red-700"}`}>
                      {eligible
                        ? `Requirement met — ${coveragePct}% of the ${requirement.profile.code} minimum covered.`
                        : `${money(shortfall)} short of the ${requirement.profile.code} minimum (${coveragePct}% covered).`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funding sources */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Funding Sources</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingFund((current) => !current)}
                      className="flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition"
                    >
                      {isAddingFund ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {isAddingFund ? "Cancel" : "Add source"}
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isAddingFund && (
                    <form onSubmit={handleAddFund} className="p-4 border rounded-lg space-y-3 bg-gray-50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-gray-600" htmlFor="funding-type">
                            Funding type
                          </label>
                          <select
                            id="funding-type"
                            value={draft.type}
                            onChange={(event) => setDraft({ ...draft, type: event.target.value })}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                          >
                            <option value="">Select a type</option>
                            {formOptions.fundingSourceTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          {errors.type && <p className="text-xs text-red-600 mt-1">{errors.type}</p>}
                        </div>
                        <div>
                          <label className="text-sm text-gray-600" htmlFor="funding-provider">
                            Provider
                          </label>
                          <input
                            id="funding-provider"
                            value={draft.provider}
                            onChange={(event) => setDraft({ ...draft, provider: event.target.value })}
                            placeholder="Bank, sponsor or family member"
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                          />
                          {errors.provider && (
                            <p className="text-xs text-red-600 mt-1">{errors.provider}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm text-gray-600" htmlFor="funding-amount">
                            Amount (USD)
                          </label>
                          <input
                            id="funding-amount"
                            type="number"
                            min="0"
                            value={draft.amount}
                            onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                          />
                          {errors.amount && (
                            <p className="text-xs text-red-600 mt-1">{errors.amount}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm text-gray-600" htmlFor="funding-status">
                            Status
                          </label>
                          <select
                            id="funding-status"
                            value={draft.status}
                            onChange={(event) => setDraft({ ...draft, status: event.target.value })}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                          >
                            {formOptions.fundingSourceStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingFund}
                        className="px-4 py-2 rounded-lg text-sm bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-60"
                      >
                        {isSavingFund ? "Saving…" : "Save funding source"}
                      </button>
                    </form>
                  )}

                  {fundingSources.map((fund) => (
                    <ListRow key={fund.id}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <h3 className="text-gray-800 font-semibold text-sm">{fund.type}</h3>
                          <p className="text-xs text-gray-500">Provider: {fund.provider}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-green-600 font-bold text-sm">{money(fund.amount)}</p>
                          <div className="flex items-center gap-2 justify-end mt-1">
                            <StatusPill status={fund.status} />
                            <button
                              type="button"
                              onClick={() => {
                                removeFundingSource(fund.id);
                                showToast(`${fund.type} removed.`, "info");
                              }}
                              className="text-gray-400 hover:text-red-600 transition"
                              aria-label={`Remove ${fund.type}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </ListRow>
                  ))}

                  {fundingSources.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No funding sources recorded yet. Add one to start tracking your readiness.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming payments */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Payments</span>
                    <HeaderPill tone={paymentSummary.overdueCount ? "red" : "green"}>
                      {paymentSummary.completionPct}% complete
                    </HeaderPill>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sortedPayments.map((payment) => (
                    <ListRow key={payment.id}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-gray-800 font-semibold text-sm">{payment.title}</p>
                            <StatusPill status={payment.status} />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {payment.status === "paid"
                              ? `Paid ${formatDate(payment.paidAt)}`
                              : formatDeadline(payment.dueDate)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-green-600 font-bold text-sm">{money(payment.amount)}</p>
                          {payment.status !== "paid" && (
                            <button
                              type="button"
                              onClick={() => handlePay(payment)}
                              disabled={payingId === payment.id}
                              className="flex items-center gap-1 px-2 py-1 mt-1 rounded-lg text-xs bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-60"
                            >
                              <Check className="h-3 w-3" />
                              {payingId === payment.id ? "Recording…" : "Mark as paid"}
                            </button>
                          )}
                        </div>
                      </div>
                    </ListRow>
                  ))}
                  <p className="text-xs text-gray-500">
                    {money(paymentSummary.outstandingUsd)} outstanding
                    {paymentSummary.overdueCount > 0 ? ` · ${paymentSummary.overdueCount} overdue` : ""}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Required documents */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-500" />
                      Required Documents
                    </span>
                    <HeaderPill tone={documentSummary.completionPct === 100 ? "green" : "yellow"}>
                      {documentSummary.verifiedCount}/{documentSummary.total} verified
                    </HeaderPill>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {documents.map((document) => {
                    const expiresIn = daysUntil(document.expiryDate);
                    const expiringSoon = expiresIn !== null && expiresIn >= 0 && expiresIn <= 60;
                    return (
                      <ListRow key={document.id}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-gray-800 font-semibold text-sm">{document.title}</p>
                              <StatusPill
                                status={
                                  document.uploadStatus === "missing"
                                    ? "missing"
                                    : document.verificationStatus
                                }
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{document.category}</p>
                            {document.expiryDate && (
                              <p className={`text-xs mt-1 ${expiringSoon ? "text-yellow-600" : "text-gray-500"}`}>
                                Expires {formatDate(document.expiryDate)}
                                {expiringSoon ? ` · ${expiresIn} day(s) left` : ""}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => fileInputs.current[document.id]?.click()}
                              disabled={uploadingId === document.id}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-60"
                            >
                              <Upload className="h-3 w-3" />
                              {uploadingId === document.id
                                ? "Uploading…"
                                : document.file
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
                            {document.file && (
                              <button
                                type="button"
                                onClick={() => {
                                  removeFinancialDocument(document.id);
                                  showToast(`${document.title} removed.`, "info");
                                }}
                                className="text-gray-400 hover:text-red-600 transition"
                                aria-label={`Remove ${document.title}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </ListRow>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>

            {/* Loan, only if the student has one */}
            {hasLoan && (
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-green-500" />
                        {loan.provider}
                      </span>
                      <HeaderPill tone={loanDisbursedPct === 100 ? "green" : "yellow"}>
                        {loan.processingStatus}
                      </HeaderPill>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Meter value={loanDisbursedPct} tone={loanDisbursedPct === 100 ? "green" : "yellow"} />
                    <p className="text-sm text-gray-500 mt-2">
                      {money(loan.disbursedAmount)} of {money(loan.approvedAmount)} disbursed ({loanDisbursedPct}%)
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <StatTile label="Approved" value={money(loan.approvedAmount)} />
                      <StatTile label="Remaining" value={money(loan.approvedAmount - loan.disbursedAmount)} />
                    </div>
                    <div className="mt-2">
                      <DetailRow label="Interest rate" value={`${loan.interestRate}%`} />
                      <DetailRow label="Monthly repayment" value={money(loan.monthlyRepayment)} strong />
                      <DetailRow label="Repayment starts" value={formatDate(loan.repaymentStartsAt)} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FinancialPlanning;
