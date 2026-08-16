import React from 'react';

import MultiStepForm from './application';

// The onboarding wizard runs without the side navigation on purpose — the
// student has not finished setting up yet.
const ApplicationLayout = () => (
  <div className="flex min-h-screen">
    <div className="flex-1 flex flex-col">
      <MultiStepForm />
    </div>
  </div>
);

export default ApplicationLayout;
