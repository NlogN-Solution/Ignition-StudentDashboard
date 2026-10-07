import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, Clock, Lightbulb, Search, X } from "lucide-react";

import { interviewGuide, interviewGuides } from "../../data/interviewGuides";
import { buttonClass } from "../dashboard/ui";
import { useGuidesRead } from "./guideProgress";

/**
 * One guide, read in full. Rendered from the section shapes documented in
 * `data/interviewGuides.js`; a section draws whichever of them it carries.
 */

const List = ({ items, icon: Icon, tone }) => (
  <ul className="space-y-2">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
        <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${tone}`} aria-hidden />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const Section = ({ section, index }) => (
  <section className="border-t border-hairline pt-6" id={`section-${index}`}>
    <h2 className="text-lg font-semibold text-navy-900">{section.heading}</h2>

    {section.body?.map((paragraph) => (
      <p key={paragraph} className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        {paragraph}
      </p>
    ))}

    {section.tips && (
      <div className="mt-4">
        <List items={section.tips} icon={Check} tone="text-navy-900" />
      </div>
    )}

    {section.questions && (
      <ol className="mt-4 space-y-3">
        {section.questions.map((item) => (
          <li key={item.q} className="rounded-xl border border-hairline bg-white p-4">
            <p className="font-semibold text-navy-900">“{item.q}”</p>
            <p className="mt-2 flex items-start gap-2 text-sm text-ink-muted">
              <Search className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
              <span>
                <span className="font-semibold text-ink-soft">What they're checking: </span>
                {item.checking}
              </span>
            </p>
            <p className="mt-1.5 flex items-start gap-2 text-sm text-ink-soft">
              <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" aria-hidden />
              <span>{item.tip}</span>
            </p>
          </li>
        ))}
      </ol>
    )}

    {section.template && (
      <div className="mt-4 overflow-hidden rounded-xl border border-navy-100">
        {section.template.map((row, i) => (
          <div key={row.label} className={`grid gap-1 px-4 py-3 sm:grid-cols-[200px_1fr] sm:gap-4 ${i ? "border-t border-navy-100" : ""}`}>
            <span className="text-xs font-bold uppercase tracking-wide text-navy-900">{row.label}</span>
            <span className="text-sm italic text-ink-soft">{row.prompt}</span>
          </div>
        ))}
      </div>
    )}

    {section.examples?.map((example) => (
      <div key={example.label} className="mt-4">
        <p className="text-sm font-semibold text-navy-900">“{example.label}”</p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-red-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-red-700">Weak</p>
            <p className="mt-1 text-sm text-red-950">{example.weak}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Strong</p>
            <p className="mt-1 text-sm text-emerald-950">{example.strong}</p>
          </div>
        </div>
      </div>
    ))}

    {(section.dos || section.donts) && (
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {section.dos && (
          <div className="rounded-xl border border-emerald-100 p-4">
            <p className="mb-3 text-sm font-semibold text-emerald-700">Do</p>
            <List items={section.dos} icon={Check} tone="text-emerald-600" />
          </div>
        )}
        {section.donts && (
          <div className="rounded-xl border border-red-100 p-4">
            <p className="mb-3 text-sm font-semibold text-red-700">Don't</p>
            <List items={section.donts} icon={X} tone="text-red-600" />
          </div>
        )}
      </div>
    )}
  </section>
);

const GuideView = () => {
  const { slug } = useParams();
  const guide = interviewGuide(slug);
  const { read, setGuideRead } = useGuidesRead();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!guide) {
    return (
      <div className="mx-auto mt-12 max-w-3xl px-4 text-center">
        <p className="text-lg font-semibold text-navy-900">That guide isn't here.</p>
        <Link to="/interviews" className="mt-3 inline-block text-sm font-semibold text-navy-900 underline">
          Back to Interview Preparation
        </Link>
      </div>
    );
  }

  const isRead = read.includes(guide.slug);
  const position = interviewGuides.indexOf(guide);
  const next = interviewGuides[position + 1];

  return (
    <div className="mx-auto mt-9 max-w-3xl px-4 pb-16">
      <Link to="/interviews" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Interview Preparation
      </Link>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-navy-900">
        Guide {position + 1} of {interviewGuides.length}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-navy-900 sm:text-3xl">{guide.title}</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
        <Clock className="h-4 w-4" aria-hidden /> {guide.readMinutes} min read
      </p>
      <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">{guide.intro}</p>

      {guide.sections.length > 3 && (
        <nav aria-label="In this guide" className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">In this guide</p>
          <ol className="mt-2 grid gap-1 sm:grid-cols-2">
            {guide.sections.map((section, index) => (
              <li key={section.heading}>
                <a href={`#section-${index}`} className="text-sm text-navy-900 hover:underline">
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="mt-8 space-y-8">
        {guide.sections.map((section, index) => (
          <Section key={section.heading} section={section} index={index} />
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-white p-5 shadow-card">
        {isRead ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-5 w-5" aria-hidden /> Marked as read
            <button type="button" onClick={() => setGuideRead(guide.slug, false)} className="ml-2 text-xs font-medium text-ink-muted underline">
              Undo
            </button>
          </p>
        ) : (
          <button type="button" className={buttonClass()} onClick={() => setGuideRead(guide.slug, true)}>
            <Check className="h-4 w-4" aria-hidden /> I've read this guide
          </button>
        )}
        <Link
          to={next ? `/interviews/guides/${next.slug}` : "/interviews"}
          className="text-sm font-semibold text-navy-900 hover:underline"
        >
          {next ? `Next: ${next.title} →` : "Back to Interview Preparation →"}
        </Link>
      </div>
    </div>
  );
};

export default GuideView;
