import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * SNAP signature helpers.
 *
 * DANA Open API follows Bank Indonesia's SNAP (Standar Nasional Open API
 * Pembayaran) spec. Two kinds of signatures are used:
 *
 * 1. Asymmetric (SHA256withRSA) — for outbound business APIs and for the
 *    `Authorization: Bearer` access-token flow.
 *    The string to sign is built from a fixed component set:
 *
 *      HTTP_METHOD + ":" +
 *      RELATIVE_PATH + ":" +
 *      ACCESS_TOKEN + ":" +
 *      LOWERCASE(HEX(SHA256(MINIFIED_BODY))) + ":" +
 *      TIMESTAMP
 *
 * 2. Symmetric (HMAC-SHA512) — for (a) generating the Authorization header
 *    when calling `access-token/b2b`, and (b) validating inbound webhooks.
 *
 *      CLIENT_KEY + ":" + TIMESTAMP
 */

/** Load a PEM key from a filesystem path (relative paths resolve from cwd). */
export function loadKey(pemPath) {
  if (!pemPath) return null;
  const abs = path.isAbsolute(pemPath) ? pemPath : path.resolve(process.cwd(), pemPath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf8');
}

/** Minify a JSON body (SNAP requires no insignificant whitespace). */
export function minifyBody(body) {
  if (body === undefined || body === null) return '';
  if (typeof body === 'string') return body;
  return JSON.stringify(body);
}

/** SHA-256 digest of the request body, lowercased hex. */
export function hashBody(body) {
  const minified = minifyBody(body);
  return crypto.createHash('sha256').update(minified, 'utf8').digest('hex').toLowerCase();
}

/**
 * Build the SNAP "string to sign" for an asymmetric request signature.
 * @param {{method:string, path:string, token?:string, body?:any, timestamp:string}} p
 */
export function buildAsymmetricStringToSign({ method, path: relPath, token = '', body, timestamp }) {
  return [method.toUpperCase(), relPath, token, hashBody(body), timestamp].join(':');
}

/**
 * Sign the string with RSA-SHA256 using the merchant private key.
 * Returns base64 signature.
 */
export function signAsymmetric(stringToSign, privateKeyPem) {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(stringToSign, 'utf8');
  signer.end();
  return signer.sign(privateKeyPem, 'base64');
}

/** Verify an inbound/outbound RSA-SHA256 signature. */
export function verifyAsymmetric(stringToSign, signatureB64, publicKeyPem) {
  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(stringToSign, 'utf8');
    verifier.end();
    return verifier.verify(publicKeyPem, signatureB64, 'base64');
  } catch {
    return false;
  }
}

/**
 * Build the symmetric string to sign (for access-token/b2b Authorization and
 * webhook validation): CLIENT_KEY + ":" + TIMESTAMP.
 */
export function buildSymmetricStringToSign(clientKey, timestamp) {
  return `${clientKey}:${timestamp}`;
}

/** HMAC-SHA512 base64 signature (symmetric). */
export function signSymmetric(stringToSign, secret) {
  return crypto.createHmac('sha512', secret).update(stringToSign, 'utf8').digest('base64');
}

/** Current timestamp in SNAP format: ISO-8601 with +07:00 (Asia/Jakarta). */
export function snapTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  // Convert to Jakarta offset (+07:00)
  const utc = date.getTime() + date.getTimezoneOffset() * 60_000;
  const jakarta = new Date(utc + 7 * 60 * 60_000);
  const offset = '+07:00';
  return (
    `${jakarta.getFullYear()}-${pad(jakarta.getMonth() + 1)}-${pad(jakarta.getDate())}` +
    `T${pad(jakarta.getHours())}:${pad(jakarta.getMinutes())}:${pad(jakarta.getSeconds())}${offset}`
  );
}

/**
 * Snap timestamp `minutesFromNow` in the future, in SNAP format (+07:00).
 * Used for `validUpTo` fields so DANA receives a Jakarta-offset timestamp
 * rather than a UTC `Z` timestamp.
 */
export function snapTimestampFromNow(minutesFromNow = 0) {
  return snapTimestamp(new Date(Date.now() + minutesFromNow * 60_000));
}

/** Generate an RSA-2048 key pair in PEM (PKCS#8 private + SPKI public). */
export function generateKeyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { privateKey, publicKey };
}
