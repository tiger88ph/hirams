import React from "react";
import useAssignee from "./useAssignee";
import AssigneeView from "./AssigneeView";

export default function Assignee() {
  const props = useAssignee();
  return <AssigneeView {...props} />;
}
