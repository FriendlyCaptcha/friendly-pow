import { solveBlake2bEfficient } from "../src/solverWasm";
import { difficultyToThreshold } from "../src/encoding";

describe("solver", () => {
    test("Can solve over and over", () => {
        const threshold = difficultyToThreshold(50);
        const input = new Uint8Array(128);

        for (let i = 0; i < 1_000; i++) {
            const hash = solveBlake2bEfficient(input, threshold, 100_000);
            expect(hash.length).toBeGreaterThan(0);
        }
    });

    test("WASM Solver is very fast", () => {
        const threshold = difficultyToThreshold(255); // Basically impossible
        const input = new Uint8Array(128);
        const t = Date.now();
        const n = 1_000_000;
        const hash = solveBlake2bEfficient(input, threshold, n);
        const hashRate: f64 = (n as f64) / ((Date.now()-t) as f64/1000.0);

        expect(hash.length).toBe(0); // No solution found
        expect(hashRate).toBeGreaterThan(1_250_000); // I hit 2.3M/s on Ryzen 3900X
    });

});
