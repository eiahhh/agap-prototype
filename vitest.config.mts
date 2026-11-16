import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    resolve: {
        // Resolves the "@/..." import alias from tsconfig.json.
        tsconfigPaths: true,
    },
    test: {
        environment: "jsdom",
        include: ["tests/**/*.test.{ts,tsx}"],
        env: {
            // Test-only signing key (never used outside the test run).
            SESSION_SECRET: "test-secret-for-vitest-only-0123456789abcdef",
        },
    },
});
