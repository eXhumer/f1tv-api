const terser = require("@rollup/plugin-terser");
const typescript = require("@rollup/plugin-typescript");
const { defineConfig } = require("rollup");

module.exports = defineConfig({
  input: [
    "src/library.ts",
    "src/client.ts",
    "src/type.ts",
  ],
  output: {
    dir: "dist",
    format: "cjs",
    sourcemap: true,
  },
  plugins: [
    terser(),
    typescript(),
  ],
});
