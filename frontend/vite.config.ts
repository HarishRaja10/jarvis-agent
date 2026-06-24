import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "jarvis-core.svg",
        "apple-touch-icon.png",
        "apple-touch-icon-152.png",
        "apple-touch-icon-167.png",
        "apple-splash-1290x2796.png",
        "apple-splash-1179x2556.png",
        "apple-splash-1170x2532.png",
        "apple-splash-1125x2436.png"
      ],
      manifest: {
        name: "Jarvis Briefing Agent",
        short_name: "Jarvis",
        description: "Personal intelligence briefing dashboard",
        theme_color: "#05070a",
        background_color: "#05070a",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        icons: [
          {
            src: "/jarvis-core.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          },
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    host: "127.0.0.1",
    port: 5173
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/three") ||
            id.includes("node_modules/@react-three") ||
            id.includes("node_modules/postprocessing") ||
            id.includes("node_modules/three-stdlib") ||
            id.includes("node_modules/maath")
          ) {
            return "three-runtime";
          }
          if (id.includes("node_modules")) {
            return "vendor";
          }
        }
      }
    }
  }
});
