import React from 'react';

import AppLayout from '../../components/layout/AppLayout';
import StudentDashboard from './Dashy';

const DashboardLayout = () => (
  <AppLayout contentClassName="flex-1 p-6 bg-gray-100">
    <StudentDashboard />
  </AppLayout>
);

export default DashboardLayout;
