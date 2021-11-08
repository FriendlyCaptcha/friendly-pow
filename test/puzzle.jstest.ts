import { solveBlake2bEfficient } from "../src/solver";
import { difficultyToThreshold } from "../src/encoding";

describe("puzzle generation and verification", () => {
  const difficulty = 50;

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

  const input = new Uint8Array(128);
  input.set(puzzleFixture.slice(), 0);
  solveBlake2bEfficient(input, difficultyToThreshold(difficulty), Math.pow(2, 32));
  const foundSolution = input.slice(120);

  test("Finds the expected solution", () => {
    expect(foundSolution).toStrictEqual(expectedSolution);
  });
});
