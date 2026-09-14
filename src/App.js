import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import { TourProvider } from './context/TourContext';
import DashboardTour from './components/onboarding/DashboardTour';

// Main dashboard page
import DashboardLayout from './Pages/Dashboard/home';
import ApplyLayout from './Pages/apply/ApplyLayout';
import ExploreLayout from './Pages/explore/ExploreLayout';
import ExploreCourseDetailLayout from './Pages/explore/ExploreCourseDetailLayout';
import ExploreUniversityDetailLayout from './Pages/explore/ExploreUniversityDetailLayout';
import FinanceLayout from './Pages/Finance/FinLayout';
import RegistrationPage from './Pages/register/register1';
import LoginPage from './Pages/Login/Login';
import ResetPassword from './Pages/reset/reset';
import DocumentLayout from './Pages/Documents/uploadDocumentLayout';

import StudentApplicationForm from './Pages/initialsetup/application';

import ApplicationLayout from './Pages/initialsetup/applicationLayout';
import VisaApplication from './Pages/Visa/VisaLayout';

import EnhancedProfile from './Pages/Profile/profile2';
import EditProfile from './Pages/Profile/profile';

import ApplicationsLayout from './Pages/Applications/applicationsLayout';
import ApplicationDetailLayout from './Pages/Applications/applicationDetailLayout';
import ChatLayout from './Pages/Chat/chatLayout';
import AppointmentsLayout from './Pages/Appointments/appointmentsLayout';
import NotificationsLayout from './Pages/Notifications/notificationsLayout';
import TasksLayout from './Pages/Tasks/tasksLayout';
import InterviewsLayout from './Pages/Interviews/interviewsLayout';
import NotFound from './Pages/NotFound/NotFound';

/** Wraps a screen in the simulated-session gate. */
const guarded = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

const App = () => {
  return (
    <AuthProvider>
      <AppDataProvider>
        <ToastProvider>
          <Router>
            {/* The first-run product tour lives above <Routes> so a step can
                move the student between pages without unmounting itself. */}
            <TourProvider>
              <Routes>
                {/* Public — no simulated session required */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registration" element={<RegistrationPage />} />
                <Route path="/reset" element={<ResetPassword />} />

                {/* Everything below checks the local simulated session */}
                <Route path="/" element={guarded(<DashboardLayout />)} />

                {/* The catalogue, read from the same public API the marketing
                    site reads. One Explore screen with a Courses/Universities
                    switch; `?view=` picks the half. See Pages/explore. */}
                <Route path="/explore" element={guarded(<ExploreLayout />)} />

                {/* Applying, from the course. Keyed by the course slug rather
                    than an application id: the application does not exist yet
                    when the flow opens, and the course is what the student
                    came here about. */}
                <Route path="/apply/:slug" element={guarded(<ApplyLayout />)} />
                <Route path="/explore/courses/:slug" element={guarded(<ExploreCourseDetailLayout />)} />
                <Route
                  path="/explore/universities/:slug"
                  element={guarded(<ExploreUniversityDetailLayout />)}
                />

                {/* Redirects, not deletions. The two list screens were their
                    own pages until they merged, the fixture-backed course
                    search was a page before that, and the product tour and any
                    link a student bookmarked still name the old paths — a 404
                    would read as the feature being gone rather than moved. */}
                <Route path="/explore/courses" element={<Navigate to="/explore" replace />} />
                <Route
                  path="/explore/universities"
                  element={<Navigate to="/explore?view=universities" replace />}
                />
                <Route path="/course-search" element={<Navigate to="/explore" replace />} />
                <Route
                  path="/course-search/coursedetails"
                  element={<Navigate to="/explore" replace />}
                />
                <Route path="/finance-management" element={guarded(<FinanceLayout />)} />
                <Route path="/applications" element={guarded(<ApplicationsLayout />)} />
                <Route path="/applications/:applicationId" element={guarded(<ApplicationDetailLayout />)} />
                <Route path="/messages" element={guarded(<ChatLayout />)} />
                <Route path="/appointments" element={guarded(<AppointmentsLayout />)} />
                <Route path="/notifications" element={guarded(<NotificationsLayout />)} />
                <Route path="/tasks" element={guarded(<TasksLayout />)} />
                <Route path="/interviews" element={guarded(<InterviewsLayout />)} />
                <Route path="/studentapp" element={guarded(<StudentApplicationForm />)} />
                <Route path="/visa" element={guarded(<VisaApplication />)} />
                <Route path="/initalsetup" element={guarded(<ApplicationLayout />)} />
                <Route path="/documents" element={guarded(<DocumentLayout />)} />
                <Route path="/profile" element={guarded(<EnhancedProfile />)} />
                <Route path="/edit-profile" element={guarded(<EditProfile />)} />
                {/* Kept so existing links to the old edit path still resolve */}
                <Route path="/profile2" element={guarded(<EditProfile />)} />

                {/* Sections in the nav that have no screen yet, plus bad URLs */}
                <Route path="*" element={guarded(<NotFound />)} />
              </Routes>

              <DashboardTour />
            </TourProvider>
          </Router>
        </ToastProvider>
      </AppDataProvider>
    </AuthProvider>
  );
};

export default App;
