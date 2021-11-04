import { solveBlake2bEfficient } from "../src/solverWasm";
import { difficultyToThreshold } from "../src/encoding";

const puzzleFixture = new Uint8Array(37);
// prettier-ignore
puzzleFixture.set([
      97, 131, 208, 51, 0,  0, 0, 0, 0, 0,
       0,   0,   1, 10, 1, 50, 0, 0, 0, 0,
       0,   0,   0,  0, 0,  0, 0, 0, 0, 0,
       0,   0,   1,  2, 3,  4, 5
]) // A very easy puzzle with difficulty 50
const expectedSolution = new Uint8Array(8);
expectedSolution.set([0, 0, 0, 0, 154, 0, 0, 0]);

// const expectedSolution = new Uint8Array([]);

describe("solver", () => {
  test("Can solve over and over", () => {
    const threshold = difficultyToThreshold(50);
    const input = new Uint8Array(128);

    for (let i = 0; i < 1_000; i++) {
      const hash = solveBlake2bEfficient(input, threshold, 100_000);
      expect(hash.length).toBeGreaterThan(0);
    }
  });

  test("WASM solver also finds expected solution", () => {
    const threshold = difficultyToThreshold(50);
    const input = new Uint8Array(128);
    input.set(puzzleFixture);

    const hash = solveBlake2bEfficient(input, threshold, 100_000);
    expect(hash.length).toBeGreaterThan(0);
    const foundSolution = input.slice(120);
    expect(foundSolution).toStrictEqual(expectedSolution);
  });

  test("WASM Solver is very fast", () => {
    const threshold = difficultyToThreshold(255); // Basically impossible
    const input = new Uint8Array(128);
    const t = Date.now();
    const n = 1_000_000;
    const hash = solveBlake2bEfficient(input, threshold, n);
    const hashRate: f64 = (n as f64) / (((Date.now() - t) as f64) / 1000.0);

    expect(hash.length).toBe(0); // No solution found
    expect(hashRate).toBeGreaterThan(1_250_000); // I hit 2.3M/s on Ryzen 3900X
  });
});
