import React from "react";
import { DailyRecordsList } from "../records/DailyRecordsList";
import { FadeInUp } from "../animations";

export const DailyRecordsPage: React.FC = () => {
  return (
    <FadeInUp delay={100}>
      <DailyRecordsList />
    </FadeInUp>
  );
};