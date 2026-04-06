/** Constant-time equality for two equal-length lowercase hex strings (e.g. SHA-256 hex). */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const len = a.length;
  if (len % 2 !== 0) return false;
  const ba = new Uint8Array(len / 2);
  const bb = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    ba[i / 2] = parseInt(a.slice(i, i + 2), 16);
    bb[i / 2] = parseInt(b.slice(i, i + 2), 16);
  }
  return crypto.subtle.timingSafeEqual(ba, bb);
}
