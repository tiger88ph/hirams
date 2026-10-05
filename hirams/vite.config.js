import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    plugins: [react()],

    // ✅ Use /hirams/ ONLY in production
    base: isProduction ? "/hirams/" : "/",

    // ✅ Two stable vendor chunks only (React + MUI) so a deploy doesn't make
    //    users re-download the frameworks. No catch-all "vendor" bucket — that
    //    one measured 521 KB gzip of first paint vs 234 KB without it, because
    //    a single eager import dragged the whole bucket into the entry graph.
    build: {
      rollupOptions: {
        output: {
          // manualChunks(id) {
          //   if (!id.includes("node_modules")) return undefined;
          //   const p = id.replace(/\\/g, "/");
          //   if (/\/(react|react-dom|react-router|react-router-dom|scheduler|react-is)\//.test(p))
          //     return "vendor-react";
          //   if (/\/(@mui|@emotion)\//.test(p)) return "vendor-mui";
          //   return undefined; // everything else → Rollup's own chunking
          // },
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            const p = id.replace(/\\/g, "/");
            if (
              /\/(react|react-dom|react-router|react-router-dom|scheduler|react-is|@mui|@emotion|prop-types|hoist-non-react-statics)\//.test(
                p,
              )
            )
              return "vendor-react-mui";
            return undefined;
          },
        },
      },
    },

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
