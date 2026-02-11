// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#0d47a1" }, // your brand color
    secondary: { main: "#22c55e" },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    h6: {
      fontWeight: 700,
    },
    subtitle2: {
      fontWeight: 500,
    },
    body1: {
      fontWeight: 400,
    },
    body2: {
      fontWeight: 300,
    },
  },
});

export default theme;
