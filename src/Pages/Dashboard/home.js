import React from 'react';

import AppLayout from '../../components/layout/AppLayout';
import StudentDashboard from './Dashy';

// No `contentClassName` — the dashboard owns its own max-width and padding, and
// the grey plate that used to be set here (`p-6 bg-gray-100`) both double-padded
// it and covered the shell's canvas ground with a cooler grey.
const DashboardLayout = () => (
  <AppLayout>
    <StudentDashboard />
  </AppLayout>
);

export default DashboardLayout;
