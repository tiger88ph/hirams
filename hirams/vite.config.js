import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    plugins: [react()],

    // ✅ Use /hirams/ ONLY in production
    base: isProduction ? "/hirams/" : "/",

    // ✅ Dev-only proxy (removed automatically in production)
    server: isProduction
      ? undefined
      : {
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
