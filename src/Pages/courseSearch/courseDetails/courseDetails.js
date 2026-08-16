import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Globe,
  ClipboardCheck,
  Building,
  Heart,
  Clock,
  ChevronRight,
} from 'lucide-react';

import { useAppData } from '../../../context/AppDataContext';
import { useToast } from '../../../context/ToastContext';
import countryGuides from '../../../data/countryGuides.json';
import { formatDate } from '../../../lib/simulate';

const navItems = [
  { id: 'overview', label: 'Course Overview', icon: BookOpen },
  { id: 'requirements', label: 'Requirements & Eligibility', icon: ClipboardCheck },
  { id: 'dates', label: 'Course Dates', icon: Calendar },
  { id: 'college', label: 'About College', icon: Building },
  { id: 'country', label: 'About Country', icon: Globe },
];

const DATE_LABELS = {
  applicationOpens: 'Applications open',
  applicationDeadline: 'Application deadline',
  decisionRelease: 'Decision released',
  programmeStart: 'Programme starts',
};

const getIntakeColor = (intake) => {
  const month = intake.split(' ')[0].toLowerCase();
  const palette = {
    jan: 'bg-blue-100 text-blue-700',
    feb: 'bg-green-100 text-green-700',
    mar: 'bg-orange-100 text-orange-700',
    apr: 'bg-purple-100 text-purple-700',
    may: 'bg-pink-100 text-pink-700',
    jun: 'bg-yellow-100 text-yellow-700',
    jul: 'bg-indigo-100 text-indigo-700',
    aug: 'bg-red-100 text-red-700',
    sep: 'bg-teal-100 text-teal-700',
    oct: 'bg-cyan-100 text-cyan-700',
    nov: 'bg-amber-100 text-amber-700',
    dec: 'bg-lime-100 text-lime-700',
  };
  return palette[month] ?? 'bg-gray-100 text-gray-700';
};

const Bullets = ({ items, dotClass }) => (
  <ul className="space-y-2 text-gray-600">
    {items.map((item) => (
      <li key={item} className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${dotClass}`}></div>
        {item}
      </li>
    ))}
  </ul>
);

const CourseDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { courses, universities, saved, toggleSavedCourse, toggleSavedUniversity } = useAppData();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState('overview');

  if (courses.length === 0) {
    return (
      <div className="lg:col-span-2 mt-12 px-4 pb-12">
        <p className="text-gray-500">Loading course details…</p>
      </div>
    );
  }

  // The course is passed through router state; fall back to the first course so
  // the screen is still meaningful when opened directly.
  const courseData =
    courses.find((course) => course.id === location.state?.courseId) ?? courses[0];
  const university = universities.find((item) => item.id === courseData.universityId);
  const countryGuide = Object.values(countryGuides).find(
    (guide) => guide.name === university?.country
  );

  const isSaved = saved.courseIds.includes(courseData.id);

  const handleToggleSave = () => {
    toggleSavedCourse(courseData.id);
    toggleSavedUniversity(courseData.universityId);
    showToast(
      isSaved ? `${courseData.name} removed from saved.` : `${courseData.name} saved.`,
      isSaved ? 'info' : 'success'
    );
  };

  return (
    <div className="lg:col-span-2 mt-12 px-4 pb-12">
      {/* Course Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{courseData.name}</h2>
              <p className="text-sm text-gray-600 mt-1">{courseData.universityName}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-green-600 font-medium">{courseData.tuitionFee}</span>
                <span className="text-gray-500">|</span>
                <span className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  {courseData.duration}
                </span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-600">{courseData.type}</span>
              </div>
            </div>
            <button
              onClick={handleToggleSave}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isSaved ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
              }`}
              aria-label={isSaved ? 'Remove from saved' : 'Save course'}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            {courseData.intakes.map((intake) => (
              <span
                key={intake}
                className={`px-3 py-1 rounded-full text-sm font-medium ${getIntakeColor(intake)}`}
              >
                {intake}
              </span>
            ))}
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="border-b border-gray-100">
          <div className="p-2">
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                      ${activeSection === item.id
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <p className="text-gray-600">{courseData.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg hover:shadow-md transition-all duration-300">
                  <h4 className="font-medium text-gray-900 mb-3">Course Highlights</h4>
                  <Bullets items={courseData.highlights} dotClass="bg-blue-500" />
                </div>
                <div className="p-4 bg-gray-50 rounded-lg hover:shadow-md transition-all duration-300">
                  <h4 className="font-medium text-gray-900 mb-3">Learning Outcomes</h4>
                  <Bullets items={courseData.outcomes} dotClass="bg-green-500" />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'requirements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Academic Requirements</h4>
                <Bullets items={courseData.requirements.academic} dotClass="bg-blue-500" />
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Required Documents</h4>
                <Bullets items={courseData.requirements.documents} dotClass="bg-orange-500" />
              </div>
            </div>
          )}

          {activeSection === 'dates' && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Key Dates</h4>
              <div className="space-y-3 text-gray-600">
                {Object.entries(courseData.keyDates).map(([key, value]) => (
                  <p key={key}>
                    <strong>{DATE_LABELS[key] ?? key}: </strong>
                    {formatDate(value)}
                  </p>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'college' && university && (
            <div className="space-y-4">
              <p className="text-gray-600">
                {university.name} sits in {university.city} and ranks #{university.worldRanking}{' '}
                worldwide, with an acceptance rate of {university.acceptanceRate}%.
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Why students choose it</h4>
                <Bullets items={university.highlights} dotClass="bg-blue-500" />
              </div>
            </div>
          )}

          {activeSection === 'country' && (
            <div className="space-y-4">
              {countryGuide ? (
                <>
                  <p className="text-gray-600">{countryGuide.about.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {countryGuide.about.categories.map((category) => (
                      <div key={category.title} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">{category.title}</h4>
                        <Bullets items={category.items} dotClass="bg-green-500" />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-gray-600">
                  A detailed guide for {university?.country} is not available yet. Ask your
                  counsellor for the latest country briefing.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-100 transition-all duration-300"
        >
          Back
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleSave}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-100 transition-all duration-300"
          >
            {isSaved ? 'Saved' : 'Save course'}
          </button>
          <Link
            to="/applications"
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-300"
          >
            Start an application
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
