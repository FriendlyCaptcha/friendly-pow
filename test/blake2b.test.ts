import {
  blake2b,
  B2B_G,
  blake2bInit,
  blake2bCompress,
  blake2bUpdate,
  B2B_GET32,
  ADD64AA,
  ADD64AC,
} from "../src/blake2b/blake2b";

export function fromHexString(s: string): Uint8Array {
  const bytes = new Uint8Array(Math.ceil((s.length as f64) / 2) as u32);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(s.substr(i * 2, 2), 16) as u32;
  return bytes;
}

describe("blake2b hashing", () => {
  test("get blake2b spec hashes", () => {
    const expectedEmptyHash = fromHexString(
      "786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce"
    );
    expect(blake2b(new Uint8Array(0))).toStrictEqual(expectedEmptyHash);

    const abc = new Uint8Array(3);
    abc.set([97, 98, 99]); //abc
    const expectedAbcHash = fromHexString(
      "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923"
    );
    expect(blake2b(abc)).toStrictEqual(expectedAbcHash);
  });

  test("get u32 from 4xu8", () => {
    const v = new Uint8Array(4);
    v[1] = 255;
    expect(B2B_GET32(v, 0)).toStrictEqual(65280);
  });

  test("64-bit unsigned addition within array", () => {
    const input = new Uint32Array(4);
    input.set([0xffffffff, 5, 1, 1]);
    ADD64AA(input, 0, 2);
    expect(input[0]).toStrictEqual(0);
    expect(input[1]).toStrictEqual(7);
  });

  test("64-bit unsigned addition scalar", () => {
    const input = new Uint32Array(4);
    input.set([0xffffffff, 5]);
    ADD64AC(input, 0, 2, 1);
    expect(input[0]).toStrictEqual(1);
    expect(input[1]).toStrictEqual(7);
  });

  // Note: All remaining tests here are not very insightful, they merely compare typescript vs webassembly build outputs.

  test("G mixing function", () => {
    const v = new Uint32Array(32);
    v.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    v.set([0, 2 ^ 32, 0, 123, 12345678, 5, 6, 7, 8, 9, 10, 11, 12, 13, 2 ^ 31, 2 ^ (32 - 1)]);
    const m = new Uint32Array(32);

    const a = 0;
    const b = 8;
    const c = 16;
    const d = 24;

    const ix = 2;
    const iy = 4;

    B2B_G(v, m, a, b, c, d, ix, iy);

    // Copy pasted from TS build
    expect(v.toString()).toStrictEqual(
      "264,9003,0,123,12345678,5,6,7,1178993238,38159888,10,11,12,13,29,29,589496363,19070984,0,0,0,0,0,0,589496320,19070976,0,0,0,0,0,0"
    );
  });

  test("init", () => {
    const ctx = blake2bInit(64, null);

    expect(ctx.b).toStrictEqual(new Uint8Array(128));
    expect(ctx.h[0]).toStrictEqual(4072524104);
    expect(ctx.h[1]).toStrictEqual(1779033703);
    expect(ctx.t).toStrictEqual(0);
    expect(ctx.c).toStrictEqual(0);
    expect(ctx.outlen).toStrictEqual(64);
    expect(ctx.v).toStrictEqual(new Uint32Array(32));
  });

  test("compress empty", () => {
    const ctx = blake2bInit(64, null);

    blake2bCompress(ctx, false);

    // Copy pasted from TS build
    const expectedV = new Uint32Array(32);
    expectedV.set([
      772608607, 2130132885, 2933656603, 980914306, 959117553, 4176783481, 1815619133, 1815570653,
      1821205348, 1568854325, 1456005267, 2693368475, 3725261559, 3408072416, 2935537161,
      3038017681, 2998450602, 3154653318, 3777044161, 3761885341, 3149654422, 1015042019,
      1559909578, 2433118349, 3370344048, 3464657500, 1094075388, 2013395361, 2772220844,
      3720830868, 462607019, 2884304071,
    ]);

    const expectedH = new Uint32Array(16);
    expectedH.set([
      1846043325, 2834753908, 3409425889, 1630138010, 2080762188, 4162458856, 1876902918,
      1484713322, 159956933, 3255761174, 1019268976, 1133321142, 2155346992, 157780191, 2786348507,
      1159612751,
    ]);

    expect(ctx.v).toStrictEqual(expectedV);
    expect(ctx.h).toStrictEqual(expectedH);
  });

  test("compress last", () => {
    const ctx = blake2bInit(64, null);

    blake2bCompress(ctx, true);

    // Copy pasted from TS build
    const expectedV = new Uint32Array(32);
    expectedV.set([
      4031842588, 4034117626, 1105205952, 716066648, 1266876956, 3531600776, 34974238, 3462341121,
      11388459, 130607887, 740867744, 4234459681, 744709436, 1079930893, 3345850578, 4003144585,
      4126059052, 2569230559, 1087863613, 3810243576, 4115715494, 2404800539, 1256856165,
      1917110476, 2623216168, 94263263, 1131568044, 751934526, 2353715911, 174776754, 3462655614,
      2073654638,
    ]);

    const expectedH = new Uint32Array(16);
    expectedH.set([
      4144130680, 56164674, 2248001222, 1926386213, 1078407057, 1632065761, 400721546, 424943607,
      823156434, 1398337199, 1147439379, 1269845651, 1533557392, 1438074900, 443576277, 3470957566,
    ]);
    expect(ctx.v).toStrictEqual(expectedV);
    expect(ctx.h).toStrictEqual(expectedH);
  });

  test("e2e tiny", () => {
    const input = new Uint8Array(2);
    input.set([0, 255]);
    const hash = blake2b(input);
    const expectedHash = new Uint8Array(64);
    expectedHash.set([
      208, 234, 198, 36, 197, 41, 127, 189, 143, 212, 21, 104, 255, 238, 57, 183, 87, 229, 220, 88,
      191, 158, 133, 39, 124, 102, 185, 51, 196, 84, 180, 135, 255, 102, 223, 33, 223, 120, 45, 71,
      70, 100, 87, 230, 202, 242, 2, 37, 28, 76, 47, 190, 177, 96, 125, 80, 74, 4, 51, 169, 18, 39,
      251, 243,
    ]);
    expect(hash).toStrictEqual(expectedHash);
  });

  test("update large", () => {
    const ctx = blake2bInit(64, null);
    const input = new Uint8Array(256);
    input.set([0, 1, 2, 3, 4, 5, 6, 7]);
    input[127] = 255;
    input[255] = 255;
    blake2bUpdate(ctx, input);

    const expectedV = new Uint32Array(32);
    expectedV.set([
      2391667886, 106264524, 3172067745, 843186038, 3916035669, 2460205062, 1049526093, 2769672167,
      2003188517, 1941229264, 2886399137, 3747394009, 1517203667, 3555690808, 747297094, 2723106018,
      1691437400, 1013408666, 1955360162, 4042312437, 1916695314, 3025236654, 3503036709,
      3339670097, 1952172470, 1302250944, 2883393958, 310728088, 2835175918, 2296442917, 2825290748,
      2102536207,
    ]);
    const expectedH = new Uint32Array(16);
    expectedH.set([
      417428670, 1346105905, 1297556280, 2044107526, 1707310444, 446448090, 2975813785, 3344265356,
      2933616706, 1864653167, 753500440, 1457294541, 164779094, 1150066870, 2542959555, 2231216628,
    ]);
    expect(ctx.v).toStrictEqual(expectedV);
    expect(ctx.h).toStrictEqual(expectedH);
  });
});
