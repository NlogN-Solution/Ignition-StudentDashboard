import React from "react";
import { Building2, CalendarDays, GraduationCap, MapPin } from "lucide-react";

/**
 * "You're applying for X" — the sentence that makes the whole intent feature
 * visible.
 *
 * One component, rendered on the registration screen, the login screen and the
 * first step of onboarding, so the student sees the *same* card before they
 * have an account and after. Two formatters would eventually disagree about
 * the intake or the qualification, and a student noticing that the course
 * changed shape between two screens has every reason to distrust both.
 *
 * `tone="auth"` is the version that sits on the dark auth panel; `tone="panel"`
 * is the one inside the app's white surfaces. Same content, different ground.
 */

const DEGREE_LABELS = {
  certificate: "Certificate",
  diploma: "Diploma",
  advanced_diploma: "Advanced Diploma",
  bachelor: "Bachelor's",
  postgraduate_diploma: "Postgraduate Diploma",
  master: "Master's",
  doctorate: "Doctorate",
};

const TONES = {
  auth: {
    shell: "border-white/15 bg-white/10 backdrop-blur-sm",
    eyebrow: "text-white/70",
    title: "text-white",
    meta: "text-white/75",
    icon: "text-white/55",
  },
  panel: {
    shell: "border-hairline bg-navy-50/60",
    eyebrow: "text-ink-faint",
    title: "text-navy-900",
    meta: "text-ink-muted",
    icon: "text-ink-faint",
  },
};

const MetaLine = ({ icon: Icon, children, tone }) =>
  children ? (
    <span className={`inline-flex items-center gap-1.5 ${tone.meta}`}>
      <Icon className={`h-3.5 w-3.5 shrink-0 ${tone.icon}`} aria-hidden />
      {children}
    </span>
  ) : null;

const SelectedCourseCard = ({ course, tone = "panel", eyebrow = "You're applying for" }) => {
  if (!course) return null;
  const styles = TONES[tone] ?? TONES.panel;
  const level = DEGREE_LABELS[course.degree_level] ?? course.degree_level;

  return (
    <div className={`rounded-xl border p-4 ${styles.shell}`}>
      <p className={`text-[12px] font-bold uppercase tracking-[0.08em] ${styles.eyebrow}`}>{eyebrow}</p>
      <p className={`mt-1.5 text-[16.5px] font-bold leading-[1.3] tracking-[-0.01em] ${styles.title}`}>
        {course.course_name}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] font-medium">
        <MetaLine icon={Building2} tone={styles}>
          {course.university_name}
        </MetaLine>
        <MetaLine icon={MapPin} tone={styles}>
          {course.university_city}
        </MetaLine>
        <MetaLine icon={GraduationCap} tone={styles}>
          {level}
        </MetaLine>
        <MetaLine icon={CalendarDays} tone={styles}>
          {course.intake_label}
        </MetaLine>
      </div>
    </div>
  );
};

export default SelectedCourseCard;
