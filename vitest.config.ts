import path from "node:path";
import os from "node:os";
import { defineConfig } from "vitest/config";

// One throwaway SQLite file per run, migrated by tests/setup/global.ts.
const testDb = path.join(os.tmpdir(), `interview-tracker-test-${process.pid}.db`);

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./tests/setup/global.ts"],
    env: {
      DATABASE_URL: `file:${testDb}`,
      NEXTAUTH_SECRET: "test-secret",
    },
    fileParallelism: false,
  },
});
