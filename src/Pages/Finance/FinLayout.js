import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

import AppLayout from '../../components/layout/AppLayout';
import EmptyState from '../../components/common/EmptyState';
import { FinanceProvider } from '../../context/FinanceContext';
import FinancialPlanning from './Finance';

/**
 * My Finance is still in development, so it is locked for now.
 *
 * The side navigation shows it greyed out with a "Soon" pill and no link, and
 * this screen covers a bookmarked or typed URL. Flip `FINANCE_LOCKED` (and
 * drop `"locked"` from its entry in `data/navigation.json`, and restore its
 * step in `tourSteps.js`) to release it — the feature itself is untouched.
 */
const FINANCE_LOCKED = true;

const FinanceLayout = () => (
  <AppLayout contentClassName="flex-1 p-6">
    {FINANCE_LOCKED ? (
      <div className="mx-auto max-w-2xl pt-10">
        <EmptyState
          icon={Lock}
          title="My Finance is coming soon"
          description="We're still building this section — planning your funding, loan and budget will open here shortly. Your counsellor can help with finances in the meantime."
          action={
            <Link
              to="/"
              className="inline-flex h-10 items-center rounded-xl bg-navy-900 px-5 text-sm font-semibold text-white hover:bg-navy-950"
            >
              Back to dashboard
            </Link>
          }
        />
      </div>
    ) : (
      <FinanceProvider>
        <FinancialPlanning />
      </FinanceProvider>
    )}
  </AppLayout>
);

export default FinanceLayout;
