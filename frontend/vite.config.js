import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/calculate": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const auth = req.headers["authorization"];
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
            for (const header of ["authorization", "x-mock-role", "x-mock-user-id"]) {
              const value = req.headers[header];
              if (value) {
                proxyReq.setHeader(header, value);
              }
            }
          });
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.js"],
  },
});
