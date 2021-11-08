import typescript from "rollup-plugin-typescript2";

export default {
  input: `benchmark.ts`,
  output: [{ file: "build/benchmark.js", format: "iife" }],
  plugins: [
    typescript({
      include: ["./**/*.ts", "../../src/**/*.ts"],
    }),
  ],
};
