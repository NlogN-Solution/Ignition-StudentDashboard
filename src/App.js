import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Main dashboard page
import DashboardLayout from './Pages/Dashboard/home';
import CourseLayout from './Pages/courseSearch/courselayout';
import FinanceLayout from './Pages/Finance/FinLayout';
import RegistrationPage from './Pages/register/register1';
import LoginPage from './Pages/Login/Login';
import ResetPassword from './Pages/reset/reset';
import DocumentLayout from './Pages/Documents/uploadDocumentLayout';

import StudentApplicationForm from './Pages/initialsetup/application';

import ApplicationLayout from './Pages/initialsetup/applicationLayout';
import VisaApplication from './Pages/Visa/VisaLayout';

import CourseDetailsLayout from './Pages/courseSearch/courseDetails/courseDetailsLayout';
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
            <Routes>
              {/* Public — no simulated session required */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registration" element={<RegistrationPage />} />
              <Route path="/reset" element={<ResetPassword />} />

              {/* Everything below checks the local simulated session */}
              <Route path="/" element={guarded(<DashboardLayout />)} />
              <Route path="/course-search" element={guarded(<CourseLayout />)} />
              <Route path="/course-search/coursedetails" element={guarded(<CourseDetailsLayout />)} />
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
          </Router>
        </ToastProvider>
      </AppDataProvider>
    </AuthProvider>
  );
};

export default App;
