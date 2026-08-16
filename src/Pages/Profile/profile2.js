import React, { useEffect, useState } from "react";
import { Briefcase, GraduationCap, MapPin, PenTool, User } from "lucide-react";
import { Link } from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";
import ProgressBar from "../../components/ui/ProgressBar";
import { useAuth } from "../../context/AuthContext";
import { fetchMyProfile } from "../../api/students";
import { getEducationHistoryApi, getWorkExperienceApi } from "../../api/studentPortal";
import { formatDate } from "../../lib/simulate";

const SectionCard = ({ title, icon: Icon, children, actions }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
        {Icon && <Icon className="w-5 h-5 text-blue-500" />}
        {title}
      </h3>
      {actions}
    </div>
    {children}
  </div>
);

const InfoField = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-800">{value || "Not provided"}</p>
  </div>
);

const selectedTests = (tests) => Object.entries(tests || {}).filter(([, data]) => data?.selected);

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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <SectionCard title="Profile Overview" icon={User}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{user?.fullName || "User"}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <Link
              to="/edit-profile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all duration-300"
            >
              <PenTool className="w-4 h-4" />
              Edit Profile
            </Link>
          </div>
          <div className="mt-6">
            <ProgressBar value={profile?.profile_completion ?? 0} label="Profile Completion" />
          </div>
        </SectionCard>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard title="Personal Details" icon={User}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField label="Nationality" value={profile?.nationality} />
                  <InfoField label="Passport Number" value={profile?.passport_number} />
                  <InfoField label="Citizenship Number" value={profile?.citizenship_number} />
                  <InfoField label="Date of Birth" value={formatDate(user?.basicInfo?.dateOfBirth)} />
                  <InfoField label="Gender" value={user?.basicInfo?.gender} />
                  <InfoField label="Birth Place" value={profile?.birth_place} />
                </div>
              </SectionCard>

              <SectionCard title="Family & Emergency Contact" icon={User}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField label="Father's Name" value={profile?.father_name} />
                  <InfoField label="Mother's Name" value={profile?.mother_name} />
                  <InfoField label="Emergency Contact" value={profile?.emergency_contact_name} />
                  <InfoField label="Emergency Phone" value={profile?.emergency_contact_phone} />
                </div>
              </SectionCard>
            </div>

            <SectionCard title="Address" icon={MapPin}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField label="Temporary / Current Address" value={profile?.current_address} />
                <InfoField label="Permanent Address" value={profile?.permanent_address} />
              </div>
            </SectionCard>

            <SectionCard title="Study Preferences" icon={GraduationCap}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField label="Preferred Country" value={profile?.preferred_country} />
                <InfoField label="Preferred Program" value={profile?.preferred_program} />
                <InfoField label="Preferred Intake" value={profile?.preferred_intake} />
                <InfoField label="Budget (USD)" value={profile?.budget} />
                <InfoField label="Study Mode" value={profile?.preferences?.studyMode} />
                <InfoField label="Fee Structure" value={profile?.preferences?.feeStructure} />
              </div>
            </SectionCard>

            <SectionCard title="Academic Background" icon={GraduationCap}>
              {education.length > 0 ? (
                <div className="space-y-3">
                  {education.map((entry) => (
                    <div key={entry.id} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{entry.institutionName}</p>
                      <p className="text-sm text-gray-600">
                        {entry.degreeLevel} {entry.fieldOfStudy && `· ${entry.fieldOfStudy}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(entry.startDate)} — {entry.isCompleted ? formatDate(entry.endDate) : "Present"}
                        {entry.grade && ` · Grade: ${entry.grade}`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : onboardingEducation?.highestLevel ? (
                // No structured education-history entry yet (added separately, from
                // Edit Profile) — fall back to the onboarding wizard's summary so
                // this section isn't empty right after registration.
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{onboardingEducation.highestLevel}</p>
                  <p className="text-sm text-gray-600">
                    {onboardingEducation.country && `Studied in ${onboardingEducation.country}`}
                    {onboardingEducation.obtainedMarks && ` · ${onboardingEducation.obtainedMarks}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {onboardingEducation.startingYear} — {onboardingEducation.completionYear}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No academic background added yet.</p>
              )}
            </SectionCard>

            <SectionCard title="Test Scores" icon={GraduationCap}>
              {testScores.length === 0 ? (
                <p className="text-sm text-gray-500">No test scores added yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {testScores.map(([name, data]) => (
                    <InfoField
                      key={name}
                      label={name}
                      value={data.score && `${data.score}${data.date ? ` · ${formatDate(data.date)}` : ""}`}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Work Experience" icon={Briefcase}>
              {experience.length === 0 ? (
                <p className="text-sm text-gray-500">No work experience added yet.</p>
              ) : (
                <div className="space-y-3">
                  {experience.map((entry) => (
                    <div key={entry.id} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">
                        {entry.jobTitle} · {entry.companyName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(entry.startDate)} — {entry.isCurrent ? "Present" : formatDate(entry.endDate)}
                      </p>
                      {entry.description && <p className="text-sm text-gray-600 mt-2">{entry.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default EnhancedProfile;
