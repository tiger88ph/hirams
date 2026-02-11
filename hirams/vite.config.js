import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    plugins: [react()],

    base: isProduction ? "/hirams/" : "/",

    server: {
      proxy: {
        "/api": {
          target: "https://lgu.net.ph/apiHirams/public",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
