import { generatePuzzleBuffer, NUMBER_OF_PUZZLES_OFFSET, combineSolutions, PUZZLE_DIFFICULTY_OFFSET } from "../src/puzzle";
import { solveBlake2bEfficient } from "../src/solver";
import { difficultyToThreshold } from "../src/encoding";
import { checkSolutions, checkPuzzleExpiry, checkAmountOfSolutions } from "../src/verification";

describe("puzzle generation and verification", () => {
    const difficulty = 10;
    const puzzleFixture = generatePuzzleBuffer({
        accountId: 0,
        appId: 0,
        numberOfPuzzles: 1,
        puzzleExpiry: 10,
        puzzleDifficulty: difficulty, // Very easy
        eightByteNonce: new Uint8Array(8),
        userDataBuffer: new Uint8Array([1,2,3,4,5]),
    });

    const input = new Uint8Array(128);
    input.set(puzzleFixture.slice(), 0);
    solveBlake2bEfficient(input, difficultyToThreshold(difficulty), Math.pow(2, 32));
    const solutionsFixture = input.slice(120);

    test("valid solution is considered valid", () => {
        expect(checkPuzzleExpiry(puzzleFixture)).toBeTruthy();
        expect(checkAmountOfSolutions(puzzleFixture, solutionsFixture)).toBeTruthy();
        expect(checkSolutions(puzzleFixture, solutionsFixture)).toBeTruthy();
    });

    test("duplicate solutions are rejected", () => {
        const puzzle = puzzleFixture.slice(); // copy
        puzzle[NUMBER_OF_PUZZLES_OFFSET] = 2;
        expect(checkAmountOfSolutions(puzzle, solutionsFixture)).toBeFalsy();
    
        const twoSolutions = combineSolutions([solutionsFixture, solutionsFixture]);
        expect(checkAmountOfSolutions(puzzle, twoSolutions)).toBeTruthy();
        expect(checkSolutions(puzzle, twoSolutions)).toBeFalsy();
    });

    test("wrong solutions are rejected", () => {
        const puzzle = puzzleFixture.slice(); // copy
        puzzle[PUZZLE_DIFFICULTY_OFFSET] = 255; // impossibly hard, fixture solution is now wrong

        expect(checkAmountOfSolutions(puzzle, solutionsFixture)).toBeTruthy();
        expect(checkSolutions(puzzle, solutionsFixture)).toBeFalsy();
    });
});