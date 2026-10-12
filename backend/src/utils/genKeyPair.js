import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateKeyPair } from './signature.js';

/**
 * Generates an RSA-2048 key pair for SNAP request signing and writes it to
 * backend/certs/. Run with: `npm run gen-key`
 *
 * WARNING: This is for local experimentation only. In production, your private
 * key is provided by DANA during onboarding and must be stored in a secret
 * manager / HSM — never on disk in plaintext.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../../certs');

if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });

const { privateKey, publicKey } = generateKeyPair();

const privPath = path.join(certsDir, 'private_key.pem');
const pubPath = path.join(certsDir, 'public_key.pem');

fs.writeFileSync(privPath, privateKey, { mode: 0o600 });
fs.writeFileSync(pubPath, publicKey, { mode: 0o644 });

console.log('✔ Generated RSA-2048 key pair');
console.log('  Private key :', privPath);
console.log('  Public key  :', pubPath);
console.log('\nUpload the PUBLIC key to the DANA dashboard (Merchant > API Keys).');
console.log('Keep the PRIVATE key secret and point DANA_PRIVATE_KEY_PATH at it.');
