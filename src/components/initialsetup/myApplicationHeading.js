import React from 'react';
import {
  ChevronRight,
  User,
  Clock,
  FileText,
  BookOpen,
} from 'lucide-react';

const ApplicationHeader = ({ currentStep, applicationId }) => {
  // Update step statuses dynamically based on the current step
  const steps = [
    { id: 1, title: 'Academic History', icon: FileText },
    { id: 2, title: 'Course Selection', icon: BookOpen },
  ].map((step) => {
    if (step.id < currentStep) {
      return { ...step, status: 'completed' };
    } else if (step.id === currentStep) {
      return { ...step, status: 'current' };
    } else {
      return { ...step, status: 'upcoming' };
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Main Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
        {/* Flex Container for Layout */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Left Section */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:items-center w-full lg:w-auto">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-sm">
              <User className="w-8 h-8 text-blue-700" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 hover:text-blue-700 transition-colors">
                {steps.find((step) => step.id === currentStep)?.title || 'Step'}
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2 text-sm sm:text-base">
                <Clock className="w-5 h-5" />
                Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            <div className="bg-gray-50 px-6 py-3 rounded-2xl text-sm text-gray-600 border border-gray-200 hover:border-blue-200 transition-all duration-300 flex justify-between sm:inline-block w-full sm:w-auto">
              <span className="font-medium text-gray-700">Application ID:</span>
              <span className="text-blue-700">{applicationId}</span>
            </div>
            <button className="px-6 py-3 text-white bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl text-sm font-medium transition-all duration-300 flex items-center gap-2 group w-full sm:w-auto">
              Save Progress
              <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border ${
                  step.status === 'current'
                    ? 'bg-blue-50 border-blue-200'
                    : step.status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                } transition-all duration-300 hover:shadow-md`}
              >
                <div
                  className={`p-3 rounded-2xl ${
                    step.status === 'current'
                      ? 'bg-blue-100'
                      : step.status === 'completed'
                      ? 'bg-green-100'
                      : 'bg-gray-100'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      step.status === 'current'
                        ? 'text-blue-600'
                        : step.status === 'completed'
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  />
                </div>
                <div className="flex flex-col">
                  <p
                    className={`text-base font-medium ${
                      step.status === 'current'
                        ? 'text-blue-600'
                        : step.status === 'completed'
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }`}
                  >
                    Step {step.id}
                  </p>
                  <p className="text-sm text-gray-500">{step.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ApplicationHeader;
