import { describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import {
  buildAsymmetricStringToSign,
  buildSymmetricStringToSign,
  generateKeyPair,
  hashBody,
  minifyBody,
  signAsymmetric,
  signSymmetric,
  snapTimestamp,
  snapTimestampFromNow,
  verifyAsymmetric,
} from '../src/utils/signature.js';

describe('signature utils', () => {
  const { privateKey, publicKey } = generateKeyPair();

  it('minifies JSON bodies without insignificant whitespace', () => {
    expect(minifyBody({ a: 1, b: 'x' })).toBe('{"a":1,"b":"x"}');
    expect(minifyBody('plain')).toBe('plain');
    expect(minifyBody(null)).toBe('');
  });

  it('hashes the body as lowercase hex sha256', () => {
    const expected = crypto.createHash('sha256').update('{"a":1}').digest('hex');
    expect(hashBody({ a: 1 })).toBe(expected);
    expect(hashBody({ a: 1 })).toMatch(/^[0-9a-f]{64}$/);
  });

  it('builds the SNAP asymmetric string-to-sign in the correct order', () => {
    const str = buildAsymmetricStringToSign({
      method: 'post',
      path: '/v1.0/qr/qr-mpm-generate',
      token: 'TOKEN',
      body: { a: 1 },
      timestamp: '2026-01-01T00:00:00+07:00',
    });
    // Timestamps contain colons, so assert on the prefix and suffix instead of
    // splitting into a fixed number of parts.
    const expectedPrefix = `POST:/v1.0/qr/qr-mpm-generate:TOKEN:${hashBody({ a: 1 })}:`;
    expect(str.startsWith(expectedPrefix)).toBe(true);
    expect(str.endsWith('2026-01-01T00:00:00+07:00')).toBe(true);
  });

  it('signs and verifies with a matching RSA keypair', () => {
    const msg = 'hello-snap';
    const sig = signAsymmetric(msg, privateKey);
    expect(verifyAsymmetric(msg, sig, publicKey)).toBe(true);
    expect(verifyAsymmetric('tampered', sig, publicKey)).toBe(false);
  });

  it('rejects an invalid signature without throwing', () => {
    expect(verifyAsymmetric('msg', 'not-base64!!', publicKey)).toBe(false);
  });

  it('builds the symmetric string-to-sign as CLIENT_KEY:TIMESTAMP', () => {
    expect(buildSymmetricStringToSign('CID', 'TS')).toBe('CID:TS');
  });

  it('produces an HMAC-SHA512 base64 signature', () => {
    const sig = signSymmetric('CID:TS', 'secret');
    const expected = crypto.createHmac('sha512', 'secret').update('CID:TS').digest('base64');
    expect(sig).toBe(expected);
  });

  it('formats SNAP timestamps with a +07:00 offset', () => {
    expect(snapTimestamp()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/);
    expect(snapTimestampFromNow(30)).toMatch(/\+07:00$/);
  });
});
