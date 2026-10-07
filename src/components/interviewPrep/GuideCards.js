import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Clock } from "lucide-react";

import { interviewGuides } from "../../data/interviewGuides";
import { useGuidesRead } from "./guideProgress";

/** The four guides, each opening its full read at `/interviews/guides/<slug>`. */
const GuideCards = () => {
  const { read } = useGuidesRead();
  const readCount = interviewGuides.filter((g) => read.includes(g.slug)).length;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-navy-900">1. Read the guides</h2>
        <span className="text-sm text-ink-muted">
          {readCount} of {interviewGuides.length} read
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {interviewGuides.map((guide) => {
          const isRead = read.includes(guide.slug);
          return (
            <Link
              key={guide.slug}
              to={`/interviews/guides/${guide.slug}`}
              className="group flex items-start gap-4 rounded-2xl border border-hairline bg-white p-5 shadow-card transition-colors hover:border-navy-200"
            >
              <span
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                  isRead ? "bg-emerald-50 text-emerald-600" : "bg-navy-50 text-navy-900"
                }`}
              >
                {isRead ? <CheckCircle2 className="h-5 w-5" aria-hidden /> : <BookOpen className="h-5 w-5" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-navy-900 group-hover:underline">{guide.title}</span>
                <span className="mt-0.5 block text-sm text-ink-muted">{guide.description}</span>
                <span className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden /> {guide.readMinutes} min read
                  </span>
                  {isRead && <span className="font-semibold text-emerald-700">Read</span>}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default GuideCards;
