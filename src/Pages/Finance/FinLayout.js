import React from 'react';

import AppLayout from '../../components/layout/AppLayout';
import { FinanceProvider } from '../../context/FinanceContext';
import FinancialPlanning from './Finance';

const FinanceLayout = () => (
  <AppLayout contentClassName="flex-1 p-6">
    <FinanceProvider>
      <FinancialPlanning />
    </FinanceProvider>
  </AppLayout>
);

export default FinanceLayout;
