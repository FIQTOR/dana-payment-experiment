import 'dotenv/config';

/**
 * Centralised, typed-ish configuration loader for the DANA payment backend.
 * All values come from environment variables (see backend/.env.example).
 */
const num = (v) => (v !== undefined && v !== '' ? Number(v) : undefined);

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: num(process.env.PORT) || 4000,
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  dana: {
    partnerId: process.env.DANA_PARTNER_ID || 'YOUR_PARTNER_ID',
    clientId: process.env.DANA_CLIENT_ID || 'YOUR_CLIENT_ID',
    // Client secret used to sign the access-token request (HMAC-SHA512).
    clientSecret: process.env.DANA_CLIENT_SECRET || process.env.DANA_WEBHOOK_SECRET || 'change_me_client_secret',
    baseUrl: process.env.DANA_BASE_URL || 'https://api-sandbox.dana.id',
    merchantId: process.env.DANA_MERCHANT_ID || 'YOUR_MERCHANT_ID',
    storeId: process.env.DANA_STORE_ID || 'YOUR_STORE_ID',
    terminalId: process.env.DANA_TERMINAL_ID || 'TERMINAL-01',
    privateKeyPath: process.env.DANA_PRIVATE_KEY_PATH,
    publicKeyPath: process.env.DANA_PUBLIC_KEY_PATH,
    webhookSecret: process.env.DANA_WEBHOOK_SECRET || 'change_me_webhook_secret',
    publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:4000',
    // CHANNEL-ID sent to DANA (varies per integration; 95221 is a placeholder).
    channelId: process.env.DANA_CHANNEL_ID || '95221',
  },

  // Local simulation mode — do not hit the network.
  mockMode: String(process.env.DANA_MOCK_MODE || 'true').toLowerCase() === 'true',
};

export default config;
