import React from 'react';

import AppLayout from '../../components/layout/AppLayout';
import StudentDashboard from './Dashy';

const DashboardLayout = () => (
  <AppLayout contentClassName="flex-1 bg-slate-50">
    <StudentDashboard />
  </AppLayout>
);

export default DashboardLayout;
