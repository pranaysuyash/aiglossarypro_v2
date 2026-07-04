import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import reactScan from "@react-scan/vite-plugin-react-scan";

export default defineConfig({
  plugins: [react(), reactScan({ enable: process.env.NODE_ENV !== "production" }), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@streamdown") || id.includes("node_modules/streamdown")) {
            return "study-renderer";
          }
          if (
            id.includes("node_modules/micromark") ||
            id.includes("node_modules/remark-") ||
            id.includes("node_modules/unified") ||
            id.includes("node_modules/hast-util") ||
            id.includes("node_modules/unist-util")
          ) {
            return "study-markdown";
          }
          if (
            id.includes("node_modules/rehype-") ||
            id.includes("node_modules/html-url-attributes")
          ) {
            return "study-sanitize";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 4173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
});
