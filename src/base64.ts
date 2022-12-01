// Adapted from the base64-arraybuffer package implementation
// (https://github.com/niklasvh/base64-arraybuffer, MIT licensed)

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const EQ_CHAR = "=".charCodeAt(0);

// Use a lookup table to find the index.
const lookup = new Uint8Array(256);
for (let i = 0; i < CHARS.length; i++) {
  lookup[CHARS.charCodeAt(i)] = i;
}

export function encode(bytes: Uint8Array): string {
  const len = bytes.length;
  let base64 = "";

  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i + 0];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    // This temporary variable stops the NextJS 13 compiler from breaking this code in optimization.
    // See issue https://github.com/FriendlyCaptcha/friendly-challenge/issues/165
    let t = "";
    t += CHARS.charAt(b0 >>> 2);
    t += CHARS.charAt(((b0 & 3) << 4) | (b1 >>> 4));
    t += CHARS.charAt(((b1 & 15) << 2) | (b2 >>> 6));
    t += CHARS.charAt(b2 & 63);
    base64 += t;
  }

  if (len % 3 === 2) {
    base64 = base64.substring(0, base64.length - 1) + "=";
  } else if (len % 3 === 1) {
    base64 = base64.substring(0, base64.length - 2) + "==";
  }

  return base64;
}

export function decode(base64: string): Uint8Array {
  const len = base64.length;
  let bufferLength = (len * 3) >>> 2; // * 0.75

  if (base64.charCodeAt(len - 1) === EQ_CHAR) bufferLength--;
  if (base64.charCodeAt(len - 2) === EQ_CHAR) bufferLength--;

  const bytes = new Uint8Array(bufferLength);
  for (let i = 0, p = 0; i < len; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i + 0)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return bytes;
}
