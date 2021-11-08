import { expiryToDurationInSeconds } from "./encoding";
import { CHALLENGE_SIZE_BYTES } from "./constants";

export const PUZZLE_TIMESTAMP_OFFSET = 0;
export const ACCOUNT_ID_OFFSET = 4;
export const APP_ID_OFFSET = 8;
export const PUZZLE_VERSION_OFFSET = 12;
export const PUZZLE_EXPIRY_OFFSET = 13;
export const NUMBER_OF_PUZZLES_OFFSET = 14;
export const PUZZLE_DIFFICULTY_OFFSET = 15;
export const PUZZLE_NONCE_OFFSET = 24;
export const PUZZLE_USER_DATA_OFFSET = 32;

export const PUZZLE_USER_DATA_MAX_LENGTH = 32;

export function getPuzzleSolverInputs(puzzleBuffer: Uint8Array, numPuzzles: number): Uint8Array[] {
  const startingPoints: Uint8Array[] = [];

  for (let i = 0; i < numPuzzles; i++) {
    const input = new Uint8Array(CHALLENGE_SIZE_BYTES);
    input.set(puzzleBuffer);
    input[120] = i;
    startingPoints.push(input);
  }
  return startingPoints;
}

/**
 * Combine multiple solutions (8 byte values) into a single array
 * @param solutions
 */
export function combineSolutions(solutions: Uint8Array[]): Uint8Array {
  const combined = new Uint8Array(solutions.length * 8);
  for (let i = 0; i < solutions.length; i++) {
    combined.set(solutions[i], i * 8);
  }
  return combined;
}

/**
 * Time in seconds the puzzle is valid for.
 * @param puzzleBuffer
 */
export function getPuzzleTTL(puzzleBuffer: Uint8Array) {
  return expiryToDurationInSeconds(puzzleBuffer[PUZZLE_EXPIRY_OFFSET]);
}
