import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

import formOptions from '../../data/formOptions.json';

const AcademicDetails = ({ initialValues, onPrevious, onNext, isLastStep, isFirstStep }) => {
  const [education, setEducation] = useState(
    initialValues ?? {
      highestLevel: '',
      startingYear: '',
      completionYear: '',
      country: '',
      obtainedMarks: '',
      educationGap: '',
      gapReason: '',
    }
  );
  const [errors, setErrors] = useState({});

  const handleEducationChange = (field, value) => {
    setEducation((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    const currentYear = new Date().getFullYear();
    const start = Number(education.startingYear);
    const end = Number(education.completionYear);

    if (!education.highestLevel) next.highestLevel = 'Select your highest level of education.';
    if (!start || start < 1950 || start > currentYear) {
      next.startingYear = `Enter a year between 1950 and ${currentYear}.`;
    }
    if (!end || end < 1950 || end > currentYear + 10) {
      next.completionYear = 'Enter a valid completion year.';
    } else if (start && end < start) {
      next.completionYear = 'Completion year cannot be before the starting year.';
    }
    if (!education.country.trim()) next.country = 'Country of education is required.';
    if (!education.obtainedMarks.trim()) next.obtainedMarks = 'Enter your marks or CGPA.';
    if (Number(education.educationGap) > 0 && !education.gapReason.trim()) {
      next.gapReason = 'Explain the gap in your education.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext(education);
  };

  const inputClass = (field) =>
    `w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
      errors[field] ? 'border-red-400' : 'border-gray-200'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 mt-9">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Educational Background Section */}
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">
                  Educational Background
                </h2>
                <p className="text-gray-600 mt-1">
                  Enter your highest academic qualification details
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Highest Level of Education
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={inputClass('highestLevel')}
                      value={education.highestLevel}
                      onChange={(e) => handleEducationChange('highestLevel', e.target.value)}
                    >
                      <option value="">Select Education Level</option>
                      {formOptions.educationLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    {errors.highestLevel && (
                      <p className="text-sm text-red-500">{errors.highestLevel}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Starting Year<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className={inputClass('startingYear')}
                      value={education.startingYear}
                      onChange={(e) => handleEducationChange('startingYear', e.target.value)}
                      placeholder="YYYY"
                    />
                    {errors.startingYear && (
                      <p className="text-sm text-red-500">{errors.startingYear}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Year of Completion <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className={inputClass('completionYear')}
                      value={education.completionYear}
                      onChange={(e) => handleEducationChange('completionYear', e.target.value)}
                      placeholder="YYYY"
                    />
                    {errors.completionYear && (
                      <p className="text-sm text-red-500">{errors.completionYear}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Country of Education
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={inputClass('country')}
                      value={education.country}
                      onChange={(e) => handleEducationChange('country', e.target.value)}
                      placeholder="Enter country"
                    />
                    {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Obtained Marks/CGPA<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={inputClass('obtainedMarks')}
                      value={education.obtainedMarks}
                      onChange={(e) => handleEducationChange('obtainedMarks', e.target.value)}
                      placeholder="Enter marks/CGPA"
                    />
                    {errors.obtainedMarks && (
                      <p className="text-sm text-red-500">{errors.obtainedMarks}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Education Gap (in years)
                    </label>
                    <input
                      type="number"
                      className={inputClass('educationGap')}
                      value={education.educationGap}
                      onChange={(e) => handleEducationChange('educationGap', e.target.value)}
                      placeholder="Enter gap in years"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Reason for Gap (if any)
                    </label>
                    <textarea
                      className={inputClass('gapReason')}
                      value={education.gapReason}
                      onChange={(e) => handleEducationChange('gapReason', e.target.value)}
                      placeholder="Explain any gaps in your education"
                      rows="3"
                    />
                    {errors.gapReason && (
                      <p className="text-sm text-red-500">{errors.gapReason}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-between">
              {!isFirstStep && (
                <button
                  onClick={onPrevious}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-100 transition-all duration-300"
                >
                  Back
                </button>
              )}
              <div className="flex items-center gap-4 ml-auto">
                <button
                  onClick={handleNext}
                  className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    isLastStep
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } transition-all duration-300`}
                >
                  {isLastStep ? 'Submit Application' : 'Save & Continue'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AcademicDetails;
