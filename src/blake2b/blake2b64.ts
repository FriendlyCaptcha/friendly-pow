// Blake2B in assemblyscript, 64bit version

// @ts-ignore
@unmanaged
export class Context {
  b: Uint8Array = new Uint8Array(128);
  h: Uint64Array = new Uint64Array(8);
  t: u64 = 0; // input count
  c: u32 = 0; // pointer within buffer

  v0: u64 = 0;
  v1: u64 = 0;
  v2: u64 = 0;
  v3: u64 = 0;
  v4: u64 = 0;
  v5: u64 = 0;
  v6: u64 = 0;
  v7: u64 = 0;
  v8: u64 = 0;
  v9: u64 = 0;
  v10: u64 = 0;
  v11: u64 = 0;
  v12: u64 = 0;
  v13: u64 = 0;
  v14: u64 = 0;
  v15: u64 = 0;

  m: StaticArray<u64> = new StaticArray<u64>(16);

  constructor(public outlen: u32) {}
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
  const m = ctx.m;
  const h = ctx.h;
  const mPtr = changetype<usize>(m);

  unchecked(ctx.v0 = h[0]);
  unchecked(ctx.v1 = h[1]);
  unchecked(ctx.v2 = h[2]);
  unchecked(ctx.v3 = h[3]);
  unchecked(ctx.v4 = h[4]);
  unchecked(ctx.v5 = h[5]);
  unchecked(ctx.v6 = h[6]);
  unchecked(ctx.v7 = h[7]);

  ctx.v8  = BLAKE2B_IV_0;
  ctx.v9  = BLAKE2B_IV_1;
  ctx.v10 = BLAKE2B_IV_2;
  ctx.v11 = BLAKE2B_IV_3;
  ctx.v12 = BLAKE2B_IV_4;
  ctx.v13 = BLAKE2B_IV_5;
  ctx.v14 = BLAKE2B_IV_6;
  ctx.v15 = BLAKE2B_IV_7;

  // low 64 bits of offset
  // unchecked(v[12] = v[12] ^ ctx.t);
  ctx.v12 ^= ctx.t;

  // high 64 bits not supported, offset may not be higher than 2**53-1

  // last block flag set ?
  if (last) {
    // unchecked(v[14] = ~v[14]);
    ctx.v14 = ~ctx.v14;
  }

  // const u = Uint64Array.wrap(ctx.b.buffer);
  // get little-endian words
  for (let i = 0; i < 16 * 8; i += 8) {
    //m[i] = u[i]
    store<u64>(mPtr + i, load<u64>(bBufferPtr + i));
  }

  let v0  = ctx.v0;
  let v1  = ctx.v1;
  let v2  = ctx.v2;
  let v3  = ctx.v3;
  let v4  = ctx.v4;
  let v5  = ctx.v5;
  let v6  = ctx.v6;
  let v7  = ctx.v7;
  let v8  = ctx.v8;
  let v9  = ctx.v9;
  let v10 = ctx.v10;
  let v11 = ctx.v11;
  let v12 = ctx.v12;
  let v13 = ctx.v13;
  let v14 = ctx.v14;
  let v15 = ctx.v15;

  let va: u64, vb: u64, vc: u64, vd: u64, x: u64, y: u64;

  for (let o = 0; o < 12 * 16; o += 16) {
    // mix(vPtr, 0*8, 4*8,  8*8, 12*8, m[SIGMA8[o +  0]], m[SIGMA8[o +  1]])
    va = v0;
    vb = v4;
    vc = v8;
    vd = v12;
    x = unchecked(m[SIGMA8[o + 0]]);
    y = unchecked(m[SIGMA8[o + 1]]);
    va += vb + x; vd = rotr(vd ^ va, 32);
    vc += vd;     vb = rotr(vb ^ vc, 24);
    va += vb + y; vd = rotr(vd ^ va, 16);
    vc += vd;     vb = rotr(vb ^ vc, 63);
    v0  = va;
    v4  = vb;
    v8  = vc;
    v12 = vd;

    // mix(vPtr, 1*8, 5*8,  9*8, 13*8, m[SIGMA8[o +  2]], m[SIGMA8[o +  3]])
    va = v1;
    vb = v5;
    vc = v9;
    vd = v13;
    x = unchecked(m[SIGMA8[o + 2]]);
    y = unchecked(m[SIGMA8[o + 3]]);
    va += vb + x; vd = rotr(vd ^ va, 32);
    vc += vd;     vb = rotr(vb ^ vc, 24);
    va += vb + y; vd = rotr(vd ^ va, 16);
    vc += vd;     vb = rotr(vb ^ vc, 63);
    v1  = va;
    v5  = vb;
    v9  = vc;
    v13 = vd;

    // mix(vPtr, 2*8, 6*8, 10*8, 14*8, m[SIGMA8[o +  4]], m[SIGMA8[o +  5]])
    va = v2;
    vb = v6;
    vc = v10;
    vd = v14;
    x = unchecked(m[SIGMA8[o + 4]]);
    y = unchecked(m[SIGMA8[o + 5]]);
    va += vb + x; vd = rotr(vd ^ va, 32);
    vc += vd;     vb = rotr(vb ^ vc, 24);
    va += vb + y; vd = rotr(vd ^ va, 16);
    vc += vd;     vb = rotr(vb ^ vc, 63);
    v2  = va;
    v6  = vb;
    v10 = vc;
    v14 = vd;

    // mix(vPtr, 3*8, 7*8, 11*8, 15*8, m[SIGMA8[o +  6]], m[SIGMA8[o +  7]])
    va = v3;
    vb = v7;
    vc = v11;
    vd = v15;
    x = unchecked(m[SIGMA8[o + 6]]);
    y = unchecked(m[SIGMA8[o + 7]]);
    va += vb + x; vd = rotr(vd ^ va, 32);
    vc += vd;     vb = rotr(vb ^ vc, 24);
    va += vb + y; vd = rotr(vd ^ va, 16);
    vc += vd;     vb = rotr(vb ^ vc, 63);
    v3  = va;
    v7  = vb;
    v11 = vc;
    v15 = vd;

    // mix(vPtr, 0*8, 5*8, 10*8, 15*8, m[SIGMA8[o +  8]], m[SIGMA8[o +  9]])
    va = v0;
    vb = v5;
    vc = v10;
    vd = v15;
    x = unchecked(m[SIGMA8[o + 8]]);
    y = unchecked(m[SIGMA8[o + 9]]);
    va += vb + x; vd = rotr(vd ^ va, 32);
    vc += vd;     vb = rotr(vb ^ vc, 24);
    va += vb + y; vd = rotr(vd ^ va, 16);
    vc += vd;     vb = rotr(vb ^ vc, 63);
    v0  = va;
    v5  = vb;
    v10 = vc;
    v15 = vd;

    // mix(vPtr, 1*8, 6*8, 11*8, 12*8, m[SIGMA8[o + 10]], m[SIGMA8[o + 11]])
    va = v1;
    vb = v6;
    vc = v11;
    vd = v12;
    x = unchecked(m[SIGMA8[o + 10]]);
    y = unchecked(m[SIGMA8[o + 11]]);
    va += vb + x; vd = rotr(vd ^ va, 32);
    vc += vd;     vb = rotr(vb ^ vc, 24);
    va += vb + y; vd = rotr(vd ^ va, 16);
    vc += vd;     vb = rotr(vb ^ vc, 63);
    v1  = va;
    v6  = vb;
    v11 = vc;
    v12 = vd;

    // mix(vPtr, 2*8, 7*8,  8*8, 13*8, m[SIGMA8[o + 12]], m[SIGMA8[o + 13]])
    va = v2;
    vb = v7;
    vc = v8;
    vd = v13;
    x = unchecked(m[SIGMA8[o + 12]]);
    y = unchecked(m[SIGMA8[o + 13]]);
    va += vb + x; vd = rotr(vd ^ va, 32);
    vc += vd;     vb = rotr(vb ^ vc, 24);
    va += vb + y; vd = rotr(vd ^ va, 16);
    vc += vd;     vb = rotr(vb ^ vc, 63);
    v2  = va;
    v7  = vb;
    v8  = vc;
    v13 = vd;

    // mix(vPtr, 3*8, 4*8,  9*8, 14*8, m[SIGMA8[o + 14]], m[SIGMA8[o + 15]])
    va = v3;
    vb = v4;
    vc = v9;
    vd = v14;
    x = unchecked(m[SIGMA8[o + 14]]);
    y = unchecked(m[SIGMA8[o + 15]]);
    va += vb + x; vd = rotr(vd ^ va, 32);
    vc += vd;     vb = rotr(vb ^ vc, 24);
    va += vb + y; vd = rotr(vd ^ va, 16);
    vc += vd;     vb = rotr(vb ^ vc, 63);
    v3  = va;
    v4  = vb;
    v9  = vc;
    v14 = vd;
  }

  unchecked(h[0] ^= v0 ^  v8);
  unchecked(h[1] ^= v1 ^  v9);
  unchecked(h[2] ^= v2 ^ v10);
  unchecked(h[3] ^= v3 ^ v11);

  unchecked(h[4] ^= v4 ^ v12);
  unchecked(h[5] ^= v5 ^ v13);
  unchecked(h[6] ^= v6 ^ v14);
  unchecked(h[7] ^= v7 ^ v15);

  ctx.v0  = v0;
  ctx.v1  = v1;
  ctx.v2  = v2;
  ctx.v3  = v3;
  ctx.v4  = v4;
  ctx.v5  = v5;
  ctx.v6  = v6;
  ctx.v7  = v7;
  ctx.v8  = v8;
  ctx.v9  = v9;
  ctx.v10 = v10;
  ctx.v11 = v11;
  ctx.v12 = v12;
  ctx.v13 = v13;
  ctx.v14 = v14;
  ctx.v15 = v15;
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
