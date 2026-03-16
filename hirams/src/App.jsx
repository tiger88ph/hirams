import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./utils/style/theme";
import AppRoute from "./routes/AppRoute";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AppRoute />
    </ThemeProvider>
  );
}

export default App;