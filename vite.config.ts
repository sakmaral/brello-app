import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({ babel: { babelrc: true } })],
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
});
