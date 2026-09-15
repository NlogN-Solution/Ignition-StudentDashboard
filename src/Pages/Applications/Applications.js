import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Building, Calendar, ChevronRight, Clock, FileCheck, MapPin } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import { SkeletonList } from "../../components/common/Skeleton";
import { useAppData } from "../../context/AppDataContext";
import { STATUS_FILTERS, isKnownFilter } from "../../lib/applicationStatus";

const Applications = () => {
  // The provider's own flag, not a timer. This used to show a skeleton for a
  // fixed 500ms and then render whatever `applications` held — which, while
  // the provider was still fetching, was an empty array. A student who had
  // just opened an application from a course landed here and was told they had
  // none, for as long as the request took.
  const { applications, isLoading } = useAppData();

  // `?status=offer` is how the dashboard's Offers tile gets here — clicking a
  // count and landing on an unfiltered list makes the student hunt for the
  // three rows the number was about.
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("status");
  const [statusFilter, setStatusFilter] = useState(
    isKnownFilter(requested) ? requested : "all"
  );

  useEffect(() => {
    if (isKnownFilter(requested)) {
      setStatusFilter(requested);
    }
  }, [requested]);

  const selectFilter = (value) => {
    setStatusFilter(value);
    // Keep the URL honest, so a reload or a back-button press lands on the same
    // list the student is looking at.
    setSearchParams(value === "all" ? {} : { status: value }, { replace: true });
  };

  const visibleApplications = useMemo(() => {
    const active = STATUS_FILTERS.find((filter) => filter.value === statusFilter);
    const filtered = active ? applications.filter((app) => active.match(app.status)) : applications;
    return [...filtered].sort(
      (a, b) => new Date(b.applicationDate ?? 0) - new Date(a.applicationDate ?? 0)
    );
  }, [applications, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50 mt-9 pb-12">
      <PageHeader
        icon={FileCheck}
        title="My Applications"
        description="Track every application here — start one from a course in Explore, or your counsellor opens it for you."
      />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => selectFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                statusFilter === filter.value
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <SkeletonList count={3} />
        ) : visibleApplications.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title={statusFilter === "all" ? "No applications yet" : "Nothing matches this filter"}
            description={
              statusFilter === "all"
                ? "Start one from a course in Explore, or your counsellor opens it for you — either way it shows up here with its full timeline."
                : "Try a different status filter to see your other applications."
            }
          />
        ) : (
          <div className="space-y-4">
            {visibleApplications.map((application, index) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/applications/${application.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-200 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.universityName}
                        </h3>
                        <StatusBadge status={application.status} />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{application.courseName}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
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

                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600 flex-shrink-0">
                      View details
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Applications;
