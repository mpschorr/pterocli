import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  outDir: "dist",
  clean: true,
  tsconfig: "tsconfig.json",
  platform: "node",
  banner: {
    js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
  },
  external: ['ws', 'zod', 'dotenv'],
});
