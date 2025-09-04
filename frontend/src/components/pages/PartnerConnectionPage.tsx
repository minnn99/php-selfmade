import React from "react";
import { PartnerConnection } from "../medical/PartnerConnection";
import { FadeInUp } from "../animations";

export const PartnerConnectionPage: React.FC = () => {
  return (
    <FadeInUp delay={100}>
      <PartnerConnection />
    </FadeInUp>
  );
};