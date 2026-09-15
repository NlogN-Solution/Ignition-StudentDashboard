import React from "react";

import AppLayout from "../../components/layout/AppLayout";
import { VisaProvider } from "../../context/VisaContext";
import Visa from "./Visa";

const VisaLayout = () => (
  <AppLayout>
    <VisaProvider>
      <Visa />
    </VisaProvider>
  </AppLayout>
);

export default VisaLayout;
