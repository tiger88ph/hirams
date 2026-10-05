import React from "react";
import { Box, Button, Typography } from "@mui/material";

/**
 * Catches failures raised while lazy-loading a route chunk — most commonly
 * after a deploy, when a tab that was already open still points at old,
 * no-longer-existing asset hashes.
 *
 * Without this boundary the router's `errorElement` (PageNotFound) would show
 * a 404 for a perfectly valid route, which reads as a broken link instead of
 * "the app was updated".
 */
class PageChunkErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // Chunk-load failures are expected after a redeploy; keep them visible
    // in dev but never let them take the whole app down.
    console.error("[PageChunkErrorBoundary]", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          minHeight: "60vh",
          px: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="subtitle2">This page could not be loaded.</Typography>
        <Typography variant="caption" color="text.secondary">
          The app may have been updated. Reload to get the latest version.
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => window.location.reload()}
        >
          Reload
        </Button>
      </Box>
    );
  }
}

export default PageChunkErrorBoundary;
