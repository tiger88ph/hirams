import React, { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";

export default function SyncMenu({ onSync = () => {} }) {
  const [rotating, setRotating] = useState(false);

  const handleClick = () => {
    setRotating(true);
    onSync();

    // stop rotating after 1.5 seconds
    setTimeout(() => {
      setRotating(false);
    }, 1500);
  };

  return (
    <Tooltip title="Sync">
      <IconButton size="small" onClick={handleClick}>
        <AutorenewIcon
          fontSize="small"
          className={rotating ? "rotate-sync" : ""}
        />
      </IconButton>
    </Tooltip>
  );
}
