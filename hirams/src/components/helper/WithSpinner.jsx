import React from "react";
import { Box, Typography } from "@mui/material";
import DotSpinner from "../common/DotSpinner";

/**
 * Wraps content with a loading spinner overlay
 */
const WithSpinner = ({ loading, message = "Loading...", children }) => {
  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      {children}

      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            bgcolor: "rgba(255,255,255,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
            borderRadius: 2,
            flexDirection: "column",
            gap: 1,
          }}
        >
          <DotSpinner />
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
            {message}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default WithSpinner;
