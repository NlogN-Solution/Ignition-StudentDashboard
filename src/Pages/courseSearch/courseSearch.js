import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building,
  Calendar,
  ChevronRight,
  Clock,
  Columns3,
  GraduationCap,
  Heart,
  MapPin,
  Search,
  X,
} from "lucide-react";

import EmptyState from "../../components/common/EmptyState";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";
import formOptions from "../../data/formOptions.json";
import CourseSearchStatIcon from "../../components/coursesearch/StatIcons";

const getIntakeColor = (intake) => {
  const month = intake.split(" ")[0].toLowerCase();
  switch (month) {
    case "jan": return "bg-blue-100 text-blue-600";
    case "feb": return "bg-green-100 text-green-600";
    case "mar": return "bg-orange-100 text-orange-600";
    case "apr": return "bg-purple-100 text-purple-600";
    case "may": return "bg-pink-100 text-pink-600";
    case "jun": return "bg-yellow-100 text-yellow-600";
    case "jul": return "bg-indigo-100 text-indigo-600";
    case "aug": return "bg-red-100 text-red-600";
    case "sep": return "bg-teal-100 text-teal-600";
    case "oct": return "bg-cyan-100 text-cyan-600";
    case "nov": return "bg-amber-100 text-amber-600";
    case "dec": return "bg-lime-100 text-lime-600";
    default: return "bg-gray-100 text-gray-600";
  }
};

const CourseSearchHero = () => {
  const {
    courses,
    universities,
    saved,
    toggleSavedCourse,
    toggleSavedUniversity,
    toggleCompareCourse,
    clearCompare,
    maxCompare,
  } = useAppData();

  const universityCountry = (universityId) =>
    universities.find((item) => item.id === universityId)?.country ?? "";
  const { showToast } = useToast();

  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // Filtering is applied on submit so the "Search Courses" button does something.
  const [appliedFilters, setAppliedFilters] = useState({
    faculty: "",
    country: "",
    term: "",
  });

  const countryOptions = useMemo(
    () => [...new Set(universities.map((item) => item.country))].sort(),
    [universities]
  );

  // Entirely client-side — no server-side search anywhere in this build.
  const filteredCourses = useMemo(() => {
    const term = appliedFilters.term.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesFaculty =
        !appliedFilters.faculty || course.faculty === appliedFilters.faculty;
      const matchesCountry =
        !appliedFilters.country ||
        universityCountry(course.universityId) === appliedFilters.country;
      const matchesTerm =
        !term ||
        course.name.toLowerCase().includes(term) ||
        course.universityName.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term);
      return matchesFaculty && matchesCountry && matchesTerm;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, courses, universities]);

  const compared = useMemo(
    () => saved.compareCourseIds.map((id) => courses.find((course) => course.id === id)).filter(Boolean),
    [courses, saved.compareCourseIds]
  );

  const savedCourses = useMemo(
    () => saved.courseIds.map((id) => courses.find((course) => course.id === id)).filter(Boolean),
    [courses, saved.courseIds]
  );

  const handleSearch = (event) => {
    event.preventDefault();
    setAppliedFilters({
      faculty: selectedFaculty,
      country: selectedCountry,
      term: searchTerm,
    });
  };

  const handleReset = () => {
    setSelectedFaculty("");
    setSelectedCountry("");
    setSearchTerm("");
    setAppliedFilters({ faculty: "", country: "", term: "" });
  };

  const handleToggleSave = (course) => {
    const wasSaved = saved.courseIds.includes(course.id);
    toggleSavedCourse(course.id);
    toggleSavedUniversity(course.universityId);
    showToast(
      wasSaved ? `${course.name} removed from saved.` : `${course.name} saved.`,
      wasSaved ? "info" : "success"
    );
  };

  const handleToggleCompare = (course) => {
    if (
      !saved.compareCourseIds.includes(course.id) &&
      saved.compareCourseIds.length >= maxCompare
    ) {
      showToast(`You can compare up to ${maxCompare} courses at a time.`, "info");
      return;
    }
    toggleCompareCourse(course.id);
  };

  const hasFilters =
    appliedFilters.faculty || appliedFilters.country || appliedFilters.term;

  return (
    <div className="bg-white rounded-lg  p-4 w-full pt-12 px-4 mx-auto">
      {/* Card Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {formOptions.courseSearchStatistics.map((stat) => (
            <div key={stat.id} className="relative group">
              <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-black rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <div className="w-12 h-12 mb-4 flex items-center justify-center text-emerald-500">
                  <CourseSearchStatIcon name={stat.icon} />
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-2">
                  {stat.value}
                </h3>
                <p className="text-gray-600 text-sm">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search Section - Matching Featured Courses Style */}
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSearch}
            className="bg-gradient-to-b from-gray-900 via-gray-800 to-black  p-6 rounded-lg shadow-lg border border-gray-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-500">Find Your Perfect Course</h2>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                <span>2027 Admissions Open</span>
              </div>
            </div>

            <div className="mb-4 relative">
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search courses or universities"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 text-gray-700 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none hover:border-blue-200"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <select
                  className="w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none hover:border-blue-200"
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                >
                  <option value="">Select Faculty</option>
                  {formOptions.faculties.map((faculty) => (
                    <option key={faculty.value} value={faculty.value}>
                      {faculty.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <select
                  className="w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none hover:border-blue-200"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                >
                  <option value="">Select Destination</option>
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transform hover:-translate-y-0.5 transition-all duration-300 focus:ring-2 focus:ring-blue-300 outline-none flex items-center justify-center gap-2"
              >
                <span>Search Courses</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4" />
                {courses.length} Programs
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {countryOptions.length} Destinations
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Flexible Schedule
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Comparison tray */}
      {compared.length > 0 && (
        <div className="container mx-auto px-4">
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Columns3 className="w-5 h-5 text-blue-500" />
                Comparing {compared.length} course{compared.length === 1 ? "" : "s"}
              </h2>
              <button
                type="button"
                onClick={clearCompare}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-4 font-medium">Detail</th>
                    {compared.map((course) => (
                      <th key={course.id} className="py-2 px-4 font-medium text-gray-800">
                        {course.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ["University", (course) => course.universityName],
                    ["Country", (course) => universityCountry(course.universityId)],
                    ["Level", (course) => course.level],
                    ["Tuition", (course) => course.tuitionFee],
                    ["Duration", (course) => course.duration],
                    ["Mode", (course) => course.type],
                    ["Next intake", (course) => course.intakes[0]],
                  ].map(([label, accessor]) => (
                    <tr key={label}>
                      <td className="py-2 pr-4 text-gray-500">{label}</td>
                      {compared.map((course) => (
                        <td key={course.id} className="py-2 px-4 text-gray-700">
                          {accessor(course)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Saved courses */}
      <div className="container mx-auto px-4 pt-12">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Saved Courses
            </h2>
            <span className="text-sm text-gray-500">{savedCourses.length} saved</span>
          </div>

          {savedCourses.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Nothing saved yet"
              description="Tap the heart on any course below and it will be shortlisted here."
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {savedCourses.map((course) => (
                <span
                  key={course.id}
                  className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                >
                  {course.name}
                  <button
                    type="button"
                    onClick={() => handleToggleSave(course)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label={`Remove ${course.name} from saved`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Featured / results Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {hasFilters ? `${filteredCourses.length} matching courses` : "Featured Courses"}
            </h2>
            {hasFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1 group"
              >
                Clear filters
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {filteredCourses.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No courses match those filters"
              description="Try a broader faculty or destination, or clear the search term."
              action={
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300"
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course, index) => {
                const isSaved = saved.courseIds.includes(course.id);
                const isCompared = saved.compareCourseIds.includes(course.id);

                return (
                  <div
                    key={course.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between bg-white animate-fade-in"
                    style={{
                      animationDelay: `${index * 150}ms`,
                      opacity: 0,
                      animation: `fadeIn 0.5s ease-out ${index * 150}ms forwards`
                    }}
                  >
                    <div>
                      <div className="mb-3 h-40 bg-gray-200 rounded-lg overflow-hidden group relative">
                        {course.image ? (
                          <img
                            src={course.image}
                            alt={course.name}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 text-sm bg-gradient-to-br from-gray-50 to-gray-200">
                            No Image Available
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleSave(course)}
                          className={`absolute top-2 right-2 p-2 rounded-lg transition-all duration-300 ${
                            isSaved ? "bg-red-50 text-red-600" : "bg-white/90 text-gray-600"
                          }`}
                          aria-label={isSaved ? `Unsave ${course.name}` : `Save ${course.name}`}
                        >
                          <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
                        </button>
                      </div>

                      <h3 className="text-lg font-medium text-gray-800 mb-2 hover:text-blue-600 transition-colors">
                        {course.name}
                      </h3>

                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {course.universityName} · {universityCountry(course.universityId)}
                      </p>

                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-bold text-green-600">
                          {course.tuitionFee}
                        </span>{" "}
                        | {course.type}
                      </p>
                      <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {course.intakes.map((intake) => (
                          <span
                            key={intake}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 hover:shadow-sm ${getIntakeColor(intake)}`}
                          >
                            {intake}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto space-y-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCompare(course)}
                        className={`w-full px-3 py-2 text-sm border rounded-md transition-colors flex items-center justify-center gap-2 ${
                          isCompared
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Columns3 className="w-4 h-4" />
                        {isCompared ? "Remove from compare" : "Add to compare"}
                      </button>

                      <Link
                        to="/course-search/coursedetails"
                        state={{ courseId: course.id }}
                        className="px-3 py-2 text-sm bg-gray-50 text-gray-700 border rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 group hover:border-blue-200"
                      >
                        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                        Learn More
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <style>
          {`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default CourseSearchHero;
