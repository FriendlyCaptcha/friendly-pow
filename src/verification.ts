import { difficultyToThreshold, expiryToDurationInSeconds } from "./encoding";
import { PUZZLE_DIFFICULTY_OFFSET, NUMBER_OF_PUZZLES_OFFSET, PUZZLE_TIMESTAMP_OFFSET, PUZZLE_EXPIRY_OFFSET, ACCOUNT_ID_OFFSET, APP_ID_OFFSET, PUZZLE_VERSION_OFFSET } from "./puzzle";
import { Context, blake2bResetForShortMessage, blake2bCompress } from "./blake2b/blake2b";
import { HASH_SIZE_BYTES } from "./solver";
import { CHALLENGE_SIZE_BYTES } from "./constants";
import { getTimestampInSeconds } from "./timestamp";

export function checkSolutions(puzzleBuffer: Uint8Array, solutionsBuffer: Uint8Array): bool {
    const threshold = difficultyToThreshold(puzzleBuffer[PUZZLE_DIFFICULTY_OFFSET]);

    const ctx = new Context(HASH_SIZE_BYTES);
    ctx.t = CHALLENGE_SIZE_BYTES;

    const input = new Uint8Array(CHALLENGE_SIZE_BYTES);
    input.set(puzzleBuffer, 0);

    const solutions = new Set<string>();

    for(let i = 0; i < solutionsBuffer.length / 8; i++) {
        const solution = solutionsBuffer.slice(i*8, i*8+8);
        const solutionString = solution.toString();
        // Duplicate check
        if (solutions.has(solutionString)) {
            return false;
        }
        solutions.add(solutionString);

        input.set(solution, 120);
        blake2bResetForShortMessage(ctx, input);
        blake2bCompress(ctx, true);

        if (ctx.h[0] >= threshold) {
            return false;
        }
    }

    return true;
}

export function checkAmountOfSolutions(puzzleBuffer: Uint8Array, solutionBuffer: Uint8Array): boolean {
    const amountOfSolutionsRequired: u32 = puzzleBuffer[NUMBER_OF_PUZZLES_OFFSET];
    return solutionBuffer.length == amountOfSolutionsRequired*8;
}

export function checkPuzzleExpiry(puzzleBuffer: Uint8Array): boolean {
    const timeNow = getTimestampInSeconds();
    const view = new DataView(puzzleBuffer.buffer);
    const puzzleTimestamp = view.getUint32(PUZZLE_TIMESTAMP_OFFSET);
    const puzzleExpiryByte = view.getUint8(PUZZLE_EXPIRY_OFFSET);
    
    const expirationTime = puzzleTimestamp + expiryToDurationInSeconds(puzzleExpiryByte);
    return expirationTime >= timeNow;
}

export function checkAccountAndAppId(puzzleBuffer: Uint8Array, accountId: number, appId: number) {
    const view = new DataView(puzzleBuffer.buffer);
    return accountId == view.getUint32(ACCOUNT_ID_OFFSET) && appId == view.getUint32(APP_ID_OFFSET);
}

export function checkVersionExactly(puzzleBuffer: Uint8Array, version: number) {
    return puzzleBuffer[PUZZLE_VERSION_OFFSET] === version;
}
