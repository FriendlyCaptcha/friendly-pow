import { solveBlake2bEfficient } from "../src/solver";
import { difficultyToThreshold } from "../src/encoding";

describe("solver", () => {
  test("Can solve simple challenge within 50,000 tries", () => {
    const threshold = difficultyToThreshold(100);
    const input = new Uint8Array(128);
    const hash = solveBlake2bEfficient(input, threshold, 50_000);
    expect(hash.length).toBeGreaterThan(0);
  });

  test("JS Solver is somewhat fast", () => {
    const threshold = difficultyToThreshold(255); // Basically impossible
    const input = new Uint8Array(128);
    const t = Date.now();
    const n = 150_000;
    const hash = solveBlake2bEfficient(input, threshold, n);
    const hashRate: f64 = (n as f64) / (((Date.now() - t) as f64) / 1000.0);

    expect(hash.length).toBe(0); // No solution found
    expect(hashRate).toBeGreaterThan(50_000);
  });
});
