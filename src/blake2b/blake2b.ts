// Blake2B made assemblyscript compatible, adapted from (CC0 licensed):
// Blake2B in pure Javascript
// Adapted from the reference implementation in RFC7693
// Ported to Javascript by DC - https://github.com/dcposch

export class Context {
  b: Uint8Array = new Uint8Array(128);
  h: Uint32Array = new Uint32Array(16);
  t: u64 = 0; // input count
  c: u32 = 0; // pointer within buffer
  outlen: u32;
  v: Uint32Array = new Uint32Array(32);
  m: Uint32Array = new Uint32Array(32);

  constructor(outlen: u32) {
    this.outlen = outlen;
  }
}

// 64-bit unsigned addition
// Sets v[a,a+1] += v[b,b+1]
// v should be a Uint32Array
export function ADD64AA(v: Uint32Array, a: u32, b: u32): void {
  // Faster in Chrome..
  const a0 = v[a];
  const a1 = v[a + 1];
  const b0 = v[b];
  const b1 = v[b + 1];

  const c0 = (a0 + b0) >>> 0;
  const c = ((a0 & b0) | ((a0 | b0) & ~c0)) >>> 31;

  v[a] = c0 as u32;
  v[a + 1] = ((a1 + b1 + c) >>> 0) as u32;

  // Alternative, faster in Firefox..
  //   const o0: u64 = (v[a] as u64) + (v[b] as u64);
  //   let o1: u64 = (v[a + 1] as u64) + (v[b + 1] as u64);
  //   if (o0 >= 0x100000000) {
  //     o1++;
  //   }
  //   v[a] = o0 as u32;
  //   v[a + 1] = o1 as u32;
}

// 64-bit unsigned addition
// Sets v[a,a+1] += b
// b0 is the low 32 bits of b, b1 represents the high 32 bits
export function ADD64AC(v: Uint32Array, a: u32, b0: i64, b1: i64): void {
  // Faster in Chrome..
  const a0 = v[a];
  const a1 = v[a + 1];

  const c0 = (a0 + b0) >>> 0;
  const c = ((a0 & b0) | ((a0 | b0) & ~c0)) >>> 31;
  v[a] = c0 as u32;
  v[a + 1] = ((a1 + b1 + c) >>> 0) as u32;

  // Alternative, faster in Firefox..
  // let o0: i64 = (v[a] as i64) + b0;
  // if (b0 < 0) {
  //   o0 += 0x100000000;
  // }
  // let o1: i64 = v[a + 1] + b1;
  // if (o0 >= 0x100000000) {
  //   o1++;
  // }
  // v[a] = o0 as u32;
  // v[a + 1] = o1 as u32;
}

// Little-endian byte access
export function B2B_GET32(arr: Uint8Array, i: u32): u32 {
  return (
    (arr[i] as u32) ^
    ((arr[i + 1] as u32) << 8) ^
    ((arr[i + 2] as u32) << 16) ^
    ((arr[i + 3] as u32) << 24)
  );
}

// G Mixing function with everything inlined
// performance at the cost of readability, especially faster in old browsers
export function B2B_G_FAST(
  v: Uint32Array,
  m: Uint32Array,
  a: u32,
  b: u32,
  c: u32,
  d: u32,
  ix: u32,
  iy: u32
): void {
  const x0 = m[ix];
  const x1 = m[ix + 1];
  const y0 = m[iy];
  const y1 = m[iy + 1];

  // va0 are the low bits, va1 are the high bits
  let va0 = v[a];
  let va1 = v[a + 1];
  let vb0 = v[b];
  let vb1 = v[b + 1];
  let vc0 = v[c];
  let vc1 = v[c + 1];
  let vd0 = v[d];
  let vd1 = v[d + 1];

  let w0: u32, ww: u32, xor0: u32, xor1: u32;

  // ADD64AA(v, a, b); // v[a,a+1] += v[b,b+1] ... in JS we must store a uint64 as two uint32s
  // ADD64AA(v,a,b)
  w0 = va0 + vb0;
  ww = ((va0 & vb0) | ((va0 | vb0) & ~w0)) >>> 31;
  va0 = w0 as u32;
  va1 = (va1 + vb1 + ww) as u32;

  // // ADD64AC(v, a, x0, x1); // v[a, a+1] += x ... x0 is the low 32 bits of x, x1 is the high 32 bits
  w0 = va0 + x0;
  ww = ((va0 & x0) | ((va0 | x0) & ~w0)) >>> 31;
  va0 = w0 as u32;
  va1 = (va1 + x1 + ww) as u32;

  // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated to the right by 32 bits
  xor0 = vd0 ^ va0;
  xor1 = vd1 ^ va1;
  // We can just swap high and low here becaeuse its a shift by 32 bits
  vd0 = xor1 as u32;
  vd1 = xor0 as u32;

  // ADD64AA(v, c, d);
  w0 = vc0 + vd0;
  ww = ((vc0 & vd0) | ((vc0 | vd0) & ~w0)) >>> 31;
  vc0 = w0 as u32;
  vc1 = (vc1 + vd1 + ww) as u32;

  // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 24 bits
  xor0 = vb0 ^ vc0;
  xor1 = vb1 ^ vc1;
  vb0 = (xor0 >>> 24) ^ (xor1 << 8);
  vb1 = (xor1 >>> 24) ^ (xor0 << 8);

  // ADD64AA(v, a, b);
  w0 = va0 + vb0;
  ww = ((va0 & vb0) | ((va0 | vb0) & ~w0)) >>> 31;
  va0 = w0 as u32;
  va1 = (va1 + vb1 + ww) as u32;

  // ADD64AC(v, a, y0, y1);
  w0 = va0 + y0;
  ww = ((va0 & y0) | ((va0 | y0) & ~w0)) >>> 31;
  va0 = w0 as u32;
  va1 = (va1 + y1 + ww) as u32;

  // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated right by 16 bits
  xor0 = vd0 ^ va0;
  xor1 = vd1 ^ va1;
  vd0 = (xor0 >>> 16) ^ (xor1 << 16);
  vd1 = (xor1 >>> 16) ^ (xor0 << 16);

  // ADD64AA(v, c, d);
  w0 = vc0 + vd0;
  ww = ((vc0 & vd0) | ((vc0 | vd0) & ~w0)) >>> 31;
  vc0 = w0 as u32;
  vc1 = (vc1 + vd1 + ww) as u32;

  // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 63 bits
  xor0 = vb0 ^ vc0;
  xor1 = vb1 ^ vc1;
  vb0 = ((((xor1 as u64) >>> 31) as u64) ^ ((xor0 << 1) as u64)) as u32;
  vb1 = ((((xor0 as u64) >>> 31) as u64) ^ ((xor1 << 1) as u64)) as u32;

  v[a] = va0;
  v[a + 1] = va1;
  v[b] = vb0;
  v[b + 1] = vb1;
  v[c] = vc0;
  v[c + 1] = vc1;
  v[d] = vd0;
  v[d + 1] = vd1;
}

// G Mixing function
// The ROTRs are inlined for speed
export function B2B_G(
  v: Uint32Array,
  m: Uint32Array,
  a: u32,
  b: u32,
  c: u32,
  d: u32,
  ix: u32,
  iy: u32
): void {
  const x0 = m[ix];
  const x1 = m[ix + 1];
  const y0 = m[iy];
  const y1 = m[iy + 1];

  ADD64AA(v, a, b); // v[a,a+1] += v[b,b+1] ... in JS we must store a uint64 as two uint32s
  ADD64AC(v, a, x0, x1); // v[a, a+1] += x ... x0 is the low 32 bits of x, x1 is the high 32 bits

  // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated to the right by 32 bits
  let xor0: u32 = v[d] ^ v[a];
  let xor1: u32 = v[d + 1] ^ v[a + 1];
  v[d] = xor1 as u32;
  v[d + 1] = xor0 as u32;

  ADD64AA(v, c, d);

  // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 24 bits
  xor0 = v[b] ^ v[c];
  xor1 = v[b + 1] ^ v[c + 1];
  v[b] = (xor0 >>> 24) ^ (xor1 << 8);
  v[b + 1] = (xor1 >>> 24) ^ (xor0 << 8);

  ADD64AA(v, a, b);
  ADD64AC(v, a, y0, y1);

  // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated right by 16 bits
  xor0 = v[d] ^ v[a];
  xor1 = v[d + 1] ^ v[a + 1];
  v[d] = (xor0 >>> 16) ^ (xor1 << 16);
  v[d + 1] = (xor1 >>> 16) ^ (xor0 << 16);

  ADD64AA(v, c, d);

  // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 63 bits
  xor0 = v[b] ^ v[c];
  xor1 = v[b + 1] ^ v[c + 1];
  v[b] = ((((xor1 as u64) >>> 31) as u64) ^ ((xor0 << 1) as u64)) as u32;
  v[b + 1] = ((((xor0 as u64) >>> 31) as u64) ^ ((xor1 << 1) as u64)) as u32;
}

// Initialization Vector
const BLAKE2B_IV32: u32[] = [
  0xf3bcc908, 0x6a09e667, 0x84caa73b, 0xbb67ae85, 0xfe94f82b, 0x3c6ef372, 0x5f1d36f1, 0xa54ff53a,
  0xade682d1, 0x510e527f, 0x2b3e6c1f, 0x9b05688c, 0xfb41bd6b, 0x1f83d9ab, 0x137e2179, 0x5be0cd19,
];

// Note these offsets have all been multiplied by two to make them offsets into
// a uint32 buffer.
const SIGMA82: u8[] = [
  0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 28, 20, 8, 16, 18, 30, 26, 12, 2, 24,
  0, 4, 22, 14, 10, 6, 22, 16, 24, 0, 10, 4, 30, 26, 20, 28, 6, 12, 14, 2, 18, 8, 14, 18, 6, 2, 26,
  24, 22, 28, 4, 12, 10, 20, 8, 0, 30, 16, 18, 0, 10, 14, 4, 8, 20, 30, 28, 2, 22, 24, 12, 16, 6,
  26, 4, 24, 12, 20, 0, 22, 16, 6, 8, 26, 14, 10, 30, 28, 2, 18, 24, 10, 2, 30, 28, 26, 8, 20, 0,
  14, 12, 6, 18, 4, 16, 22, 26, 22, 14, 28, 24, 2, 6, 18, 10, 0, 30, 8, 16, 12, 4, 20, 12, 30, 28,
  18, 22, 6, 0, 16, 24, 4, 26, 14, 2, 8, 20, 10, 20, 4, 16, 8, 14, 12, 2, 10, 30, 22, 18, 28, 6, 24,
  26, 0, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 28, 20, 8, 16, 18, 30, 26, 12,
  2, 24, 0, 4, 22, 14, 10, 6,
];

// Compression function. 'last' flag indicates last block.
export function blake2bCompress(ctx: Context, last: bool): void {
  const v = ctx.v;
  const m = ctx.m;

  // init work variables
  for (let i = 0; i < 16; i++) {
    v[i] = ctx.h[i];
    v[i + 16] = BLAKE2B_IV32[i];
  }

  // low 64 bits of offset
  v[24] = ((v[24] as u64) ^ ctx.t) as u32;
  v[25] = ((v[25] as u64) ^ ((ctx.t as u64) / 0x100000000)) as u32;
  // high 64 bits not supported, offset may not be higher than 2**53-1

  // last block flag set ?
  if (last) {
    v[28] = ~v[28];
    v[29] = ~v[29];
  }

  // get little-endian words
  for (let i = 0; i < 32; i++) {
    m[i] = B2B_GET32(ctx.b, 4 * i);
  }

  // twelve rounds of mixing
  for (let i = 0; i < 12; i++) {
    B2B_G_FAST(v, m, 0, 8, 16, 24, SIGMA82[i * 16 + 0], SIGMA82[i * 16 + 1]);
    B2B_G_FAST(v, m, 2, 10, 18, 26, SIGMA82[i * 16 + 2], SIGMA82[i * 16 + 3]);
    B2B_G_FAST(v, m, 4, 12, 20, 28, SIGMA82[i * 16 + 4], SIGMA82[i * 16 + 5]);
    B2B_G_FAST(v, m, 6, 14, 22, 30, SIGMA82[i * 16 + 6], SIGMA82[i * 16 + 7]);
    B2B_G_FAST(v, m, 0, 10, 20, 30, SIGMA82[i * 16 + 8], SIGMA82[i * 16 + 9]);
    B2B_G_FAST(v, m, 2, 12, 22, 24, SIGMA82[i * 16 + 10], SIGMA82[i * 16 + 11]);
    B2B_G_FAST(v, m, 4, 14, 16, 26, SIGMA82[i * 16 + 12], SIGMA82[i * 16 + 13]);
    B2B_G_FAST(v, m, 6, 8, 18, 28, SIGMA82[i * 16 + 14], SIGMA82[i * 16 + 15]);
  }

  for (let i = 0; i < 16; i++) {
    ctx.h[i] = ctx.h[i] ^ v[i] ^ v[i + 16];
  }
}

// Creates a BLAKE2b hashing context
// Requires an output length between 1 and 64 bytes
// Takes an optional Uint8Array key
export function blake2bInit(outlen: u32, key: Uint8Array | null): Context {
  if (outlen === 0 || outlen > 64) {
    throw new Error("Illegal output length, expected 0 < length <= 64");
  }
  if (key !== null && key.length > 64) {
    throw new Error("Illegal key, expected Uint8Array with 0 < length <= 64");
  }

  // state, 'param block'
  const ctx = new Context(outlen);

  // initialize hash state
  for (let i = 0; i < 16; i++) {
    ctx.h[i] = BLAKE2B_IV32[i];
  }
  const keylen: u64 = key !== null ? key.length : 0;
  ctx.h[0] ^= (0x01010000 ^ ((keylen as u64) << 8) ^ (outlen as u64)) as u32;

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
  for (let i = 0; i < input.length; i++) {
    if (ctx.c === 128) {
      // buffer full ?
      ctx.t += ctx.c; // add counters
      blake2bCompress(ctx, false); // compress (not last)
      ctx.c = 0; // counter to zero
    }
    ctx.b[ctx.c++] = input[i];
  }
}

// Completes a BLAKE2b streaming hash
// Returns a Uint8Array containing the message digest
function blake2bFinal(ctx: Context): Uint8Array {
  ctx.t += ctx.c; // mark last block offset

  while (ctx.c < 128) {
    // fill up with zeros
    ctx.b[ctx.c++] = 0;
  }
  blake2bCompress(ctx, true); // final block flag = 1
  // little endian convert and store
  const out = new Uint8Array(ctx.outlen);
  for (let i: u8 = 0; i < ctx.outlen; i++) {
    out[i] = ctx.h[i >> 2] >> (8 * (i & 3));
  }
  return out;
}

// Computes the BLAKE2B hash of a string or byte array, and returns a Uint8Array
//
// Returns a n-byte Uint8Array
//
// Parameters:
// - input - the input bytes, as a string, Buffer or Uint8Array
// - key - optional key Uint8Array, up to 64 bytes
// - outlen - optional output length in bytes, default 64
export function blake2b(
  input: Uint8Array,
  key: Uint8Array | null = null,
  outlen: u32 = 64
): Uint8Array {
  // do the math
  const ctx = blake2bInit(outlen, key);
  blake2bUpdate(ctx, input);
  return blake2bFinal(ctx);
}

/**
 * FRIENDLY CAPTCHA optimization only, does not reset ctx.t (global byte counter)
 * Assumes no key
 */
export function blake2bResetForShortMessage(ctx: Context, input: Uint8Array): void {
  // Initialize State vector h with IV
  for (let i = 0; i < 16; i++) {
    ctx.h[i] = BLAKE2B_IV32[i];
  }

  // Danger: These operations and resetting are really only possible because our input is exactly 128 bytes
  ctx.b.set(input);
  // ctx.m.fill(0);
  // ctx.v.fill(0);

  ctx.h[0] ^= 0x01010000 ^ (ctx.outlen as u32);
}
