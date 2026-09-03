import React from "react";
import useCompany from "./useCompany";
import CompanyView from "./CompanyView";

export default function Company() {
  const props = useCompany();
  return <CompanyView {...props} />;
}
