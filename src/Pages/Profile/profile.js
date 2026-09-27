import React, { useEffect, useState } from "react";
import { Briefcase, Camera, FileBadge, GraduationCap, MapPin, Plus, Trash2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";
import {
  EntryCard,
  Field as KitField,
  FieldGrid,
  FormError,
  GhostButton,
  NoneYet,
  Panel,
  PanelBody,
  PanelHead,
  PrimaryButton,
  SelectInput,
  TextArea,
  TextInput,
} from "../../components/ui/kit";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { fetchMyProfile, updateMyProfile } from "../../api/students";
import { updateMyAccount, uploadMyAvatar } from "../../api/auth";
import { parseApiErrorDetail } from "../../lib/apiErrors";
import formOptions from "../../data/formOptions.json";
import {
  seedTestsFrom,
  TestCard,
  testScoresError,
  withSectionChange,
} from "../../components/tests/testScores";
import {
  addEducationHistoryApi,
  addWorkExperienceApi,
  deleteEducationHistoryApi,
  deleteWorkExperienceApi,
  getEducationHistoryApi,
  getWorkExperienceApi,
} from "../../api/studentPortal";

/**
 * Edit Profile, in the portal's own surface language.
 *
 * Redrawn, not rewritten: every field, option list, endpoint and save path here
 * is unchanged. What went is the local `cardClass`/`labelClass`/`inputClass`
 * trio — three strings that described a grey-and-blue form nothing else in the
 * portal looked like, and that had drifted from the equivalent strings in the
 * onboarding wizard and the auth screens. All three now come from
 * `components/ui/kit`, which is also what the wizard uses, so the form a
 * student fills in on day one and the form they come back to in March are the
 * same form.
 *
 * Every control also gained the `id`/`htmlFor` pair it never had. The old
 * `Field` rendered a bare `<label>` beside an input with no `id`, so clicking a
 * label did nothing and a screen reader met about thirty unnamed text boxes.
 */

const EDUCATION_LEVELS = ["bachelor", "diploma", "10+2", "masters", "phd", "other"];
// The backend's `Gender` enum values, labelled.
const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];
const DEGREE_LEVELS = [
  "certificate",
  "diploma",
  "advanced_diploma",
  "bachelor",
  "postgraduate_diploma",
  "master",
  "doctorate",
];

/**
 * A text field bound to a `name`, which is how every caller here addresses it.
 * The `id` is the name — these forms have one control per field, so the two are
 * the same identifier and keeping them in step by hand would only invite them
 * to drift.
 */
const Field = ({ label, name, id = name, value, onChange, type = "text", hint, className }) => (
  <KitField id={id} label={label} hint={hint} className={className}>
    <TextInput type={type} name={name} value={value ?? ""} onChange={onChange} />
  </KitField>
);

const emptyEducationDraft = {
  institutionName: "",
  degreeLevel: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
  grade: "",
  isCompleted: true,
};

const emptyExperienceDraft = {
  companyName: "",
  jobTitle: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  description: "",
};

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState(null);
  const [profileImage, setProfileImage] = useState(user?.profileImage ?? null);
  // The chosen file, uploaded on Save. The preview above used to be the only
  // thing that happened: the photo never left the browser.
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [languageTests, setLanguageTests] = useState(() => seedTestsFrom(formOptions.languageTests, null));
  const [otherTests, setOtherTests] = useState(() => seedTestsFrom(formOptions.otherTests, null));

  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [educationDraft, setEducationDraft] = useState(emptyEducationDraft);
  const [experienceDraft, setExperienceDraft] = useState(emptyExperienceDraft);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return undefined;
    Promise.all([
      fetchMyProfile().catch(() => null),
      getEducationHistoryApi(user.id).catch(() => []),
      getWorkExperienceApi(user.id).catch(() => []),
    ]).then(([profile, nextEducation, nextExperience]) => {
      if (cancelled) return;
      setFormData({
        fullName: user?.fullName ?? "",
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        date_of_birth: user?.basicInfo?.dateOfBirth ?? "",
        gender: user?.basicInfo?.gender ?? "",
        nationality: profile?.nationality ?? "",
        passport_number: profile?.passport_number ?? "",
        citizenship_number: profile?.citizenship_number ?? "",
        current_address: profile?.current_address ?? "",
        permanent_address: profile?.permanent_address ?? "",
        father_name: profile?.father_name ?? "",
        mother_name: profile?.mother_name ?? "",
        birth_place: profile?.birth_place ?? "",
        emergency_contact_name: profile?.emergency_contact_name ?? "",
        emergency_contact_phone: profile?.emergency_contact_phone ?? "",
        education_level: profile?.education_level ?? "bachelor",
        university_name: profile?.university_name ?? "",
        institution_name: profile?.institution_name ?? "",
        graduation_year: profile?.graduation_year ?? "",
        gpa: profile?.gpa ?? "",
        preferred_country: profile?.preferred_country ?? "",
        preferred_program: profile?.preferred_program ?? "",
        preferred_intake: profile?.preferred_intake ?? "",
        budget: profile?.budget ?? "",
        notes: profile?.notes ?? "",
      });
      setLanguageTests(seedTestsFrom(formOptions.languageTests, profile?.test_scores?.language));
      setOtherTests(seedTestsFrom(formOptions.otherTests, profile?.test_scores?.other));
      setEducation(nextEducation);
      setExperience(nextExperience);
    });
    return () => {
      cancelled = true;
    };
    // Loaded once per visit. Re-running when the signed-in user changes would
    // overwrite what the student is typing with what was last saved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const testSetter = (type) => (type === "language" ? setLanguageTests : setOtherTests);
  const handleTestToggle = (type, test) =>
    testSetter(type)((prev) => ({ ...prev, [test]: { ...prev[test], selected: !prev[test].selected } }));
  const handleTestInput = (type, test, value, field) =>
    testSetter(type)((prev) => ({
      ...prev,
      [test]: { ...prev[test], [field]: value, ...(field === "score" ? { scoreEdited: true } : {}) },
    }));
  const handleTestSection = (type, test, sectionKey, value) =>
    testSetter(type)((prev) => ({ ...prev, [test]: withSectionChange(prev[test], test, sectionKey, value) }));

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setProfileImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const [firstName, ...rest] = formData.fullName.trim().split(/\s+/).filter(Boolean);
    if (!firstName || rest.length === 0) {
      setFormError("Enter your first and last name, as they appear on your passport.");
      return;
    }
    if (formData.date_of_birth && formData.date_of_birth > new Date().toISOString().slice(0, 10)) {
      setFormError("Your date of birth can't be in the future.");
      return;
    }
    const testsError = testScoresError(languageTests, otherTests);
    if (testsError) {
      setFormError(testsError);
      return;
    }

    setIsSaving(true);
    try {
      await updateMyAccount({
        first_name: firstName,
        last_name: rest.join(" "),
        phone: formData.phone.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
      });
      if (avatarFile) await uploadMyAvatar(avatarFile);
      await updateMyProfile({
        nationality: formData.nationality || null,
        passport_number: formData.passport_number || null,
        citizenship_number: formData.citizenship_number || null,
        current_address: formData.current_address || null,
        permanent_address: formData.permanent_address || null,
        father_name: formData.father_name || null,
        mother_name: formData.mother_name || null,
        birth_place: formData.birth_place || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        education_level: formData.education_level || null,
        university_name: formData.university_name || null,
        institution_name: formData.institution_name || null,
        graduation_year: formData.graduation_year ? Number(formData.graduation_year) : null,
        gpa: formData.gpa ? Number(formData.gpa) : null,
        preferred_country: formData.preferred_country || null,
        preferred_program: formData.preferred_program || null,
        preferred_intake: formData.preferred_intake || null,
        budget: formData.budget ? Number(formData.budget) : null,
        notes: formData.notes || null,
        test_scores: { language: languageTests, other: otherTests },
      });
      // Every other screen reads the signed-in user, which was loaded at
      // sign-in; without this the apply flow would still show the old values.
      await refreshUser().catch(() => null);
      showToast("Profile updated successfully.");
      navigate("/profile");
    } catch (error) {
      const { fields, message } = parseApiErrorDetail(error?.data?.detail);
      const detail = message || Object.values(fields ?? {})[0];
      setFormError(detail ? `Couldn't save your profile: ${detail}` : "Couldn't save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEducation = async (event) => {
    event.preventDefault();
    if (!educationDraft.institutionName.trim()) return;
    const entry = await addEducationHistoryApi(user.id, educationDraft);
    setEducation((current) => [...current, entry]);
    setEducationDraft(emptyEducationDraft);
    setIsAddingEducation(false);
  };

  const handleDeleteEducation = async (entryId) => {
    await deleteEducationHistoryApi(user.id, entryId);
    setEducation((current) => current.filter((entry) => entry.id !== entryId));
  };

  const handleAddExperience = async (event) => {
    event.preventDefault();
    if (!experienceDraft.companyName.trim() || !experienceDraft.jobTitle.trim()) return;
    const entry = await addWorkExperienceApi(user.id, experienceDraft);
    setExperience((current) => [...current, entry]);
    setExperienceDraft(emptyExperienceDraft);
    setIsAddingExperience(false);
  };

  const handleDeleteExperience = async (entryId) => {
    await deleteWorkExperienceApi(user.id, entryId);
    setExperience((current) => current.filter((entry) => entry.id !== entryId));
  };

  if (!formData) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-[1120px] px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-[15.5px] font-medium text-ink-faint">Loading…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1120px] px-5 py-8 sm:px-8 sm:py-10">
        <header>
          <p className="text-[12.5px] font-bold uppercase tracking-[0.16em] text-navy-900">
            Your profile
          </p>
          <h1 className="mt-2 text-[clamp(1.8rem,3vw,2.4rem)] font-extrabold leading-[1.1] tracking-[-0.025em] text-navy-900">
            Edit profile
          </h1>
          <p className="mt-3 max-w-[62ch] text-[16.5px] font-medium leading-[1.6] text-ink-muted">
            This is the record every application reuses. Your advisor sees exactly
            what is here, so anything you correct now is corrected everywhere.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Panel>
            <PanelHead icon={User} title="Profile overview" />
            <PanelBody className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-50 ring-2 ring-hairline">
                  {profileImage ? (
                    <img src={profileImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-ink-faint" aria-hidden />
                  )}
                </div>
                {/* The label IS the control — a file input styled to look like a
                    button cannot be clicked through, so the button has to be the
                    label. `focus-within` gives it the ring the input's own focus
                    would otherwise draw off-screen. */}
                <label
                  htmlFor="profileImage"
                  className="inline-flex h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-ring-idle bg-white px-5 text-[14.5px] font-semibold text-ink-soft transition-colors hover:border-nav/40 hover:text-navy-900 focus-within:ring-4 focus-within:ring-navy-900/15"
                >
                  <Camera className="h-[17px] w-[17px]" aria-hidden />
                  Change photo
                  <input
                    type="file"
                    id="profileImage"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>

              <FieldGrid className="lg:grid-cols-3">
                <Field label="Full name" name="fullName" value={formData.fullName} onChange={handleChange} />
                <KitField id="email" label="Email" hint="Ask your counsellor to change your email address.">
                  <TextInput type="email" name="email" value={formData.email} readOnly disabled />
                </KitField>
                <Field label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                <Field
                  label="Date of birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                />
                <KitField id="gender" label="Gender">
                  <SelectInput
                    name="gender"
                    placeholder="Not specified"
                    options={GENDERS}
                    value={formData.gender}
                    onChange={handleChange}
                  />
                </KitField>
              </FieldGrid>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead icon={User} title="Personal & family details" />
            <PanelBody>
              <FieldGrid className="lg:grid-cols-3">
                <Field label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
                <Field
                  label="Passport number"
                  name="passport_number"
                  value={formData.passport_number}
                  onChange={handleChange}
                />
                <Field
                  label="Citizenship number"
                  name="citizenship_number"
                  value={formData.citizenship_number}
                  onChange={handleChange}
                />
                <Field label="Birth place" name="birth_place" value={formData.birth_place} onChange={handleChange} />
                <Field label="Father's name" name="father_name" value={formData.father_name} onChange={handleChange} />
                <Field label="Mother's name" name="mother_name" value={formData.mother_name} onChange={handleChange} />
                <Field
                  label="Emergency contact name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                />
                <Field
                  label="Emergency contact phone"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                />
              </FieldGrid>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead icon={MapPin} title="Address" />
            <PanelBody>
              <FieldGrid>
                <KitField id="current_address" label="Temporary / current address">
                  <TextArea
                    name="current_address"
                    value={formData.current_address}
                    onChange={handleChange}
                    rows={3}
                  />
                </KitField>
                <KitField id="permanent_address" label="Permanent address">
                  <TextArea
                    name="permanent_address"
                    value={formData.permanent_address}
                    onChange={handleChange}
                    rows={3}
                  />
                </KitField>
              </FieldGrid>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead icon={GraduationCap} title="Current education & preferences" />
            <PanelBody>
              <FieldGrid className="lg:grid-cols-3">
                <KitField id="education_level" label="Highest education level">
                  <SelectInput
                    name="education_level"
                    value={formData.education_level}
                    onChange={handleChange}
                    options={EDUCATION_LEVELS}
                  />
                </KitField>
                <Field
                  label="University name"
                  name="university_name"
                  value={formData.university_name}
                  onChange={handleChange}
                />
                <Field
                  label="Institution name"
                  name="institution_name"
                  value={formData.institution_name}
                  onChange={handleChange}
                />
                <Field
                  label="Graduation year"
                  name="graduation_year"
                  type="number"
                  value={formData.graduation_year}
                  onChange={handleChange}
                />
                <Field label="GPA" name="gpa" type="number" value={formData.gpa} onChange={handleChange} />
                <Field
                  label="Preferred country"
                  name="preferred_country"
                  value={formData.preferred_country}
                  onChange={handleChange}
                />
                <Field
                  label="Preferred program"
                  name="preferred_program"
                  value={formData.preferred_program}
                  onChange={handleChange}
                />
                <Field
                  label="Preferred intake"
                  name="preferred_intake"
                  value={formData.preferred_intake}
                  onChange={handleChange}
                />
                <Field
                  label="Budget (USD)"
                  name="budget"
                  type="number"
                  value={formData.budget}
                  onChange={handleChange}
                />
              </FieldGrid>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead
              icon={FileBadge}
              title="Test scores"
              description="Tick a test to add or edit its score. Untick it to remove it from your profile."
            />
            <PanelBody className="space-y-8">
              {[
                ["language", "Language tests", languageTests],
                ["other", "Other tests", otherTests],
              ].map(([type, heading, tests]) => (
                <section key={type}>
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-ink-faint">{heading}</h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Object.entries(tests).map(([test, data]) => (
                      <TestCard
                        key={test}
                        type={type}
                        testName={test}
                        data={data}
                        onToggle={handleTestToggle}
                        onInputChange={handleTestInput}
                        onSectionChange={handleTestSection}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </PanelBody>
          </Panel>

          <FormError>{formError}</FormError>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <PrimaryButton type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </PrimaryButton>
            <GhostButton type="button" onClick={() => navigate("/profile")}>
              Cancel
            </GhostButton>
          </div>
        </form>

        {/* Academic background — repeatable, saved independently.

            Outside the form above on purpose, and it always was: these entries
            POST one at a time to their own endpoint, so putting them inside the
            profile form would nest a form in a form. The heading says "saved
            separately" now rather than leaving a student to discover it. */}
        <div className="mt-6 space-y-6">
          <Panel>
            <PanelHead
              icon={GraduationCap}
              title="Academic background"
              description="Saved on its own, as you add each entry — the Save button above does not cover this section."
              actions={
                <button
                  type="button"
                  onClick={() => setIsAddingEducation((current) => !current)}
                  aria-expanded={isAddingEducation}
                  className="inline-flex h-[44px] items-center gap-2 rounded-xl border border-ring-idle bg-white px-5 text-[14.5px] font-semibold text-ink-soft transition-colors hover:border-nav/40 hover:text-navy-900"
                >
                  <Plus className="h-[17px] w-[17px]" aria-hidden />
                  Add entry
                </button>
              }
            />
            <PanelBody className="space-y-5">
              {isAddingEducation && (
                <form
                  onSubmit={handleAddEducation}
                  className="rounded-xl border border-hairline bg-canvas p-5"
                >
                  <FieldGrid className="lg:grid-cols-3">
                    <Field
                      label="Institution name"
                      name="institutionName"
                      id="edu-institutionName"
                      value={educationDraft.institutionName}
                      onChange={(e) =>
                        setEducationDraft((c) => ({ ...c, institutionName: e.target.value }))
                      }
                    />
                    <KitField id="edu-degreeLevel" label="Degree level">
                      <SelectInput
                        placeholder="Select"
                        options={DEGREE_LEVELS}
                        value={educationDraft.degreeLevel}
                        onChange={(e) =>
                          setEducationDraft((c) => ({ ...c, degreeLevel: e.target.value }))
                        }
                      />
                    </KitField>
                    <Field
                      label="Field of study"
                      name="fieldOfStudy"
                      id="edu-fieldOfStudy"
                      value={educationDraft.fieldOfStudy}
                      onChange={(e) =>
                        setEducationDraft((c) => ({ ...c, fieldOfStudy: e.target.value }))
                      }
                    />
                    <Field
                      label="Start date"
                      name="startDate"
                      id="edu-startDate"
                      type="date"
                      value={educationDraft.startDate}
                      onChange={(e) => setEducationDraft((c) => ({ ...c, startDate: e.target.value }))}
                    />
                    <Field
                      label="End date"
                      name="endDate"
                      id="edu-endDate"
                      type="date"
                      value={educationDraft.endDate}
                      onChange={(e) => setEducationDraft((c) => ({ ...c, endDate: e.target.value }))}
                    />
                    <Field
                      label="Grade"
                      name="grade"
                      id="edu-grade"
                      value={educationDraft.grade}
                      onChange={(e) => setEducationDraft((c) => ({ ...c, grade: e.target.value }))}
                    />
                  </FieldGrid>
                  <div className="mt-6">
                    <PrimaryButton type="submit">Save entry</PrimaryButton>
                  </div>
                </form>
              )}

              {education.length === 0 ? (
                <NoneYet>No academic background added yet.</NoneYet>
              ) : (
                <ul className="space-y-3">
                  {education.map((entry) => (
                    <li key={entry.id}>
                      <EntryCard className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-[16px] font-bold tracking-[-0.01em] text-navy-900">
                            {entry.institutionName}
                          </p>
                          <p className="mt-1 truncate text-[14.5px] font-medium text-ink-muted">
                            {entry.degreeLevel} {entry.fieldOfStudy && `· ${entry.fieldOfStudy}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteEducation(entry.id)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-orange/10 hover:text-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
                          aria-label={`Delete ${entry.institutionName}`}
                        >
                          <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                        </button>
                      </EntryCard>
                    </li>
                  ))}
                </ul>
              )}
            </PanelBody>
          </Panel>

          {/* Work experience — repeatable, saved independently */}
          <Panel>
            <PanelHead
              icon={Briefcase}
              title="Work experience"
              description="Saved on its own, as you add each entry."
              actions={
                <button
                  type="button"
                  onClick={() => setIsAddingExperience((current) => !current)}
                  aria-expanded={isAddingExperience}
                  className="inline-flex h-[44px] items-center gap-2 rounded-xl border border-ring-idle bg-white px-5 text-[14.5px] font-semibold text-ink-soft transition-colors hover:border-nav/40 hover:text-navy-900"
                >
                  <Plus className="h-[17px] w-[17px]" aria-hidden />
                  Add entry
                </button>
              }
            />
            <PanelBody className="space-y-5">
              {isAddingExperience && (
                <form
                  onSubmit={handleAddExperience}
                  className="rounded-xl border border-hairline bg-canvas p-5"
                >
                  <FieldGrid className="lg:grid-cols-3">
                    <Field
                      label="Company name"
                      name="companyName"
                      id="exp-companyName"
                      value={experienceDraft.companyName}
                      onChange={(e) =>
                        setExperienceDraft((c) => ({ ...c, companyName: e.target.value }))
                      }
                    />
                    <Field
                      label="Job title"
                      name="jobTitle"
                      id="exp-jobTitle"
                      value={experienceDraft.jobTitle}
                      onChange={(e) => setExperienceDraft((c) => ({ ...c, jobTitle: e.target.value }))}
                    />
                    <Field
                      label="Start date"
                      name="startDate"
                      id="exp-startDate"
                      type="date"
                      value={experienceDraft.startDate}
                      onChange={(e) =>
                        setExperienceDraft((c) => ({ ...c, startDate: e.target.value }))
                      }
                    />
                    <Field
                      label="End date"
                      name="endDate"
                      id="exp-endDate"
                      type="date"
                      value={experienceDraft.endDate}
                      onChange={(e) => setExperienceDraft((c) => ({ ...c, endDate: e.target.value }))}
                    />
                    <label className="flex items-center gap-3 self-end pb-[14px] text-[15px] font-semibold text-ink-soft">
                      <input
                        type="checkbox"
                        checked={experienceDraft.isCurrent}
                        onChange={(e) =>
                          setExperienceDraft((c) => ({ ...c, isCurrent: e.target.checked }))
                        }
                        className="h-[18px] w-[18px] rounded border-ring-idle text-navy-900 focus:ring-4 focus:ring-navy-900/15"
                      />
                      Currently working here
                    </label>
                    <KitField id="exp-description" label="Description" className="sm:col-span-2 lg:col-span-3">
                      <TextArea
                        value={experienceDraft.description}
                        onChange={(e) =>
                          setExperienceDraft((c) => ({ ...c, description: e.target.value }))
                        }
                        rows={3}
                      />
                    </KitField>
                  </FieldGrid>
                  <div className="mt-6">
                    <PrimaryButton type="submit">Save entry</PrimaryButton>
                  </div>
                </form>
              )}

              {experience.length === 0 ? (
                <NoneYet>No work experience added yet.</NoneYet>
              ) : (
                <ul className="space-y-3">
                  {experience.map((entry) => (
                    <li key={entry.id}>
                      <EntryCard className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-[16px] font-bold tracking-[-0.01em] text-navy-900">
                            {entry.jobTitle} · {entry.companyName}
                          </p>
                          <p className="mt-1 text-[14.5px] font-medium text-ink-muted">
                            {entry.isCurrent ? "Present" : entry.endDate}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteExperience(entry.id)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-orange/10 hover:text-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
                          aria-label={`Delete ${entry.jobTitle} at ${entry.companyName}`}
                        >
                          <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                        </button>
                      </EntryCard>
                    </li>
                  ))}
                </ul>
              )}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </AppLayout>
  );
};

export default EditProfile;
