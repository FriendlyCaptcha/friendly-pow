(function () {
  'use strict';

  // Blake2B made assemblyscript compatible, adapted from (CC0 licensed): 
  // Blake2B in pure Javascript
  // Adapted from the reference implementation in RFC7693
  // Ported to Javascript by DC - https://github.com/dcposch
  // declare type u64 = number;
  // declare type i64 = number;
  // declare type u32 = number;
  class Context {
      constructor(outlen) {
          this.b = new Uint8Array(128);
          this.h = new Uint32Array(16);
          this.t = 0; // input count
          this.c = 0; // pointer within buffer
          this.v = new Uint32Array(32);
          this.m = new Uint32Array(32);
          this.outlen = outlen;
      }
  }
  // Little-endian byte access
  function B2B_GET32(arr, i) {
      return (arr[i] ^
          (arr[i + 1] << 8) ^
          (arr[i + 2] << 16) ^
          (arr[i + 3] << 24));
  }
  // G Mixing function with everything inlined
  // performance at the cost of readability, especially faster in old browsers
  function B2B_G_FAST(v, m, a, b, c, d, ix, iy) {
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
      let w0, ww, xor0, xor1;
      // ADD64AA(v, a, b); // v[a,a+1] += v[b,b+1] ... in JS we must store a uint64 as two uint32s
      // ADD64AA(v,a,b)
      w0 = (va0 + vb0);
      ww = ((va0 & vb0) | (va0 | vb0) & ~w0) >>> 31;
      va0 = w0;
      va1 = ((va1 + vb1 + ww) >>> 0);
      // // ADD64AC(v, a, x0, x1); // v[a, a+1] += x ... x0 is the low 32 bits of x, x1 is the high 32 bits
      w0 = (va0 + x0);
      ww = ((va0 & x0) | (va0 | x0) & ~w0) >>> 31;
      va0 = w0;
      va1 = ((va1 + x1 + ww) >>> 0);
      // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated to the right by 32 bits
      xor0 = vd0 ^ va0;
      xor1 = vd1 ^ va1;
      // We can just swap high and low here becaeuse its a shift by 32 bits
      vd0 = xor1;
      vd1 = xor0;
      // ADD64AA(v, c, d);
      w0 = (vc0 + vd0);
      ww = ((vc0 & vd0) | (vc0 | vd0) & ~w0) >>> 31;
      vc0 = w0;
      vc1 = ((vc1 + vd1 + ww) >>> 0);
      // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 24 bits
      xor0 = vb0 ^ vc0;
      xor1 = vb1 ^ vc1;
      vb0 = ((xor0 >>> 24) ^ (xor1 << 8));
      vb1 = ((xor1 >>> 24) ^ (xor0 << 8));
      // ADD64AA(v, a, b);
      w0 = (va0 + vb0);
      ww = ((va0 & vb0) | (va0 | vb0) & ~w0) >>> 31;
      va0 = w0;
      va1 = ((va1 + vb1 + ww) >>> 0);
      // ADD64AC(v, a, y0, y1);
      w0 = (va0 + y0);
      ww = ((va0 & y0) | (va0 | y0) & ~w0) >>> 31;
      va0 = w0;
      va1 = ((va1 + y1 + ww) >>> 0);
      // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated right by 16 bits
      xor0 = vd0 ^ va0;
      xor1 = vd1 ^ va1;
      vd0 = ((xor0 >>> 16) ^ (xor1 << 16));
      vd1 = ((xor1 >>> 16) ^ (xor0 << 16));
      // ADD64AA(v, c, d);
      w0 = (vc0 + vd0);
      ww = ((vc0 & vd0) | (vc0 | vd0) & ~w0) >>> 31;
      vc0 = w0;
      vc1 = ((vc1 + vd1 + ww) >>> 0);
      // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 63 bits
      xor0 = vb0 ^ vc0;
      xor1 = vb1 ^ vc1;
      vb0 = ((xor1 >>> 31) ^ ((xor0 << 1)));
      vb1 = ((xor0 >>> 31) ^ ((xor1 << 1)));
      v[a] = va0;
      v[a + 1] = va1;
      v[b] = vb0;
      v[b + 1] = vb1;
      v[c] = vc0;
      v[c + 1] = vc1;
      v[d] = vd0;
      v[d + 1] = vd1;
  }
  // Initialization Vector
  const BLAKE2B_IV32 = [
      0xF3BCC908, 0x6A09E667, 0x84CAA73B, 0xBB67AE85,
      0xFE94F82B, 0x3C6EF372, 0x5F1D36F1, 0xA54FF53A,
      0xADE682D1, 0x510E527F, 0x2B3E6C1F, 0x9B05688C,
      0xFB41BD6B, 0x1F83D9AB, 0x137E2179, 0x5BE0CD19
  ];
  // TODO format more nicely
  // Note these offsets have all been multiplied by two to make them offsets into
  // a uint32 buffer.
  const SIGMA82 = [
      0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22,
      24, 26, 28, 30, 28, 20, 8, 16, 18, 30, 26,
      12, 2, 24, 0, 4, 22, 14, 10, 6, 22, 16, 24,
      0, 10, 4, 30, 26, 20, 28, 6, 12, 14, 2, 18,
      8, 14, 18, 6, 2, 26, 24, 22, 28, 4, 12, 10,
      20, 8, 0, 30, 16, 18, 0, 10, 14, 4, 8, 20, 30,
      28, 2, 22, 24, 12, 16, 6, 26, 4, 24, 12, 20,
      0, 22, 16, 6, 8, 26, 14, 10, 30, 28, 2, 18, 24,
      10, 2, 30, 28, 26, 8, 20, 0, 14, 12, 6, 18, 4, 16,
      22, 26, 22, 14, 28, 24, 2, 6, 18, 10, 0, 30, 8, 16,
      12, 4, 20, 12, 30, 28, 18, 22, 6, 0, 16, 24, 4, 26, 14,
      2, 8, 20, 10, 20, 4, 16, 8, 14, 12, 2, 10, 30, 22, 18, 28,
      6, 24, 26, 0, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24,
      26, 28, 30, 28, 20, 8, 16, 18, 30, 26, 12, 2, 24, 0, 4, 22, 14, 10, 6
  ];
  // Compression function. 'last' flag indicates last block.
  function blake2bCompress(ctx, last) {
      const v = ctx.v;
      const m = ctx.m;
      // init work variables
      for (let i = 0; i < 16; i++) {
          v[i] = ctx.h[i];
          v[i + 16] = BLAKE2B_IV32[i];
      }
      // low 64 bits of offset
      v[24] = (v[24] ^ ctx.t);
      v[25] = (v[25] ^ (ctx.t / 0x100000000));
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
  /**
   * FRIENDLYCAPTCHA optimization only, does not reset ctx.t (global byte counter)
   * Assumes no key
   */
  function blake2bResetForShortMessage(ctx, input) {
      // Initialize State vector h with IV
      for (let i = 0; i < 16; i++) {
          ctx.h[i] = BLAKE2B_IV32[i];
      }
      // Danger: These operations and resetting are really only possible because our input is exactly 128 bytes
      ctx.b.set(input);
      // ctx.m.fill(0);
      // ctx.v.fill(0);
      ctx.h[0] ^= (0x01010000 ^ ctx.outlen);
  }

  // This is not an enum to save some bytes in the output bundle.
  const CHALLENGE_SIZE_BYTES = 128;

  const HASH_SIZE_BYTES = 32;
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
  function solveBlake2bEfficient(input, threshold, n) {
      if (input.length != CHALLENGE_SIZE_BYTES) {
          throw Error("Invalid input");
      }
      const buf = input.buffer;
      const view = new DataView(buf);
      const ctx = new Context(HASH_SIZE_BYTES);
      ctx.t = CHALLENGE_SIZE_BYTES;
      const start = view.getUint32(124, true);
      const end = start + n;
      for (let i = start; i < end; i++) {
          view.setUint32(124, i, true);
          blake2bResetForShortMessage(ctx, input);
          blake2bCompress(ctx, true);
          if ((ctx.h[0]) < threshold) {
              if (ASC_TARGET == 0) { // JS
                  return new Uint8Array(ctx.h.buffer);
              }
              //@ts-ignore
              return Uint8Array.wrap(ctx.h.buffer);
          }
      }
      return new Uint8Array(0);
  }

  async function getJSSolver() {
      return (puzzleBuffer, threshold, n = 4294967295) => {
          const hash = solveBlake2bEfficient(puzzleBuffer, threshold, n);
          return [puzzleBuffer, hash];
      };
  }

  function runBenchmark() {
      getJSSolver().then(async (solver) => {
          const buf = new Uint8Array(128);
          buf.set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 255, 230, 210, 255, 255, 255, 255]); // At least add a few non-zero values in buffer
          const start = new Date().getTime();
          console.time("total benchmark time");
          const N = 25000;
          let i = 0;
          const f = () => {
              const startStep = new Date().getTime();
              solver(new Uint8Array(128), 0, N);
              const timeElapsed = (new Date().getTime() - startStep) * 0.001;
              document.body.innerHTML += `<p>Hashrate ${(N / timeElapsed) / 1000} KH/s </p>`;
              i++;
              if (i < 20) {
                  setTimeout(() => f());
              }
              else {
                  console.timeEnd("total benchmark time");
                  console.log("Done");
              }
          };
          f();
      });
  }
  runBenchmark();

}());
