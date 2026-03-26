import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { InlineConfig as VitestInlineConfig } from "vitest";
import type { UserConfig as ViteUserConfig } from "vite";

const config = {
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
} satisfies ViteUserConfig & { test: VitestInlineConfig };

export default defineConfig(config);
