#!/usr/bin/env node
/**
 * DANA connection self-test — `npm run dana:ping`
 *
 * Validates your local setup before you blame your integration:
 *   1. Reads configuration and prints a summary
 *   2. Checks that the private/public key files exist and are valid RSA keys
 *   3. Verifies the keys form a valid sign/verify pair (crypto round-trip)
 *   4. If not in mock mode: requests a real access token from DANA and reports
 *      precisely whether the credentials + signature were accepted
 *
 * Exit code 0 = all good, 1 = something needs fixing.
 */
import axios from 'axios';
import crypto from 'node:crypto';
import config from '../config/index.js';
import {
  buildSymmetricStringToSign,
  loadKey,
  signSymmetric,
  snapTimestamp,
} from '../utils/signature.js';

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const bad = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`);
const info = (m) => console.log(`  \x1b[90m·\x1b[0m ${m}`);

let failures = 0;

function section(title) {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
}

async function main() {
  console.log('\n\x1b[1mDANA connection self-test\x1b[0m');

  // ---------------------------------------------------------------- config ---
  section('Configuration');
  info(`base URL       : ${config.dana.baseUrl}`);
  info(`partner ID     : ${config.dana.partnerId}`);
  info(`client ID      : ${config.dana.clientId}`);
  info(`merchant ID    : ${config.dana.merchantId}`);
  info(`channel ID     : ${config.dana.channelId}`);
  info(`mode           : ${config.mockMode ? 'MOCK (offline)' : 'LIVE (calls DANA)'}`);

  const placeholders = [
    ['DANA_PARTNER_ID', config.dana.partnerId, 'YOUR_PARTNER_ID'],
    ['DANA_CLIENT_ID', config.dana.clientId, 'YOUR_CLIENT_ID'],
    ['DANA_MERCHANT_ID', config.dana.merchantId, 'YOUR_MERCHANT_ID'],
  ];
  for (const [name, value, ph] of placeholders) {
    if (value === ph) {
      warn(`${name} is still the placeholder value "${ph}"`);
      if (!config.mockMode) failures++;
    }
  }
  if (
    !config.dana.clientSecret ||
    config.dana.clientSecret === 'change_me_client_secret' ||
    config.dana.clientSecret === 'YOUR_CLIENT_SECRET'
  ) {
    warn('DANA_CLIENT_SECRET is not set (required for live mode)');
    if (!config.mockMode) failures++;
  }

  // ------------------------------------------------------------------ keys ---
  section('Keys');
  const privateKeyPem = loadKey(config.dana.privateKeyPath);
  const publicKeyPem = loadKey(config.dana.publicKeyPath);

  if (privateKeyPem) {
    ok(`Private key loaded (${config.dana.privateKeyPath})`);
    try {
      const k = crypto.createPrivateKey(privateKeyPem);
      ok(`Valid RSA private key (${k.asymmetricKeyDetails?.modulusLength || '?'} bits)`);
    } catch (e) {
      bad(`Private key is invalid: ${e.message}`);
      failures++;
    }
  } else {
    warn(`Private key not found at ${config.dana.privateKeyPath} (run: npm run keygen)`);
    if (!config.mockMode) failures++;
  }

  if (publicKeyPem) {
    ok(`Public key loaded (${config.dana.publicKeyPath})`);
    try {
      const k = crypto.createPublicKey(publicKeyPem);
      ok(`Valid RSA public key (${k.asymmetricKeyDetails?.modulusLength || '?'} bits)`);
    } catch (e) {
      bad(`Public key is invalid: ${e.message}`);
      failures++;
    }
  } else {
    warn(`Public key not found at ${config.dana.publicKeyPath} (needed to verify webhooks)`);
  }

  // Sign/verify round-trip proves the private key works end-to-end.
  if (privateKeyPem) {
    section('Signature round-trip');
    try {
      const message = `selftest-${Date.now()}`;
      const signature = crypto.createSign('RSA-SHA256').update(message).end().sign(privateKeyPem, 'base64');
      ok('Signed a test message with the private key');
      if (publicKeyPem) {
        const valid = crypto
          .createVerify('RSA-SHA256')
          .update(message)
          .end()
          .verify(publicKeyPem, signature, 'base64');
        if (valid) {
          ok('Public key verifies the signature (keys are a matching pair)');
        } else {
          warn('Public key does NOT verify the private key — these are not a matching pair');
          info('This is fine if the public key is DANA\'s key (for webhooks), not yours.');
        }
      }
    } catch (e) {
      bad(`Signature round-trip failed: ${e.message}`);
      failures++;
    }
  }

  // ------------------------------------------------------- live connectivity ---
  if (config.mockMode) {
    section('DANA connectivity');
    warn('Mock mode is ON — skipping the live access-token request.');
    info('Set DANA_MOCK_MODE=false to test against the DANA sandbox.');
  } else {
    section('DANA connectivity (live access-token request)');
    const timestamp = snapTimestamp();
    const stringToSign = buildSymmetricStringToSign(config.dana.clientId, timestamp);
    const signature = signSymmetric(stringToSign, config.dana.clientSecret);
    try {
      const res = await axios.post(
        `${config.dana.baseUrl}/authorization/v1/access-token/b2b`,
        { grantType: 'client_credentials' },
        {
          timeout: 15_000,
          headers: {
            'Content-Type': 'application/json',
            'X-CLIENT-KEY': config.dana.clientId,
            'X-TIMESTAMP': timestamp,
            'X-SIGNATURE': signature,
          },
        },
      );
      if (res.data?.accessToken) {
        ok(`Access token received (${String(res.data.accessToken).slice(0, 12)}…)`);
        info(`expiresIn: ${res.data.expiresIn || 'n/a'}s`);
        info('Your credentials + HMAC signature are correct. 🎉');
      } else {
        bad('DANA responded but no accessToken was returned');
        info(JSON.stringify(res.data));
        failures++;
      }
    } catch (e) {
      const status = e.response?.status;
      const data = e.response?.data;
      if (status) {
        bad(`DANA rejected the request (HTTP ${status})`);
        if (data?.responseMessage) info(`message: ${data.responseMessage}`);
        if (data?.responseCode) info(`code: ${data.responseCode}`);
        info(JSON.stringify(data));
        failures++;
      } else {
        bad(`Network error reaching DANA: ${e.message}`);
        info('Check your internet connection / DANA_BASE_URL / firewall.');
        failures++;
      }
    }
  }

  // ------------------------------------------------------------------ result ---
  console.log('');
  if (failures === 0) {
    console.log('\x1b[32m\x1b[1mAll checks passed.\x1b[0m\n');
    process.exit(0);
  } else {
    console.log(`\x1b[31m\x1b[1m${failures} check(s) need attention.\x1b[0m\n`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('\nUnexpected error during self-test:', e);
  process.exit(1);
});
