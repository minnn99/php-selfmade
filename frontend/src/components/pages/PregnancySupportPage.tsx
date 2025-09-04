import React from "react";
import { PregnancySupport } from "../medical/PregnancySupport";
import { FadeInUp } from "../animations";

export const PregnancySupportPage: React.FC = () => {
  return (
    <FadeInUp delay={100}>
      <PregnancySupport />
    </FadeInUp>
  );
};