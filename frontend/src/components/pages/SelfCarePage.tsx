import React from "react";
import { SelfCare } from "../analytics/SelfCare";
import { FadeInUp } from "../animations";

export const SelfCarePage: React.FC = () => {
  return (
    <FadeInUp delay={100}>
      <SelfCare />
    </FadeInUp>
  );
};