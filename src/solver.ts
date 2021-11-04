import { blake2bResetForShortMessage, blake2bCompress, Context } from "./blake2b/blake2b";
import { CHALLENGE_SIZE_BYTES } from "./constants";

export const HASH_SIZE_BYTES = 32;

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
    throw Error("Invalid input");
  }

  const buf = input.buffer;
  const view = new DataView(buf);

  const ctx = new Context(HASH_SIZE_BYTES);
  ctx.t = CHALLENGE_SIZE_BYTES;

  const start = view.getUint32(124, true);
  const end = start + n;

  for (let i: u32 = start; i < end; i++) {
    view.setUint32(124, i, true);

    blake2bResetForShortMessage(ctx, input);
    blake2bCompress(ctx, true);

    if (ctx.h[0] < threshold) {
      if (ASC_TARGET == 0) {
        // JS
        return new Uint8Array(ctx.h.buffer);
      }
      //@ts-ignore
      return Uint8Array.wrap(ctx.h.buffer);
    }
  }

  return new Uint8Array(0);
}
