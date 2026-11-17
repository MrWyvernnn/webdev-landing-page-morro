import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// `wrangler dev` serves the waitlist API on 8787 next to the Vite server.
const worker = "http://127.0.0.1:8787";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": worker,
      "/confirm": worker,
      "/unsubscribe": worker,
    },
  },
  build: {
    target: "es2020",
    cssMinify: "lightningcss",
  },
});
