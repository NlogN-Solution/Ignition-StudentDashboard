import React from 'react';

import MultiStepForm from './application';

// The onboarding wizard runs without the side navigation on purpose — the
// student has not finished setting up yet. The canvas ground is the public
// platform's, so the screen after registration looks like the screen before it.
const ApplicationLayout = () => (
  <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
    <MultiStepForm />
  </div>
);

export default ApplicationLayout;
