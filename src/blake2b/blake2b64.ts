// Blake2B in assemblyscript, 64bit version

// @ts-ignore
@unmanaged
export class Context {
  b: Uint8Array = new Uint8Array(128);
  h: Uint64Array = new Uint64Array(8);
  t: u64 = 0; // input count
  c: u32 = 0; // pointer within buffer

  v: StaticArray<u64> = new StaticArray<u64>(16);
  m: StaticArray<u64> = new StaticArray<u64>(16);

  constructor(public outlen: u32) {}
}

// G Mixing function
// @ts-ignore
@inline
function mix(v: usize, a: usize, b: usize, c: usize, d: usize, x: u64, y: u64): void {
  let va = load<u64>(v + a);
  let vb = load<u64>(v + b);
  let vc = load<u64>(v + c);
  let vd = load<u64>(v + d);

  va += vb + x; // with input
  vd = rotr(vd ^ va, 32);

  vc += vd; // no input
  vb = rotr(vb ^ vc, 24);

  va += vb + y; // with input
  vd = rotr(vd ^ va, 16);

  vc += vd; // no input
  vb = rotr(vb ^ vc, 63);

  store<u64>(v + a, va);
  store<u64>(v + b, vb);
  store<u64>(v + c, vc);
  store<u64>(v + d, vd);
}


// Initialization Vector
const BLAKE2B_IV_0: u64 = 0x6a09e667f3bcc908;
const BLAKE2B_IV_1: u64 = 0xbb67ae8584caa73b;
const BLAKE2B_IV_2: u64 = 0x3c6ef372fe94f82b;
const BLAKE2B_IV_3: u64 = 0xa54ff53a5f1d36f1;
const BLAKE2B_IV_4: u64 = 0x510e527fade682d1;
const BLAKE2B_IV_5: u64 = 0x9b05688c2b3e6c1f;
const BLAKE2B_IV_6: u64 = 0x1f83d9abfb41bd6b;
const BLAKE2B_IV_7: u64 = 0x5be0cd19137e2179;

const SIGMA8: u8[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
  11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4,
  7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8,
  9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13,
  2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9,
  12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11,
  13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10,
  6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5,
  10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3
];

// Compression function. 'last' flag indicates last block.
export function blake2bCompress(ctx: Context, last: bool, bBufferPtr: usize): void {
  const v = ctx.v;
  const m = ctx.m;
  const h = ctx.h;
  const vPtr = changetype<usize>(v);
  const mPtr = changetype<usize>(m);

  unchecked(v[ 0] = h[0]);
  unchecked(v[ 1] = h[1]);
  unchecked(v[ 2] = h[2]);
  unchecked(v[ 3] = h[3]);
  unchecked(v[ 4] = h[4]);
  unchecked(v[ 5] = h[5]);
  unchecked(v[ 6] = h[6]);
  unchecked(v[ 7] = h[7]);
  unchecked(v[ 8] = BLAKE2B_IV_0);
  unchecked(v[ 9] = BLAKE2B_IV_1);
  unchecked(v[10] = BLAKE2B_IV_2);
  unchecked(v[11] = BLAKE2B_IV_3);
  unchecked(v[12] = BLAKE2B_IV_4);
  unchecked(v[13] = BLAKE2B_IV_5);
  unchecked(v[14] = BLAKE2B_IV_6);
  unchecked(v[15] = BLAKE2B_IV_7);

  // low 64 bits of offset
  // unchecked(v[12] = v[12] ^ ctx.t);
  store<u64>(vPtr, load<u64>(vPtr, 12*8) ^ ctx.t, 12*8);

  // high 64 bits not supported, offset may not be higher than 2**53-1

  // last block flag set ?
  if (last) {
    // unchecked(v[14] = ~v[14]);
    store<u64>(vPtr, ~load<u64>(vPtr, 14*8), 14*8);
  }

  // const u = Uint64Array.wrap(ctx.b.buffer);
  // get little-endian words
  for (let i = 0; i < 16 * 8; i += 8) {
    //m[i] = u[i]
    store<u64>(mPtr + i, load<u64>(bBufferPtr + i));
  }

  // twelve rounds of mixing
  // for (let i = 0; i < 12; i++) {
  //   const o:u32 = i * 16;
  for (let o = 0; o < 12 * 16; o += 16) {
    unchecked(mix(vPtr, 0*8, 4*8,  8*8, 12*8, m[SIGMA8[o +  0]], m[SIGMA8[o +  1]]));
    unchecked(mix(vPtr, 1*8, 5*8,  9*8, 13*8, m[SIGMA8[o +  2]], m[SIGMA8[o +  3]]));
    unchecked(mix(vPtr, 2*8, 6*8, 10*8, 14*8, m[SIGMA8[o +  4]], m[SIGMA8[o +  5]]));
    unchecked(mix(vPtr, 3*8, 7*8, 11*8, 15*8, m[SIGMA8[o +  6]], m[SIGMA8[o +  7]]));
    unchecked(mix(vPtr, 0*8, 5*8, 10*8, 15*8, m[SIGMA8[o +  8]], m[SIGMA8[o +  9]]));
    unchecked(mix(vPtr, 1*8, 6*8, 11*8, 12*8, m[SIGMA8[o + 10]], m[SIGMA8[o + 11]]));
    unchecked(mix(vPtr, 2*8, 7*8,  8*8, 13*8, m[SIGMA8[o + 12]], m[SIGMA8[o + 13]]));
    unchecked(mix(vPtr, 3*8, 4*8,  9*8, 14*8, m[SIGMA8[o + 14]], m[SIGMA8[o + 15]]));
  }

  for (let i = 0; i < 8; i++) {
    unchecked(h[i] ^= v[i] ^ v[i + 8]);
  }
}

// Creates a BLAKE2b hashing context
// Requires an output length between 1 and 64 bytes
// Takes an optional Uint8Array key
export function blake2bInit(outlen: u32, key: Uint8Array | null): Context {
  if (outlen === 0 || outlen > 64) {
    throw new Error('Illegal output length, expected 0 < length <= 64');
  }
  if (key !== null && key.length > 64) {
    throw new Error('Illegal key, expected Uint8Array with 0 < length <= 64');
  }
  const ctx = new Context(outlen);
  const h = ctx.h;

  // Initialize State vector h with IV
  // unchecked(h[0] = BLAKE2B_IV_0);
  unchecked(h[1] = BLAKE2B_IV_1);
  unchecked(h[2] = BLAKE2B_IV_2);
  unchecked(h[3] = BLAKE2B_IV_3);
  unchecked(h[4] = BLAKE2B_IV_4);
  unchecked(h[5] = BLAKE2B_IV_5);
  unchecked(h[6] = BLAKE2B_IV_6);
  unchecked(h[7] = BLAKE2B_IV_7);

  // Mix key size (cbKeyLen) and desired hash length (cbHashLen) into h0
  const keylen: u64 = key !== null ? key.length : 0;
  unchecked(h[0] = BLAKE2B_IV_0 ^ 0x01010000 ^ (keylen << 8) ^ (outlen as u64));

  // key the hash, if applicable
  if (key) {
    blake2bUpdate(ctx, key);
    // at the end
    ctx.c = 128;
  }

  return ctx;
}

// Updates a BLAKE2b streaming hash
// Requires hash context and Uint8Array (byte array)
export function blake2bUpdate(ctx: Context, input: Uint8Array): void {
  for (let i = 0, len = input.length; i < len; i++) {
    if (ctx.c === 128) { // buffer full ?
      ctx.t += ctx.c; // add counters
      blake2bCompress(ctx, false, load<u32>(changetype<usize>(ctx.b))); // compress (not last)
      ctx.c = 0; // counter to zero
    }
    unchecked(ctx.b[ctx.c++] = input[i]);
  }
}

// Completes a BLAKE2b streaming hash
// Returns a Uint8Array containing the message digest
export function blake2bFinal(ctx: Context): Uint8Array {
  let b = ctx.b;
  let c = ctx.c;
  ctx.t += c; // mark last block offset

  while (c < 128) { // fill up with zeros
    unchecked(b[c++] = 0);
  }
  ctx.c = c;
  blake2bCompress(ctx, true, load<u32>(changetype<usize>(b))); // final block flag = 1

  // little endian convert and store
  // const u64a = new Uint64Array(ctx.outlen / 8);
  // for(let i = 0; i < u64a.length; i++) {
  //   unchecked(u64a[i] = ctx.h[i]);
  // }

  return Uint8Array.wrap(ctx.h.buffer.slice(0, ctx.outlen));
}

// Computes the BLAKE2B hash of a string or byte array, and returns a Uint8Array
//
// Returns a n-byte Uint8Array
//
// Parameters:
// - input - the input bytes, as a string, Buffer or Uint8Array
// - key - optional key Uint8Array, up to 64 bytes
// - outlen - optional output length in bytes, default 64
export function blake2b(input: Uint8Array, key: Uint8Array | null = null, outlen: u32 = 64): Uint8Array {
  const ctx = blake2bInit(outlen, key);
  blake2bUpdate(ctx, input);
  return blake2bFinal(ctx);
}

/**
 * FRIENDLYCAPTCHA optimization only, does not reset ctx.t (global byte counter), you need to do that yourself.
 * Assumes no key
 */
// @ts-ignore
@inline
export function blake2bResetForShortMessage(ctx: Context): void {
  const h = ctx.h;
  // Initialize State vector h with IV
  // unchecked(h[0] = BLAKE2B_IV_0);
  unchecked(h[1] = BLAKE2B_IV_1);
  unchecked(h[2] = BLAKE2B_IV_2);
  unchecked(h[3] = BLAKE2B_IV_3);
  unchecked(h[4] = BLAKE2B_IV_4);
  unchecked(h[5] = BLAKE2B_IV_5);
  unchecked(h[6] = BLAKE2B_IV_6);
  unchecked(h[7] = BLAKE2B_IV_7);

  // Danger: These operations and resetting are really only possible because our input is exactly 128 bytes
  // for(let i = 0; i < 128; i++) {
  //   ctx.b[i] = input[i];
  // }
  // ctx.b = input;
  // We don't actually have to reset these as they are overwritten and we never stream..
  // ctx.b.set(input);
  // ctx.m.fill(0);
  // ctx.v.fill(0);

  h[0] = BLAKE2B_IV_0 ^ 0x01010000 ^ (ctx.outlen as u64);
}
