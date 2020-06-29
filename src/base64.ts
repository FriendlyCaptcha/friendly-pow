// Adapted from the base64-arraybuffer package implementation
// (https://github.com/niklasvh/base64-arraybuffer, MIT licensed)

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Use a lookup table to find the index.
const lookup = new Uint8Array(256);
for (let i = 0; i < CHARS.length; i++) {
  lookup[CHARS.charCodeAt(i)] = i;
}

export function encode(bytes: Uint8Array): string {
  const len = bytes.length;
  let base64 = "";

  for (let i = 0; i < len; i+=3) {
    base64 += CHARS[bytes[i] >> 2];
    base64 += CHARS[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    base64 += CHARS[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    base64 += CHARS[bytes[i + 2] & 63];
  }

  if ((len % 3) === 2) {
    base64 = base64.substring(0, base64.length - 1) + "=";
  } else if (len % 3 === 1) {
    base64 = base64.substring(0, base64.length - 2) + "==";
  }

  return base64;
}

export function decode(base64: string): Uint8Array {
  let bufferLength = base64.length * 0.75;
  const len = base64.length;

  if (base64[len - 1] === "=") bufferLength--;
  if (base64[len - 2] === "=") bufferLength--;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < len; i+=4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i+1)];
    const encoded3 = lookup[base64.charCodeAt(i+2)];
    const encoded4 = lookup[base64.charCodeAt(i+3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return bytes;
}
