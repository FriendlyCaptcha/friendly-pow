import { blake2bResetForShortMessage, blake2bCompress, Context } from "./blake2b/blake2b64";

const CHALLENGE_SIZE_BYTES = 128;
const HASH_SIZE_BYTES = 32;

// Uncomment for debugging
// //@ts-ignore
// @external("console", "log")
// declare function log(msg: string): void;

/**
 * Solve the blake2b hashing problem, re-using the memory between different attempts (which solves up to 50% faster).
 *
 * This only changes the last 4 bytes of the input array to find a solution. To find multiple solutions
 * one could call this function multiple times with the 4 bytes in front of those last 4 bytes varying.
 *
 *
 * The goal is to find a nonce that, hashed together with the rest of the input header, has a value of its
 * most significant 32bits that is below some threshold.
 * Approximately this means: the hash value of it starts with K zeroes (little endian), which is expected to be
 * increasingly difficult as K increases.
 *
 * In practice you should ask the client to solve multiple (easier) puzzles which should reduce variance and also allows us
 * to show a progress bar.
 * @param input challenge bytes
 * @param threshold u32 value under which the solution's hash should be below.
 */
export function solveBlake2bEfficient(input: Uint8Array, threshold: u32, n: u32): Uint8Array {
  if (input.length != CHALLENGE_SIZE_BYTES) {
    throw new Error("Invalid input");
  }

  const arrayPtr = changetype<usize>(input);
  const bufferPtr = load<u32>(arrayPtr);

  const ctx = new Context(HASH_SIZE_BYTES);
  const h = ctx.h;
  ctx.t = CHALLENGE_SIZE_BYTES;

  const start = load<u32>(bufferPtr + 124);
  const end = start + n;
  for (let i: u32 = start; i < end; i++) {
    store<u32>(bufferPtr + 124, i);
    // log(input.slice(124));

    blake2bResetForShortMessage(ctx);
    blake2bCompress(ctx, true, bufferPtr);

    if ((unchecked(h[0]) as u32) < threshold) {
      return Uint8Array.wrap(h.buffer);
    }
  }
  // No solution found signal.
  return new Uint8Array(0);
}
