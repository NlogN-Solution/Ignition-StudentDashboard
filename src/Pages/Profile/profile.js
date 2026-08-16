import React, { useEffect, useState } from "react";
import { Briefcase, Camera, GraduationCap, MapPin, Plus, Trash2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { fetchMyProfile, updateMyProfile } from "../../api/students";
import {
  addEducationHistoryApi,
  addWorkExperienceApi,
  deleteEducationHistoryApi,
  deleteWorkExperienceApi,
  getEducationHistoryApi,
  getWorkExperienceApi,
} from "../../api/studentPortal";

const cardClass = "bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6";
const labelClass = "text-sm font-medium text-gray-700 mb-1 block";
const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";

const EDUCATION_LEVELS = ["bachelor", "diploma", "10+2", "masters", "phd", "other"];
const DEGREE_LEVELS = [
  "certificate",
  "diploma",
  "advanced_diploma",
  "bachelor",
  "postgraduate_diploma",
  "master",
  "doctorate",
];

const Field = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className={labelClass}>{label}</label>
    <input type={type} name={name} value={value ?? ""} onChange={onChange} className={inputClass} />
  </div>
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
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState(null);
  const [profileImage, setProfileImage] = useState(user?.profileImage ?? null);
  const [isSaving, setIsSaving] = useState(false);

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
      setEducation(nextEducation);
      setExperience(nextExperience);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.fullName, user?.email, user?.phone]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setProfileImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await updateUser({ fullName: formData.fullName, email: formData.email, phone: formData.phone, profileImage });
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
      });
      showToast("Profile updated successfully.");
      navigate("/profile");
    } catch {
      showToast("Couldn't save your profile. Please try again.", "error");
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
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>

        <form onSubmit={handleSubmit}>
          <div className={cardClass}>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              <User className="w-5 h-5 text-blue-500" />
              Profile Overview
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <label htmlFor="profileImage" className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer">
                <Camera className="w-4 h-4" />
              </label>
              <input type="file" id="profileImage" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} />
              <Field label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
              <Field label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              <User className="w-5 h-5 text-blue-500" />
              Personal & Family Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
              <Field label="Passport Number" name="passport_number" value={formData.passport_number} onChange={handleChange} />
              <Field
                label="Citizenship Number"
                name="citizenship_number"
                value={formData.citizenship_number}
                onChange={handleChange}
              />
              <Field label="Birth Place" name="birth_place" value={formData.birth_place} onChange={handleChange} />
              <Field label="Father's Name" name="father_name" value={formData.father_name} onChange={handleChange} />
              <Field label="Mother's Name" name="mother_name" value={formData.mother_name} onChange={handleChange} />
              <Field
                label="Emergency Contact Name"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
              />
              <Field
                label="Emergency Contact Phone"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              <MapPin className="w-5 h-5 text-blue-500" />
              Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Temporary / Current Address</label>
                <textarea
                  name="current_address"
                  value={formData.current_address}
                  onChange={handleChange}
                  rows={2}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Permanent Address</label>
                <textarea
                  name="permanent_address"
                  value={formData.permanent_address}
                  onChange={handleChange}
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              <GraduationCap className="w-5 h-5 text-blue-500" />
              Current Education & Preferences
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Highest Education Level</label>
                <select name="education_level" value={formData.education_level} onChange={handleChange} className={inputClass}>
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="University Name" name="university_name" value={formData.university_name} onChange={handleChange} />
              <Field label="Institution Name" name="institution_name" value={formData.institution_name} onChange={handleChange} />
              <Field
                label="Graduation Year"
                name="graduation_year"
                type="number"
                value={formData.graduation_year}
                onChange={handleChange}
              />
              <Field label="GPA" name="gpa" type="number" value={formData.gpa} onChange={handleChange} />
              <Field
                label="Preferred Country"
                name="preferred_country"
                value={formData.preferred_country}
                onChange={handleChange}
              />
              <Field
                label="Preferred Program"
                name="preferred_program"
                value={formData.preferred_program}
                onChange={handleChange}
              />
              <Field label="Preferred Intake" name="preferred_intake" value={formData.preferred_intake} onChange={handleChange} />
              <Field label="Budget (USD)" name="budget" type="number" value={formData.budget} onChange={handleChange} />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="px-6 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Academic background — repeatable, saved independently */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <GraduationCap className="w-5 h-5 text-blue-500" />
              Academic Background
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingEducation((current) => !current)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add entry
            </button>
          </div>

          {isAddingEducation && (
            <form onSubmit={handleAddEducation} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <Field
                label="Institution Name"
                name="institutionName"
                value={educationDraft.institutionName}
                onChange={(e) => setEducationDraft((c) => ({ ...c, institutionName: e.target.value }))}
              />
              <div>
                <label className={labelClass}>Degree Level</label>
                <select
                  value={educationDraft.degreeLevel}
                  onChange={(e) => setEducationDraft((c) => ({ ...c, degreeLevel: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  {DEGREE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="Field of Study"
                name="fieldOfStudy"
                value={educationDraft.fieldOfStudy}
                onChange={(e) => setEducationDraft((c) => ({ ...c, fieldOfStudy: e.target.value }))}
              />
              <Field
                label="Start Date"
                name="startDate"
                type="date"
                value={educationDraft.startDate}
                onChange={(e) => setEducationDraft((c) => ({ ...c, startDate: e.target.value }))}
              />
              <Field
                label="End Date"
                name="endDate"
                type="date"
                value={educationDraft.endDate}
                onChange={(e) => setEducationDraft((c) => ({ ...c, endDate: e.target.value }))}
              />
              <Field
                label="Grade"
                name="grade"
                value={educationDraft.grade}
                onChange={(e) => setEducationDraft((c) => ({ ...c, grade: e.target.value }))}
              />
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300"
                >
                  Save entry
                </button>
              </div>
            </form>
          )}

          {education.length === 0 ? (
            <p className="text-sm text-gray-500">No academic background added yet.</p>
          ) : (
            <div className="space-y-2">
              {education.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{entry.institutionName}</p>
                    <p className="text-xs text-gray-500">
                      {entry.degreeLevel} {entry.fieldOfStudy && `· ${entry.fieldOfStudy}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteEducation(entry.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Work experience — repeatable, saved independently */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Briefcase className="w-5 h-5 text-blue-500" />
              Work Experience
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingExperience((current) => !current)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add entry
            </button>
          </div>

          {isAddingExperience && (
            <form onSubmit={handleAddExperience} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <Field
                label="Company Name"
                name="companyName"
                value={experienceDraft.companyName}
                onChange={(e) => setExperienceDraft((c) => ({ ...c, companyName: e.target.value }))}
              />
              <Field
                label="Job Title"
                name="jobTitle"
                value={experienceDraft.jobTitle}
                onChange={(e) => setExperienceDraft((c) => ({ ...c, jobTitle: e.target.value }))}
              />
              <Field
                label="Start Date"
                name="startDate"
                type="date"
                value={experienceDraft.startDate}
                onChange={(e) => setExperienceDraft((c) => ({ ...c, startDate: e.target.value }))}
              />
              <Field
                label="End Date"
                name="endDate"
                type="date"
                value={experienceDraft.endDate}
                onChange={(e) => setExperienceDraft((c) => ({ ...c, endDate: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={experienceDraft.isCurrent}
                  onChange={(e) => setExperienceDraft((c) => ({ ...c, isCurrent: e.target.checked }))}
                />
                Currently working here
              </label>
              <div className="sm:col-span-3">
                <label className={labelClass}>Description</label>
                <textarea
                  value={experienceDraft.description}
                  onChange={(e) => setExperienceDraft((c) => ({ ...c, description: e.target.value }))}
                  rows={2}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300"
                >
                  Save entry
                </button>
              </div>
            </form>
          )}

          {experience.length === 0 ? (
            <p className="text-sm text-gray-500">No work experience added yet.</p>
          ) : (
            <div className="space-y-2">
              {experience.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {entry.jobTitle} · {entry.companyName}
                    </p>
                    <p className="text-xs text-gray-500">{entry.isCurrent ? "Present" : entry.endDate}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteExperience(entry.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default EditProfile;
