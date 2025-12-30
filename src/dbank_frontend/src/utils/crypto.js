// /src/dbank_frontend/src/utils/crypto.js
// Cryptographic Utility Functions
// Provides secure hashing (SHA-256) for PIN verification and data integrity.

export async function sha256Hex(text) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
