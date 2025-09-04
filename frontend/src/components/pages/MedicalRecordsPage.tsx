import React from "react";
import { MedicalRecords } from "../medical/MedicalRecords";
import { FadeInUp } from "../animations";

export const MedicalRecordsPage: React.FC = () => {
  return (
    <FadeInUp delay={100}>
      <MedicalRecords />
    </FadeInUp>
  );
};