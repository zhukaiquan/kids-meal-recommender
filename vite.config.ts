import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { InlineConfig as VitestInlineConfig } from "vitest";
import type { UserConfig as ViteUserConfig } from "vite";

const productionBase = "/kids-meal-recommender/";

const config = {
  base: process.env.NODE_ENV === "production" ? productionBase : "/",
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
} satisfies ViteUserConfig & { test: VitestInlineConfig };

export default defineConfig(config);
