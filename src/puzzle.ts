import { getTimestampInSeconds } from "./timestamp";
import {expiryToDurationInSeconds } from "./encoding";
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

const VERSION = 1;

/**
 * Generates a puzzle for FriendlyCaptcha.
 */
export function generatePuzzleBuffer(opts: {nowInSeconds?: u32; accountId: u32; appId: u32; numberOfPuzzles: u8; puzzleExpiry: u8; puzzleDifficulty: u8; eightByteNonce: Uint8Array; userDataBuffer?: Uint8Array}): Uint8Array {
    const numBytes = opts.userDataBuffer ? 32 + opts.userDataBuffer.length : 32;
    
    const puzzle = new Uint8Array(numBytes);
    const v = new DataView(puzzle.buffer);

    const timeUint32: u32 = opts.nowInSeconds === undefined ? getTimestampInSeconds() : opts.nowInSeconds;

    v.setUint32(PUZZLE_TIMESTAMP_OFFSET, timeUint32);
    v.setUint32(ACCOUNT_ID_OFFSET, opts.accountId);
    v.setUint32(APP_ID_OFFSET, opts.appId);
    v.setUint8(PUZZLE_VERSION_OFFSET, VERSION);
    v.setUint8(PUZZLE_EXPIRY_OFFSET, opts.puzzleExpiry);
    v.setUint8(NUMBER_OF_PUZZLES_OFFSET, opts.numberOfPuzzles);
    v.setUint8(PUZZLE_DIFFICULTY_OFFSET, opts.puzzleDifficulty);

    puzzle.set(opts.eightByteNonce, PUZZLE_NONCE_OFFSET);
    if (opts.userDataBuffer?.slice(0, PUZZLE_USER_DATA_MAX_LENGTH)) {
        puzzle.set(opts.userDataBuffer, PUZZLE_USER_DATA_OFFSET);
    }

    return puzzle;
}

export function getPuzzleSolverInputs(puzzleBuffer: Uint8Array, numPuzzles: number): Uint8Array[] {
    const startingPoints: Uint8Array[] = [];

    for(let i = 0; i < numPuzzles; i++) {
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
    for(let i = 0; i < solutions.length; i++) {
        combined.set(solutions[i], i*8);
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
