import React, { useEffect, useState } from "react";
import { Briefcase, CircleAlert, GraduationCap, MapPin, PenTool, ShieldCheck, User, Users } from "lucide-react";
import { Link } from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";
import {
  DataItem,
  DataList,
  EntryCard,
  NoneYet,
  Panel,
  PanelBody,
  PanelHead,
} from "../../components/ui/kit";
import { useAuth } from "../../context/AuthContext";
import { fetchMyProfile } from "../../api/students";
import { getEducationHistoryApi, getWorkExperienceApi } from "../../api/studentPortal";
import { formatDate } from "../../lib/simulate";

/**
 * The student's profile, read-only.
 *
 * Every field, section and fallback string here is what was here before — this
 * screen was redrawn, not rewritten. What changed is that it now uses the
 * portal's own surface language (`components/ui/kit`) instead of grey cards with
 * blue icons, and that the type is bigger: a profile is a document a student
 * proof-reads before an advisor sends it to a university, and `text-sm` grey on
 * white is not a size anyone proof-reads at. Values are 16.5px navy; the labels
 * above them are the small type, which is the right way round for a record.
 *
 * The head is the one dark element in the portal. It carries the two things a
 * student comes to this screen to check — who this profile says they are, and
 * how much of it is still missing — and it earns the weight by being the only
 * one.
 */

const GENDER_LABELS = { male: "Male", female: "Female", other: "Other" };

const selectedTests = (tests) => Object.entries(tests || {}).filter(([, data]) => data?.selected);

/** The completion meter, drawn on navy rather than on canvas. */
const CompletionMeter = ({ value }) => {
  const safe = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

  return (
    <div className="w-full sm:w-[280px]">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[13px] font-bold uppercase tracking-[0.1em] text-white/60">
          Profile completion
        </span>
        <span className="text-[17px] font-extrabold tabular-nums text-white">{safe}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Profile completion"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/15"
      >
        <div
          className="h-full rounded-full bg-orange transition-[width] duration-700 ease-out"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
};

const EnhancedProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const onboardingEducation = profile?.education;
  const testScores = [
    ...selectedTests(profile?.test_scores?.language),
    ...selectedTests(profile?.test_scores?.other),
  ];

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return undefined;
    Promise.all([
      fetchMyProfile().catch(() => null),
      getEducationHistoryApi(user.id).catch(() => []),
      getWorkExperienceApi(user.id).catch(() => []),
    ]).then(([nextProfile, nextEducation, nextExperience]) => {
      if (cancelled) return;
      setProfile(nextProfile);
      setEducation(nextEducation);
      setExperience(nextExperience);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1120px] px-5 py-8 sm:px-8 sm:py-10">
        {/* ------------------------------------------------------- the head --- */}
        <section
          data-tour="profile-overview"
          className="relative overflow-hidden rounded-2xl bg-navy-900 px-6 py-7 text-white shadow-float sm:px-9 sm:py-9"
        >
          {/* A single warm highlight off the top-right, so the panel has a light
              source rather than being a flat block of navy. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-orange/25 blur-3xl"
          />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-2 ring-white/25">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-9 w-9 text-white/70" aria-hidden />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-[1.12] tracking-[-0.024em]">
                  {user?.fullName || "User"}
                </h1>
                <p className="mt-1.5 truncate text-[15.5px] font-medium text-white/70">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:flex-col lg:items-end">
              <Link
                to="/edit-profile"
                className="inline-flex h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-6 text-[15.5px] font-bold text-navy-900 transition-colors hover:bg-navy-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <PenTool className="h-[17px] w-[17px]" aria-hidden />
                Edit profile
              </Link>
              <CompletionMeter value={profile?.profile_completion ?? 0} />
            </div>
          </div>
        </section>

        {isLoading ? (
          <p className="mt-8 text-[15.5px] font-medium text-ink-faint">Loading…</p>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Only 100% when every field and section is filled — this says
                exactly what is left, so the number is never a mystery. */}
            {profile?.profile_missing?.length > 0 ? (
              <Panel>
                <PanelHead
                  icon={CircleAlert}
                  title="Still to complete"
                  description="Your profile reaches 100% once each of these is filled in."
                />
                <PanelBody>
                  <ul className="flex flex-wrap gap-2">
                    {profile.profile_missing.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-orange/30 bg-orange/[0.07] px-3 py-1 text-[13.5px] font-semibold text-orange"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/edit-profile"
                    className="mt-4 inline-flex text-[14.5px] font-bold text-navy-900 underline underline-offset-2"
                  >
                    Complete your profile
                  </Link>
                </PanelBody>
              </Panel>
            ) : null}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Panel>
                <PanelHead icon={User} title="Personal details" />
                <PanelBody>
                  <DataList>
                    <DataItem label="Nationality" value={profile?.nationality} />
                    <DataItem label="Passport number" value={profile?.passport_number} />
                    <DataItem label="Citizenship number" value={profile?.citizenship_number} />
                    <DataItem
                      label="Date of birth"
                      value={formatDate(user?.basicInfo?.dateOfBirth)}
                    />
                    <DataItem
                      label="Gender"
                      value={GENDER_LABELS[user?.basicInfo?.gender] ?? user?.basicInfo?.gender}
                    />
                    <DataItem label="Birth place" value={profile?.birth_place} />
                  </DataList>
                </PanelBody>
              </Panel>

              <Panel>
                <PanelHead icon={Users} title="Family & emergency contact" />
                <PanelBody>
                  <DataList>
                    <DataItem label="Father's name" value={profile?.father_name} />
                    <DataItem label="Mother's name" value={profile?.mother_name} />
                    <DataItem label="Emergency contact" value={profile?.emergency_contact_name} />
                    <DataItem label="Emergency phone" value={profile?.emergency_contact_phone} />
                  </DataList>
                </PanelBody>
              </Panel>
            </div>

            <Panel>
              <PanelHead icon={MapPin} title="Address" />
              <PanelBody>
                <DataList>
                  <DataItem
                    label="Temporary / current address"
                    value={profile?.current_address}
                  />
                  <DataItem label="Permanent address" value={profile?.permanent_address} />
                </DataList>
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHead icon={GraduationCap} title="Study preferences" />
              <PanelBody data-tour="profile-preferences">
                <DataList columns={3}>
                  <DataItem label="Preferred country" value={profile?.preferred_country} />
                  <DataItem label="Preferred program" value={profile?.preferred_program} />
                  <DataItem label="Preferred intake" value={profile?.preferred_intake} />
                  <DataItem label="Budget (USD)" value={profile?.budget} />
                  <DataItem label="Study mode" value={profile?.preferences?.studyMode} />
                  <DataItem label="Fee structure" value={profile?.preferences?.feeStructure} />
                </DataList>
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHead icon={GraduationCap} title="Academic background" />
              <PanelBody data-tour="profile-academics">
                {education.length > 0 ? (
                  <div className="space-y-3">
                    {education.map((entry) => (
                      <EntryCard key={entry.id}>
                        <p className="text-[16.5px] font-bold tracking-[-0.01em] text-navy-900">
                          {entry.institutionName}
                        </p>
                        <p className="mt-1 text-[15px] font-medium text-ink-soft">
                          {entry.degreeLevel} {entry.fieldOfStudy && `· ${entry.fieldOfStudy}`}
                        </p>
                        <p className="mt-2 text-[13.5px] font-semibold text-ink-faint">
                          {formatDate(entry.startDate)} —{" "}
                          {entry.isCompleted ? formatDate(entry.endDate) : "Present"}
                          {entry.grade && ` · Grade: ${entry.grade}`}
                        </p>
                      </EntryCard>
                    ))}
                  </div>
                ) : onboardingEducation?.highestLevel ? (
                  // No structured education-history entry yet (added separately, from
                  // Edit Profile) — fall back to the onboarding wizard's summary so
                  // this section isn't empty right after registration.
                  <EntryCard>
                    <p className="text-[16.5px] font-bold tracking-[-0.01em] text-navy-900">
                      {onboardingEducation.highestLevel}
                    </p>
                    <p className="mt-1 text-[15px] font-medium text-ink-soft">
                      {onboardingEducation.country && `Studied in ${onboardingEducation.country}`}
                      {onboardingEducation.obtainedMarks &&
                        ` · ${onboardingEducation.obtainedMarks}`}
                    </p>
                    <p className="mt-2 text-[13.5px] font-semibold text-ink-faint">
                      {onboardingEducation.startingYear} — {onboardingEducation.completionYear}
                    </p>
                  </EntryCard>
                ) : (
                  <NoneYet>No academic background added yet.</NoneYet>
                )}
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHead icon={ShieldCheck} title="Test scores" />
              <PanelBody>
                {testScores.length === 0 ? (
                  <NoneYet>No test scores added yet.</NoneYet>
                ) : (
                  <DataList columns={3}>
                    {testScores.map(([name, data]) => (
                      <DataItem
                        key={name}
                        label={name}
                        value={
                          data.score &&
                          `${data.score}${data.date ? ` · ${formatDate(data.date)}` : ""}`
                        }
                      />
                    ))}
                  </DataList>
                )}
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHead icon={Briefcase} title="Work experience" />
              <PanelBody>
                {experience.length === 0 ? (
                  <NoneYet>No work experience added yet.</NoneYet>
                ) : (
                  <div className="space-y-3">
                    {experience.map((entry) => (
                      <EntryCard key={entry.id}>
                        <p className="text-[16.5px] font-bold tracking-[-0.01em] text-navy-900">
                          {entry.jobTitle} · {entry.companyName}
                        </p>
                        <p className="mt-2 text-[13.5px] font-semibold text-ink-faint">
                          {formatDate(entry.startDate)} —{" "}
                          {entry.isCurrent ? "Present" : formatDate(entry.endDate)}
                        </p>
                        {entry.description && (
                          <p className="mt-2.5 text-[15px] font-medium leading-[1.6] text-ink-soft">
                            {entry.description}
                          </p>
                        )}
                      </EntryCard>
                    ))}
                  </div>
                )}
              </PanelBody>
            </Panel>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default EnhancedProfile;
