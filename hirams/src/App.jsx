import React from "react";
import AppRoute from "./routes/AppRoute";
import { RealtimeProvider } from "./realtime";
import { ThemeModeProvider } from "./context/ThemeModeContext";

function App() {
  return (
    <ThemeModeProvider>
      <RealtimeProvider>
        <AppRoute />
      </RealtimeProvider>
    </ThemeModeProvider>
  );
}

export default App;