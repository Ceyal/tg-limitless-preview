/**
 * Browser Web Crypto SHA-256 for storage bundle integrity (no external libs).
 * Canonical payload matches validator-core canonicalBundlePayload + Node CLI digest (hex uppercase).
 */
import { canonicalBundlePayload } from '../harnesses/storage_migration/validator-core.mjs';

export function webCryptoAvailable() {
  return typeof crypto !== 'undefined' && !!crypto.subtle;
}

export async function sha256HexUpperFromString(payload) {
  if (!webCryptoAvailable()) return '';
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(payload));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export async function sha256CanonicalBundle(bundle) {
  return sha256HexUpperFromString(canonicalBundlePayload(bundle));
}

/** Probe for capability panel — browser path uses async sha256CanonicalBundle only. */
/** Compare bundle integrity SHA to computed value. */
export function compareBundleIntegritySha(bundle, computedSha) {
  const provided = bundle?.integrity?.bundle_sha256;
  if (!webCryptoAvailable()) {
    return { status: 'UNAVAILABLE', provided: provided || null, computed: computedSha || null };
  }
  if (!provided || String(provided).trim() === '') {
    return { status: 'MISSING', provided: null, computed: computedSha || null };
  }
  if (!computedSha) {
    return { status: 'UNAVAILABLE', provided, computed: null };
  }
  const a = String(provided).trim().toUpperCase();
  const b = String(computedSha).trim().toUpperCase();
  return {
    status: a === b ? 'MATCH' : 'MISMATCH',
    provided: a,
    computed: b,
    blocksImport: a !== b,
  };
}

export function probeWebCryptoBundleSha() {
  if (!webCryptoAvailable()) {
    return { ok: false, reason: 'Web Crypto subtle unavailable' };
  }
  return {
    ok: true,
    method: 'canonicalJson_sorted_keys_utf8_sha256_hex_uppercase_async',
  };
}
