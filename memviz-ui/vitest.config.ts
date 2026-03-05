import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: false, // prevent conflicts with jest globals
    environment: "jsdom",
    include: ["**/*.vitest.{test,spec}.ts"],
    setupFiles: ["./test/setup.ts"],
  },
});
