import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  ChevronRight,
  Clock,
  Eye,
  FileCheck,
  MapPin,
  MessageSquare,
  Search,
  Send,
  Trophy,
  X,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import UniversityMark from "../../components/common/UniversityMark";
import { Skeleton } from "../../components/common/Skeleton";
import { useAppData } from "../../context/AppDataContext";
import { simulateDelay, formatDateTime } from "../../lib/simulate";
import { PREVIEW_APPLICATIONS } from "../../data/previewApplications";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "in-review", label: "In review" },
  { value: "offer", label: "Offers" },
];

// Quick-glance counters above the list — same "stat card" language as the
// sign-in page's trust panel, tuned to a light surface for the dashboard.
const STAT_CARDS = [
  { key: "all", label: "Total applications", icon: FileCheck, accent: "navy" },
  { key: "submitted", label: "Submitted", icon: Send, accent: "navy" },
  { key: "in-review", label: "In review", icon: Clock, accent: "ignite" },
  { key: "offer", label: "Offers received", icon: Trophy, accent: "emerald" },
];

const ACCENT_STYLES = {
  navy: "bg-navy-50 text-navy-700",
  ignite: "bg-ignite-50 text-ignite-600",
  emerald: "bg-emerald-50 text-emerald-600",
};

// "Date modified" isn't a field the backend sends — it derives from whichever
// stage timestamp on the application is most recent, falling back to the
// date the application was opened.
const lastActivityDate = (application) => {
  const candidates = [
    application.applicationDate,
    application.submittedAt,
    application.offerReceivedDate,
    application.visaAppliedDate,
    application.visaDecisionDate,
    application.enrollmentDate,
  ]
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (candidates.length === 0) return null;
  return new Date(Math.max(...candidates.map((date) => date.getTime())));
};

/** Table-shaped placeholder so the loading state doesn't jump when real rows arrive. */
const TableSkeleton = () => (
  <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full shrink-0" />
          <Skeleton className="h-4 w-24 shrink-0" />
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

const CardSkeleton = () => (
  <div className="md:hidden space-y-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    ))}
  </div>
);

const Applications = () => {
  const navigate = useNavigate();
  const { applications: fetchedApplications } = useAppData();
  const applications = fetchedApplications.length > 0 ? fetchedApplications : PREVIEW_APPLICATIONS;

  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Simulated initial load so the skeleton state is exercised.
  useEffect(() => {
    let cancelled = false;
    simulateDelay(500).then(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const statusCounts = useMemo(() => {
    const counts = { all: applications.length, submitted: 0, "in-review": 0, offer: 0 };
    applications.forEach((app) => {
      if (app.status in counts) counts[app.status] += 1;
    });
    return counts;
  }, [applications]);

  const visibleApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = applications.filter((app) => {
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      const matchesQuery =
        !query ||
        app.universityName?.toLowerCase().includes(query) ||
        app.courseName?.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
    return [...filtered].sort(
      (a, b) => new Date(b.applicationDate ?? 0) - new Date(a.applicationDate ?? 0)
    );
  }, [applications, statusFilter, searchTerm]);

  const hasActiveFilters = statusFilter !== "all" || searchTerm.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50 mt-9 pb-12">
      <PageHeader
        icon={FileCheck}
        title="My Applications"
        description="Applications are opened by your counsellor once you're ready to apply — track their progress here."
      />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Stat strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STAT_CARDS.map(({ key, label, icon: Icon, accent }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`text-left bg-white rounded-xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                statusFilter === key ? "border-navy-300 ring-1 ring-navy-200" : "border-slate-200"
              }`}
            >
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${ACCENT_STYLES[accent]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="mt-3 text-2xl font-bold text-navy-900 leading-none">{statusCounts[key] ?? 0}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
            </button>
          ))}
        </div>

        {/* Toolbar — search + status filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by university or course"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-navy-900 placeholder:text-slate-400 outline-none transition-colors focus:border-ignite-500 focus:ring-4 focus:ring-ignite-500/10"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  statusFilter === filter.value
                    ? "bg-navy-900 text-white shadow-sm shadow-navy-900/20"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-navy-200 hover:text-navy-800"
                }`}
              >
                {filter.label}
                <span
                  className={`text-xs font-semibold px-1.5 rounded-full ${
                    statusFilter === filter.value ? "bg-white/15" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {statusCounts[filter.value] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <>
            <TableSkeleton />
            <CardSkeleton />
          </>
        ) : visibleApplications.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title={hasActiveFilters ? "Nothing matches your search" : "No applications yet"}
            description={
              hasActiveFilters
                ? "Try a different status filter or search term."
                : "Once your counsellor opens an application on your behalf, it will show up here with its full timeline."
            }
            action={
              hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setSearchTerm("");
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-navy-900 hover:bg-navy-800 text-white transition-colors"
                >
                  Clear filters
                </button>
              )
            }
          />
        ) : (
          <>
            {/* Desktop / tablet — dense table, one row per application */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-navy-50/60 text-navy-900">
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">University</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Course</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Date Added</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">
                        Date Modified <span className="text-navy-400">&darr;</span>
                      </th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleApplications.map((application) => (
                      <tr
                        key={application.id}
                        tabIndex={0}
                        onClick={() => navigate(`/applications/${application.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") navigate(`/applications/${application.id}`);
                        }}
                        className="border-t border-slate-100 hover:bg-navy-50/30 focus-visible:bg-navy-50/40 focus-visible:outline-none cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center gap-2.5">
                            <UniversityMark name={application.universityName} size="sm" />
                            <div>
                              <p className="font-medium text-navy-900">{application.universityName}</p>
                              {application.universityCountry && (
                                <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {application.universityCountry}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <p className="text-slate-800">
                            {[application.courseName, application.degreeLevel].filter(Boolean).join(" - ")}
                          </p>
                          {application.intake && (
                            <p className="text-xs text-slate-500 mt-0.5">Intake: {application.intake}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <StatusBadge status={application.status} />
                          {application.counsellorName && (
                            <p className="text-xs text-slate-500 mt-1.5">With {application.counsellorName}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 align-top text-sm text-slate-600 whitespace-nowrap">
                          {application.applicationDate ? formatDateTime(application.applicationDate) : "—"}
                        </td>
                        <td className="px-5 py-4 align-top text-sm text-slate-600 whitespace-nowrap">
                          {(() => {
                            const modified = lastActivityDate(application);
                            return modified ? formatDateTime(modified) : "—";
                          })()}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/applications/${application.id}`}
                              onClick={(event) => event.stopPropagation()}
                              aria-label={`View ${application.universityName} application`}
                              className="p-2 rounded-lg text-navy-600 hover:bg-navy-100 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            {application.counsellorName && (
                              <Link
                                to="/messages"
                                onClick={(event) => event.stopPropagation()}
                                aria-label={`Message ${application.counsellorName}`}
                                className="p-2 rounded-lg text-slate-500 hover:bg-navy-100 hover:text-navy-600 transition-colors"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile — same data as cards, a table doesn't fit this narrow */}
            <div className="md:hidden space-y-4">
              {visibleApplications.map((application, index) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/applications/${application.id}`}
                    className="block bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-navy-200 transition-all duration-300"
                  >
                    <div className="flex flex-col gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <UniversityMark name={application.universityName} size="sm" />
                          <h3 className="text-lg font-semibold text-navy-900">
                            {application.universityName}
                          </h3>
                        </div>
                        <div className="mt-2">
                          <StatusBadge status={application.status} />
                        </div>
                        <p className="text-sm text-slate-600 mt-2">{application.courseName}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                          {application.universityCountry && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {application.universityCountry}
                            </span>
                          )}
                          {application.intake && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Intake: {application.intake}
                            </span>
                          )}
                          {application.applicationDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Opened {application.applicationDate}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-semibold text-ignite-600 flex-shrink-0">
                        View details
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Applications;
