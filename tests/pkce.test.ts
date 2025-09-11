import { describe, it, expect } from "vitest";
import {
  generateVerifier,
  challengeFromVerifier,
  isValidVerifier,
  createPKCEPair,
  toBase64Url,
  fromBase64Url,
} from "@/lib/pkce";

describe("pkce helpers", () => {
  it("generateVerifier() produces 43-128 chars URL-safe", () => {
    const v = generateVerifier();
    expect(v.length).toBeGreaterThanOrEqual(43);
    expect(v.length).toBeLessThanOrEqual(128);
    // base64url alphabet should be URL safe (no +,/ or =)
    expect(/^[A-Za-z0-9\-_]+$/.test(v)).toBe(true);
    // also matches our verifier charset rule
    expect(isValidVerifier(v)).toBe(true);
  });

  it("generateVerifier() rejects invalid byteLength", () => {
    expect(() => generateVerifier(16)).toThrow();
    expect(() => generateVerifier(100)).toThrow();
  });

  it("challengeFromVerifier() returns base64url without padding", () => {
    const v = generateVerifier();
    const c = challengeFromVerifier(v);
    expect(c.length).toBeGreaterThan(0);
    expect(c.includes("=")).toBe(false);
    expect(c.includes("+")).toBe(false);
    expect(c.includes("/")).toBe(false);
  });

  it("createPKCEPair() returns S256 and consistent challenge", () => {
    const pair = createPKCEPair();
    expect(pair.method).toBe("S256");
    expect(pair.challenge).toBe(challengeFromVerifier(pair.verifier));
    expect(isValidVerifier(pair.verifier)).toBe(true);
  });

  it("toBase64Url()/fromBase64Url round-trip for string", () => {
    const s = "hello world!";
    const b64u = toBase64Url(s);
    expect(b64u).toMatch(/^[A-Za-z0-9\-_]+$/);
    const buf = fromBase64Url(b64u);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.toString("utf8")).toBe(s);
  });

  it("toBase64Url()/fromBase64Url round-trip for Buffer", () => {
    const input = Buffer.from([0, 1, 2, 3, 254, 255]);
    const b64u = toBase64Url(input);
    const out = fromBase64Url(b64u);
    expect(Buffer.compare(Buffer.from(out), input)).toBe(0);
  });
});