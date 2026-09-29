import React from "react";
import useArchive from "./useArchive";
import ArchiveView from "./ArchiveView";

export default function TransactionArchive() {
  const props = useArchive();
  return <ArchiveView {...props} />;
}
