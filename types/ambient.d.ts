// Ambient module declarations for libraries without bundled types in this project.

// libsodium-wrappers minimal surface used by src/lib/crypto.ts
declare module 'libsodium-wrappers' {
  interface Sodium {
    // readiness
    ready: Promise<void>;

    // constants
    crypto_secretbox_MACBYTES: number;
    crypto_pwhash_OPSLIMIT_MODERATE: number;
    crypto_pwhash_MEMLIMIT_MODERATE: number;
    crypto_pwhash_ALG_DEFAULT: number;

    // randomness
    randombytes_buf(len: number): Uint8Array;

    // key derivation
    crypto_pwhash(
      outLen: number,
      password: string,
      salt: Uint8Array,
      opslimit: number,
      memlimit: number,
      alg: number
    ): Uint8Array;

    // secretbox
    crypto_secretbox_easy(msg: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
    crypto_secretbox_open_easy(cipher: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array | null;

    // encoding helpers
    from_string(s: string): Uint8Array;
    to_string(arr: Uint8Array): string;
  }
  const sodium: Sodium;
  export default sodium;
}

// MSW ambient fallbacks to satisfy TS module resolution in tests
declare module 'msw' {
  export const http: any;
  export const HttpResponse: any;
}

declare module 'msw/node' {
  export function setupServer(...handlers: any[]): any;
}