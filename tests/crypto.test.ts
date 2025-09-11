import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  encryptTokenToBytes,
  decryptTokenFromBytes,
  encryptTokenToBuffer,
  decryptTokenFromBuffer,
  encryptTokenToHex,
  decryptTokenFromHex,
  encryptTokenToBase64,
  decryptTokenFromBase64,
  bytesToHex,
  hexToBytes,
  bytesToBase64,
  base64ToBytes,
} from "@/lib/crypto";

describe("crypto secretbox helpers", () => {
  const OLD_ENV = process.env;
  beforeAll(() => {
    process.env = { ...OLD_ENV, APP_SECRET: "a-very-long-and-strong-secret-for-tests-1234567890" };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("round-trips UTF-8 string via bytes", async () => {
    const plain = "hello 🔐 secret text";
    const enc = await encryptTokenToBytes(plain);
    expect(enc.byteLength).toBeGreaterThan(16 + 24); // salt+nonce+cipher
    const dec = await decryptTokenFromBytes(enc);
    expect(dec).toBe(plain);
  });

  it("round-trips via Buffer helpers", async () => {
    const plain = "another secret";
    const buf = await encryptTokenToBuffer(plain);
    const dec = await decryptTokenFromBuffer(buf);
    expect(dec).toBe(plain);
  });

  it("round-trips via hex helpers", async () => {
    const plain = "hex encoding works";
    const hex = await encryptTokenToHex(plain);
    expect(typeof hex).toBe("string");
    const dec = await decryptTokenFromHex(hex);
    expect(dec).toBe(plain);
  });

  it("round-trips via base64 helpers", async () => {
    const plain = "base64 encoding works";
    const b64 = await encryptTokenToBase64(plain);
    expect(typeof b64).toBe("string");
    const dec = await decryptTokenFromBase64(b64);
    expect(dec).toBe(plain);
  });

  it("encoding helpers convert between formats", () => {
    const bytes = new Uint8Array([0, 1, 2, 254, 255]);
    const hex = bytesToHex(bytes);
    const backB = hexToBytes(hex);
    expect(Buffer.compare(Buffer.from(backB), Buffer.from(bytes))).toBe(0);

    const b64 = bytesToBase64(bytes);
    const backB2 = base64ToBytes(b64);
    expect(Buffer.compare(Buffer.from(backB2), Buffer.from(bytes))).toBe(0);
  });

  it("rejects invalid hex input length", () => {
    expect(() => hexToBytes("abc")).toThrow();
  });
});