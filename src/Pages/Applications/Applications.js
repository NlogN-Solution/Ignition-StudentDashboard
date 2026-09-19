import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Eye,
  FileCheck2,
  FileCheck,
  MapPin,
  MessageSquare,
  Search,
  Send,
  Trophy,
} from "lucide-react";

import EmptyState from "../../components/common/EmptyState";
import { SkeletonList } from "../../components/common/Skeleton";
import {
  ApplicationStatusPill,
  UniversityMonogram,
  formatStamp,
} from "../../components/applications/ApplicationBits";
import { useAppData } from "../../context/AppDataContext";
import { STATUS_FILTERS, isKnownFilter } from "../../lib/applicationStatus";

/**
 * The four tiles double as filters: clicking "Offers received" is the same as
 * pressing the Offers chip, and the tile for the active filter carries the
 * navy outline — so the number and the list under it are always the same set.
 */
const STAT_TILES = [
  { filter: "all", label: "Total applications", icon: FileCheck, tint: "bg-navy-50 text-navy-800" },
  { filter: "submitted", label: "Submitted", icon: Send, tint: "bg-navy-50 text-navy-800" },
  { filter: "in-review", label: "In review", icon: Clock, tint: "bg-ignite-50 text-ignite-600" },
  { filter: "offer", label: "Offers received", icon: Trophy, tint: "bg-emerald-50 text-emerald-600" },
];

const StatTile = ({ tile, count, active, onSelect }) => {
  const Icon = tile.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex flex-col items-start rounded-2xl border bg-white p-5 text-left transition-all duration-200 hover:shadow-lift ${
        active ? "border-navy-300 ring-1 ring-navy-200" : "border-hairline"
      }`}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tile.tint}`}>
        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
      </span>
      <span className="mt-4 text-[28px] font-bold leading-none text-navy-900">{count}</span>
      <span className="mt-2 text-sm text-ink-muted">{tile.label}</span>
    </button>
  );
};

const Applications = () => {
  // The provider's own flag, not a timer — a list rendered before the fetch
  // lands would tell a student with applications that they have none.
  const { applications, isLoading } = useAppData();
  const navigate = useNavigate();

  // `?status=offer` is how the dashboard's Offers tile gets here.
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("status");
  const [statusFilter, setStatusFilter] = useState(isKnownFilter(requested) ? requested : "all");
  const [query, setQuery] = useState("");
  // Newest change first by default — the row that moved is the one the
  // student came to look at.
  const [sortDescending, setSortDescending] = useState(true);

  useEffect(() => {
    if (isKnownFilter(requested)) setStatusFilter(requested);
  }, [requested]);

  const selectFilter = (value) => {
    setStatusFilter(value);
    setSearchParams(value === "all" ? {} : { status: value }, { replace: true });
  };

  const counts = useMemo(
    () =>
      Object.fromEntries(
        STATUS_FILTERS.map((filter) => [
          filter.value,
          applications.filter((app) => filter.match(app.status)).length,
        ])
      ),
    [applications]
  );

  // Visa & enrolment only earns a chip once something is in it; the four the
  // page is built around are always there.
  const chips = STATUS_FILTERS.filter((filter) => filter.value !== "visa" || counts.visa > 0);

  const visibleApplications = useMemo(() => {
    const active = STATUS_FILTERS.find((filter) => filter.value === statusFilter);
    const needle = query.trim().toLowerCase();
    const filtered = applications.filter(
      (app) =>
        (!active || active.match(app.status)) &&
        (!needle ||
          app.universityName.toLowerCase().includes(needle) ||
          app.courseName.toLowerCase().includes(needle))
    );
    const stamp = (app) => new Date(app.updatedAt ?? app.createdAt ?? app.applicationDate ?? 0).getTime();
    return [...filtered].sort((a, b) => (sortDescending ? stamp(b) - stamp(a) : stamp(a) - stamp(b)));
  }, [applications, statusFilter, query, sortDescending]);

  const SortIcon = sortDescending ? ArrowDown : ArrowUp;

  return (
    <div className="min-h-screen bg-canvas pb-16">
      {/* Header band */}
      <div className="relative overflow-hidden border-b border-hairline bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-ignite-50/80 via-ignite-50/20 to-transparent"
        />
        <div className="relative mx-auto flex max-w-7xl items-center gap-5 px-4 py-7 sm:px-8">
          <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-navy-900 shadow-lift">
            <FileCheck2 className="h-8 w-8 text-ignite-500" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-navy-900 sm:text-[36px]">My Applications</h1>
            <p className="mt-1.5 text-[15px] text-ink-soft">
              Applications are opened by your counsellor once you're ready to apply — track their progress here.
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-7 px-4 pt-8 sm:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STAT_TILES.map((tile) => (
            <StatTile
              key={tile.filter}
              tile={tile}
              count={counts[tile.filter] ?? 0}
              active={statusFilter === tile.filter}
              onSelect={() => selectFilter(tile.filter)}
            />
          ))}
        </div>

        {/* Search + chips */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block w-full lg:max-w-md">
            <span className="sr-only">Search applications</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by university or course"
              className="h-12 w-full rounded-xl border border-hairline bg-white pl-11 pr-4 text-[15px] text-ink placeholder:text-ink-faint focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-100"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {chips.map((filter) => {
              const active = statusFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => selectFilter(filter.value)}
                  aria-pressed={active}
                  className={`flex h-11 items-center gap-2 rounded-full border px-4 text-[15px] font-medium transition-colors ${
                    active
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-hairline bg-white text-ink-soft hover:border-navy-200"
                  }`}
                >
                  {filter.label}
                  <span
                    className={`min-w-[20px] rounded-full px-1.5 text-center text-xs font-semibold leading-5 ${
                      active ? "bg-white/20 text-white" : "bg-navy-50 text-ink-muted"
                    }`}
                  >
                    {counts[filter.value] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <SkeletonList count={3} />
        ) : visibleApplications.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title={applications.length === 0 ? "No applications yet" : "Nothing matches"}
            description={
              applications.length === 0
                ? "Start one from a course in Explore, or your counsellor opens it for you — either way it shows up here with its full timeline."
                : "Try a different status filter or search term."
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-hairline bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead>
                  <tr className="bg-[#F3F5FD] text-[13px] font-semibold uppercase tracking-wide text-navy-900">
                    <th className="px-6 py-4 font-semibold">University</th>
                    <th className="px-4 py-4 font-semibold">Course</th>
                    <th className="px-4 py-4 font-semibold">Status</th>
                    <th className="px-4 py-4 font-semibold">Date added</th>
                    <th className="px-4 py-4 font-semibold">
                      <button
                        type="button"
                        onClick={() => setSortDescending((current) => !current)}
                        className="inline-flex items-center gap-1 uppercase tracking-wide"
                        aria-label={`Sort by date modified, ${sortDescending ? "newest" : "oldest"} first`}
                      >
                        Date modified
                        <SortIcon className="h-3.5 w-3.5 text-navy-500" aria-hidden />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {visibleApplications.map((application) => (
                    <tr
                      key={application.id}
                      onClick={() => navigate(`/applications/${application.id}`)}
                      className="cursor-pointer align-top transition-colors hover:bg-navy-50/40"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <UniversityMonogram
                            name={application.universityName}
                            monogram={application.universityMonogram}
                            logoUrl={application.universityLogoUrl}
                          />
                          <div className="min-w-0">
                            <p className="text-[17px] font-medium leading-snug text-navy-900">
                              {application.universityName}
                            </p>
                            {application.universityCountry && (
                              <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-muted">
                                <MapPin className="h-3.5 w-3.5" aria-hidden />
                                {application.universityCountry}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <p className="text-[17px] leading-snug text-navy-900">{application.courseName}</p>
                        {application.intake && (
                          <p className="mt-0.5 text-sm text-ink-muted">Intake: {application.intake}</p>
                        )}
                      </td>
                      <td className="px-4 py-5">
                        <ApplicationStatusPill status={application.status} />
                        <p className="mt-1.5 text-sm text-ink-muted">
                          {application.counsellorName ? `With ${application.counsellorName}` : "Awaiting an advisor"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-5 text-[15px] text-ink-soft">
                        {formatStamp(application.createdAt ?? application.applicationDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-5 text-[15px] text-ink-soft">
                        {formatStamp(application.updatedAt ?? application.createdAt)}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/applications/${application.id}`}
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`View ${application.universityName} application`}
                            className="rounded-lg p-1.5 text-navy-800 transition-colors hover:bg-navy-50"
                          >
                            <Eye className="h-5 w-5" aria-hidden />
                          </Link>
                          <Link
                            to="/messages"
                            onClick={(event) => event.stopPropagation()}
                            aria-label="Message your counsellor"
                            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-navy-50 hover:text-navy-800"
                          >
                            <MessageSquare className="h-5 w-5" aria-hidden />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Applications;
