import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { ToastProvider } from './context/ToastContext';

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

const App = () => {
  return (
    <AuthProvider>
      <AppDataProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* TEMP: every route is public for design review — the ProtectedRoute
                  session gate has been removed from all of these. Re-wrap with
                  <ProtectedRoute> before shipping. */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registration" element={<RegistrationPage />} />
              <Route path="/reset" element={<ResetPassword />} />

              <Route path="/" element={<DashboardLayout />} />
              <Route path="/course-search" element={<CourseLayout />} />
              <Route path="/course-search/coursedetails" element={<CourseDetailsLayout />} />
              <Route path="/finance-management" element={<FinanceLayout />} />
              <Route path="/applications" element={<ApplicationsLayout />} />
              <Route path="/applications/:applicationId" element={<ApplicationDetailLayout />} />
              <Route path="/messages" element={<ChatLayout />} />
              <Route path="/appointments" element={<AppointmentsLayout />} />
              <Route path="/notifications" element={<NotificationsLayout />} />
              <Route path="/tasks" element={<TasksLayout />} />
              <Route path="/interviews" element={<InterviewsLayout />} />
              <Route path="/studentapp" element={<StudentApplicationForm />} />
              <Route path="/visa" element={<VisaApplication />} />
              <Route path="/initalsetup" element={<ApplicationLayout />} />
              <Route path="/documents" element={<DocumentLayout />} />
              <Route path="/profile" element={<EnhancedProfile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              {/* Kept so existing links to the old edit path still resolve */}
              <Route path="/profile2" element={<EditProfile />} />

              {/* Sections in the nav that have no screen yet, plus bad URLs */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </ToastProvider>
      </AppDataProvider>
    </AuthProvider>
  );
};

export default App;
