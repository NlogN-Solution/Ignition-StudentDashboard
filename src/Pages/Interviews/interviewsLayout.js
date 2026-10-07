import React from "react";

import AppLayout from "../../components/layout/AppLayout";
import GuideView from "../../components/interviewPrep/GuideView";
import Interviews from "./Interviews";

const InterviewsLayout = () => (
  <AppLayout>
    <Interviews />
  </AppLayout>
);

/** One Interview Preparation guide, at `/interviews/guides/:slug`. */
export const InterviewGuideLayout = () => (
  <AppLayout>
    <GuideView />
  </AppLayout>
);

export default InterviewsLayout;
