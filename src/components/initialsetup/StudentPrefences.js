import React, { useState } from "react";
import { Circle, CircleCheck, Calendar, ChevronRight, X } from "lucide-react";

import CustomIcons from "../icons/CustomIcons";
import formOptions from "../../data/formOptions.json";

const emptyTest = { selected: false, score: "", date: "" };

const seedTests = (names) =>
  names.reduce((acc, name) => ({ ...acc, [name]: { ...emptyTest } }), {});

const TestCard = ({ type, testName, data, onToggle, onInputChange }) => (
  <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:bg-gray-50 transition-all duration-300 flex flex-col">
    <div className="flex items-center gap-3 mb-2">
      <CustomIcons iconType="document" size={30} color="#4CAF50" />
      <h3 className="font-medium text-gray-900">{testName}</h3>
      <label className="flex items-center ml-auto cursor-pointer">
        <input
          type="checkbox"
          className="hidden"
          checked={data.selected}
          onChange={() => onToggle(type, testName)}
        />
        {data.selected ? (
          <CircleCheck className="text-green-500 w-5 h-5" />
        ) : (
          <Circle className="text-gray-300 w-5 h-5" />
        )}
      </label>
    </div>

    {data.selected && (
      <>
        <div className="mt-2">
          <label className="text-sm text-gray-600">Score</label>
          <input
            type="number"
            value={data.score}
            onChange={(e) => onInputChange(type, testName, e.target.value, "score")}
            className="w-full mt-1 p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter your score"
          />
        </div>

        <div className="mt-4">
          <label className="text-sm text-gray-600">Test Date</label>
          <div className="relative">
            <Calendar className="absolute top-2 left-2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={data.date}
              onChange={(e) => onInputChange(type, testName, e.target.value, "date")}
              className="w-full mt-1 pl-10 p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </>
    )}
  </div>
);

// Main StudyPreferences Component
const StudyPreferences = ({ onNext, onPrevious, isLastStep, isSubmitting }) => {
  const [studyPreferences, setStudyPreferences] = useState({
    country: [],
    course: "",
    studyMode: "",
    feeStructure: "",
  });
  const [languageTests, setLanguageTests] = useState(() =>
    seedTests(formOptions.languageTests)
  );
  const [otherTests, setOtherTests] = useState(() => seedTests(formOptions.otherTests));
  const [errors, setErrors] = useState({});

  const handleTestToggle = (type, test) => {
    const setter = type === "language" ? setLanguageTests : setOtherTests;
    setter((prev) => ({
      ...prev,
      [test]: { ...prev[test], selected: !prev[test].selected },
    }));
  };

  const handleInputChange = (type, test, value, field) => {
    const setter = type === "language" ? setLanguageTests : setOtherTests;
    setter((prev) => ({
      ...prev,
      [test]: { ...prev[test], [field]: value },
    }));
  };

  const handleAddCountry = (country) => {
    if (!country || studyPreferences.country.includes(country)) return;
    setStudyPreferences((prev) => ({ ...prev, country: [...prev.country, country] }));
    setErrors((prev) => ({ ...prev, country: undefined }));
  };

  const handleRemoveCountry = (country) => {
    setStudyPreferences((prev) => ({
      ...prev,
      country: prev.country.filter((c) => c !== country),
    }));
  };

  const validate = () => {
    const next = {};
    if (studyPreferences.country.length === 0) {
      next.country = "Add at least one destination.";
    }
    if (!studyPreferences.course) next.course = "Select a preferred course.";
    if (!studyPreferences.studyMode) next.studyMode = "Select a study mode.";

    const selectedTests = [
      ...Object.entries(languageTests),
      ...Object.entries(otherTests),
    ].filter(([, data]) => data.selected);

    if (selectedTests.some(([, data]) => !data.score || !data.date)) {
      next.tests = "Fill in the score and date for every test you selected.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    onNext({ ...studyPreferences, languageTests, otherTests });
  };

  const selectFields = [
    { label: "Preferred Course", field: "course", options: formOptions.courses },
    { label: "Study Mode", field: "studyMode", options: formOptions.studyModes },
    {
      label: "Highest Academic Qualification",
      field: "highestAcademic",
      options: formOptions.educationLevels,
    },
    {
      label: "College Fee Structure",
      field: "feeStructure",
      options: formOptions.feeStructures,
    },
  ];

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 bg-white rounded-lg shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Study Preferences & Test Scores
      </h1>

      {/* Study Preferences Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Study Preferences
        </h2>

        <div className="relative">
          <div
            className={`border rounded-lg p-3 ${
              errors.country ? "border-red-400" : "border-gray-200"
            }`}
          >
            <div className="flex flex-wrap gap-2">
              {studyPreferences.country.map((country) => (
                <span
                  key={country}
                  className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                >
                  {formOptions.destinations.find((c) => c.name === country)?.icon} {country}
                  <button
                    type="button"
                    className="ml-2 text-gray-400 hover:text-gray-600"
                    onClick={() => handleRemoveCountry(country)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3">
              <select
                value=""
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => handleAddCountry(e.target.value)}
              >
                <option value="">Add Country</option>
                {formOptions.destinations.map(({ name, icon }) => (
                  <option key={name} value={name}>
                    {icon} {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {errors.country && <p className="text-sm text-red-500 mt-1">{errors.country}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {selectFields.map(({ label, field, options }) => (
            <div key={field}>
              <label className="text-sm text-gray-600 block mb-2">{label}</label>
              <select
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[field] ? "border-red-400" : "border-gray-200"
                }`}
                value={studyPreferences[field] ?? ""}
                onChange={(e) => {
                  setStudyPreferences((prev) => ({ ...prev, [field]: e.target.value }));
                  setErrors((prev) => ({ ...prev, [field]: undefined }));
                }}
              >
                <option value="">Select {label.toLowerCase()}</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors[field] && <p className="text-sm text-red-500 mt-1">{errors[field]}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Test Scores Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Scores</h2>

        {/* Language Tests */}
        <section className="mb-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Language Tests</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(languageTests).map(([test, data]) => (
              <TestCard
                key={test}
                type="language"
                testName={test}
                data={data}
                onToggle={handleTestToggle}
                onInputChange={handleInputChange}
              />
            ))}
          </div>
        </section>

        {/* Other Tests */}
        <section>
          <h3 className="text-lg font-medium text-gray-700 mb-4">Other Tests</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(otherTests).map(([test, data]) => (
              <TestCard
                key={test}
                type="other"
                testName={test}
                data={data}
                onToggle={handleTestToggle}
                onInputChange={handleInputChange}
              />
            ))}
          </div>
        </section>

        {errors.tests && <p className="text-sm text-red-500 mt-4">{errors.tests}</p>}
      </section>

      {/* Save & Submit */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onPrevious}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-100 transition-all duration-300"
        >
          Back
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              isLastStep
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            } transition-all duration-300 disabled:opacity-60`}
          >
            {isSubmitting
              ? "Saving…"
              : isLastStep
              ? "Submit Application"
              : "Save & Continue"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading Screen */}
      {isSubmitting && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="p-4 bg-white rounded-lg shadow-lg flex items-center gap-3">
            <div className="border-4 border-t-4 border-blue-500 w-6 h-6 rounded-full animate-spin" />
            <span className="text-gray-700 font-medium">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPreferences;
