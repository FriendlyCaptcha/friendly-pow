/* eslint-disable @typescript-eslint/camelcase */

import * as b32 from "../src/blake2b/blake2b";
import * as b64 from "../src/blake2b/blake2b64";
import { fromHexString } from "./blake2b.test";

describe("blake2b 32 and 64 bit equivalence", () => {
  test("compress empty", () => {
    const ctxb32 = b32.blake2bInit(64, null);
    const ctxb64 = b64.blake2bInit(64, null);

    const ctxb64_v = [
      ctxb64.v0,
      ctxb64.v1,
      ctxb64.v2,
      ctxb64.v3,
      ctxb64.v4,
      ctxb64.v5,
      ctxb64.v6,
      ctxb64.v7,
    ];

    for (let i = 0; i < 8; i++) {
      // combine two u32 into one u64
      const h: u64 = ((ctxb32.h[i * 2 + 1] as u64) << 32) ^ (ctxb32.h[i * 2] as u64);
      const v: u64 = ((ctxb32.v[i * 2 + 1] as u64) << 32) ^ (ctxb32.v[i * 2] as u64);
      expect(h).toStrictEqual(ctxb64.h[i]);
      expect(v).toStrictEqual(ctxb64_v[i]);
    }

    for (let final = 0; final < 2; final++) {
      b32.blake2bCompress(ctxb32, final == 1);
      b64.blake2bCompress(ctxb64, final == 1, load<u32>(changetype<usize>(ctxb64.b)));

      const ctxb64_v = [
        ctxb64.v0,
        ctxb64.v1,
        ctxb64.v2,
        ctxb64.v3,
        ctxb64.v4,
        ctxb64.v5,
        ctxb64.v6,
        ctxb64.v7,
      ];

      for (let i = 0; i < 8; i++) {
        // combine two u32 into one u64
        const h: u64 = ((ctxb32.h[i * 2 + 1] as u64) << 32) ^ (ctxb32.h[i * 2] as u64);
        const v: u64 = ((ctxb32.v[i * 2 + 1] as u64) << 32) ^ (ctxb32.v[i * 2] as u64);
        const m: u64 = ((ctxb32.m[i * 2 + 1] as u64) << 32) ^ (ctxb32.m[i * 2] as u64);
        expect(h).toStrictEqual(ctxb64.h[i], "h" + final.toString());
        expect(v).toStrictEqual(ctxb64_v[i], "v" + final.toString());
        expect(m).toStrictEqual(ctxb64.m[i], "m" + final.toString());
      }
    }
  });
});

describe("blake64 implementation follows spec", () => {
  test("get blake2b spec hashes", () => {
    const expectedEmptyHash = fromHexString(
      "786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce"
    );
    expect(b64.blake2b(new Uint8Array(0))).toStrictEqual(expectedEmptyHash);

    const abc = new Uint8Array(3);
    abc.set([97, 98, 99]); //abc
    const expectedAbcHash = fromHexString(
      "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923"
    );
    expect(b64.blake2b(abc)).toStrictEqual(expectedAbcHash);
  });
});
