import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const publicSource = path.resolve(rootDir, "public");
const localEditorialRoutes = path.resolve(rootDir, "private", "EditorialRoutes.jsx");
const productionEditorialRoutes = path.resolve(
  publicSource,
  "src",
  "private",
  "editorialRoutes.public.jsx",
);

export default defineConfig(({ command }) => {
  // Vite's development server and Vitest run on an authoring workstation and
  // may resolve the local-only editorial route tree. Production builds always
  // resolve a null route module, and Docker deliberately omits frontend/private.
  const usePrivateEditorial = command === "serve" || process.env.VITEST === "true";

  return {
    root: publicSource,
    publicDir: "public",
    plugins: [react()],
    resolve: {
      alias: {
        "@private-editorial-routes": usePrivateEditorial
          ? localEditorialRoutes
          : productionEditorialRoutes,
      },
    },
    server: {
      proxy: {
        "/calculate": {
          target: "http://127.0.0.1:5000",
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              const auth = req.headers.authorization;
              if (auth) proxyReq.setHeader("Authorization", auth);
            });
          },
        },
        "/health": "http://127.0.0.1:5000",
        "/api": {
          target: "http://127.0.0.1:5000",
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              const auth = req.headers.authorization;
              if (auth) proxyReq.setHeader("Authorization", auth);
            });
          },
        },
      },
    },
    build: {
      outDir: path.resolve(rootDir, "dist"),
      emptyOutDir: true,
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test-setup.js"],
      // The public application is the Vite root, but the local-only editorial
      // suite lives in the sibling frontend/private tree. Collect from the
      // frontend directory so both are part of `npm test`; production builds
      // still resolve the null editorial route module above.
      dir: rootDir,
    },
  };
});
