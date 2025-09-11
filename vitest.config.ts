import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  // Ensure msw is bundled for SSR test runtime resolution
  ssr: {
    noExternal: ["msw"]
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup/msw.ts"],
    // Ensure MSW is inlined for Vitest to resolve 'msw/node' properly
    deps: {
      inline: ["msw"]
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    }
  }
});
