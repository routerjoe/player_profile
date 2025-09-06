import { randomBytes, createHash } from "crypto";

/**
 * Convert a Buffer to URL-safe base64 without padding.
 */
function base64url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * Generate a PKCE code_verifier.
 * RFC 7636 requires 43-128 characters. Using 64 random bytes yields an ~86 char base64url string.
 */
export function generateVerifier(byteLength = 64): string {
  if (byteLength < 32 || byteLength > 96) {
    // keep verifier length in a sane range to produce 43-128 chars
    throw new Error("byteLength must be between 32 and 96 to produce a valid PKCE verifier length.");
  }
  const bytes = randomBytes(byteLength);
  return base64url(bytes);
}

/**
 * Compute S256 code_challenge from a code_verifier.
 */
export function challengeFromVerifier(verifier: string): string {
  const hash = createHash("sha256").update(verifier).digest();
  return base64url(hash);
}

/**
 * Convenience to create a PKCE pair in one call.
 */
export function createPKCEPair(byteLength = 64): { verifier: string; challenge: string; method: "S256" } {
  const verifier = generateVerifier(byteLength);
  const challenge = challengeFromVerifier(verifier);
  return { verifier, challenge, method: "S256" as const };
}

/**
 * Validate a PKCE verifier against RFC 7636 allowed charset and length.
 * Allowed: ALPHA / DIGIT / "-" / "." / "_" / "~"
 */
export function isValidVerifier(verifier: string): boolean {
  if (verifier.length < 43 || verifier.length > 128) return false;
  return /^[A-Za-z0-9\-._~]+$/.test(verifier);
}

/**
 * Expose helpers for base64url encode/decode in case callers need them.
 */
export function toBase64Url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return base64url(buf);
}

export function fromBase64Url(b64url: string): Buffer {
  // Convert URL-safe base64 back to standard and restore padding
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, "base64");
}