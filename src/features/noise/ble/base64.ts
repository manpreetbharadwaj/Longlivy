/**
 * react-native-ble-plx hands back every characteristic value as a Base64
 * string. Hermes doesn't reliably guarantee a global `atob`/`Buffer` across
 * every RN version this app might run on, so this is a small
 * dependency-free decoder rather than an assumption about the runtime.
 */
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bitsCollected = 0;

  for (let i = 0; i < clean.length; i++) {
    const value = BASE64_CHARS.indexOf(clean[i]);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bitsCollected += 6;
    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      bytes.push((buffer >> bitsCollected) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

export function base64ToHex(base64: string): string {
  return bytesToHex(base64ToBytes(base64));
}

/** Encoder counterpart to base64ToBytes — needed to write characteristic values, not just read them. */
export function bytesToBase64(bytes: Uint8Array | number[]): string {
  let result = '';
  const arr = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  for (let i = 0; i < arr.length; i += 3) {
    const b0 = arr[i];
    const b1 = i + 1 < arr.length ? arr[i + 1] : undefined;
    const b2 = i + 2 < arr.length ? arr[i + 2] : undefined;

    result += BASE64_CHARS[b0 >> 2];
    result += BASE64_CHARS[((b0 & 0x03) << 4) | ((b1 ?? 0) >> 4)];
    result += b1 === undefined ? '=' : BASE64_CHARS[((b1 & 0x0f) << 2) | ((b2 ?? 0) >> 6)];
    result += b2 === undefined ? '=' : BASE64_CHARS[b2 & 0x3f];
  }
  return result;
}

/** Convenience for hardcoded verified command bytes, e.g. hexToBase64('ab0000060000000001006c000101'). */
export function hexToBase64(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytesToBase64(bytes);
}
