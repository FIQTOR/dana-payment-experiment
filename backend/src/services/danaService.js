import axios from 'axios';
import crypto from 'node:crypto';
import { nanoid } from 'nanoid';
import config from '../config/index.js';
import {
  buildSymmetricStringToSign,
  loadKey,
  minifyBody,
  signAsymmetric,
  signSymmetric,
  snapTimestamp,
  snapTimestampFromNow,
} from '../utils/signature.js';

/**
 * DANA Business API service.
 *
 * Wraps the DANA Open API (SNAP-compliant). When config.mockMode is true all
 * calls are simulated locally so you can experiment with the full payment flow
 * (create → QR → poll → webhook) without live sandbox credentials.
 *
 * Real endpoints (sandbox: https://api-sandbox.dana.id, prod: https://api.dana.id):
 *   POST /authorization/v1/access-token/b2b            → get B2B access token
 *   POST /v1.0/qr/qr-mpm-generate                      → create QRIS (MPM)
 *   POST /v1.0/qr/qr-mpm-query                         → query QR transaction status
 *   POST /v1.0/qr/qr-mpm-cancel                        → cancel QR transaction
 *   (legacy/e-wallet) /v1.0/debit/payment-host-to-host → H2H debit
 *   POST /v1.0/emoney/account-inquiry                  → balance inquiry
 */
class DanaService {
  constructor() {
    this.client = axios.create({
      baseURL: config.dana.baseUrl,
      timeout: 15_000,
      headers: { 'Content-Type': 'application/json' },
    });
    this._accessToken = null;
    this._accessTokenExpiry = 0;
  }

  // ---------------------------------------------------------------- auth ---

  /**
   * Obtain a B2B access token. Uses HMAC-SHA512 Authorization header with
   * string-to-sign = CLIENT_KEY + ":" + TIMESTAMP.
   */
  async getAccessToken() {
    if (config.mockMode) {
      return { accessToken: `mock-token-${nanoid(24)}`, expiresIn: 900 };
    }
    const now = Date.now();
    if (this._accessToken && now < this._accessTokenExpiry) {
      return { accessToken: this._accessToken, expiresIn: Math.floor((this._accessTokenExpiry - now) / 1000) };
    }

    const timestamp = snapTimestamp();
    const stringToSign = buildSymmetricStringToSign(config.dana.clientId, timestamp);
    const signature = signSymmetric(stringToSign, config.dana.clientSecret);

    const { data } = await this.client.post(
      '/authorization/v1/access-token/b2b',
      { grantType: 'client_credentials' },
      {
        headers: {
          'X-CLIENT-KEY': config.dana.clientId,
          'X-TIMESTAMP': timestamp,
          'X-SIGNATURE': signature,
        },
      },
    );

    this._accessToken = data.accessToken;
    // refresh 60s before expiry
    this._accessTokenExpiry = now + (data.expiresIn || 900) * 1000 - 60_000;
    return data;
  }

  /**
   * Build the SNAP headers AND the exact minified body string that was signed.
   * Returning the body string guarantees the bytes we sign are the exact bytes
   * we transmit (avoiding any serializer mismatch that would break the signature).
   */
  buildSignedRequest(method, relPath, body, token) {
    const timestamp = snapTimestamp();
    const dataString = minifyBody(body);
    const privateKey = loadKey(config.dana.privateKeyPath);
    // Sign using the same minified body string that we will send.
    const stringToSign = [
      method.toUpperCase(),
      relPath,
      token || '',
      crypto.createHash('sha256').update(dataString, 'utf8').digest('hex').toLowerCase(),
      timestamp,
    ].join(':');
    const signature = privateKey ? signAsymmetric(stringToSign, privateKey) : 'MOCK_SIGNATURE';

    const headers = {
      'X-PARTNER-ID': config.dana.partnerId,
      'X-EXTERNAL-ID': nanoid(20),
      'X-TIMESTAMP': timestamp,
      'X-SIGNATURE': signature,
      'CHANNEL-ID': config.dana.channelId,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    return { headers, dataString };
  }

  // ------------------------------------------------------------- QRIS MPM ---

  /**
   * Create a QRIS MPM transaction.
   * @param {{partnerReferenceNo:string, merchantRefNo?:string, amount:{value:number,currency?:string}, description?:string, validUpToMinutes?:number}} input
   */
  async createQrisTransaction(input) {
    const relPath = '/v1.0/qr/qr-mpm-generate';
    const body = {
      partnerReferenceNo: input.partnerReferenceNo,
      merchantId: config.dana.merchantId,
      storeId: config.dana.storeId,
      terminalId: config.dana.terminalId,
      amount: {
        value: Number(input.amount.value).toFixed(2),
        currency: input.amount.currency || 'IDR',
      },
      additionalInfo: {
        description: input.description || 'DANA payment',
      },
      validUpTo: snapTimestampFromNow(input.validUpToMinutes || 30),
    };

    if (config.mockMode) return this._mockGenerate(body);

    const { accessToken } = await this.getAccessToken();
    const { headers, dataString } = this.buildSignedRequest('POST', relPath, body, accessToken);
    const { data } = await this.client.post(relPath, dataString, { headers });
    return data;
  }

  /** Query QRIS MPM transaction status. */
  async queryQrisTransaction(partnerReferenceNo, originalReferenceNo) {
    const relPath = '/v1.0/qr/qr-mpm-query';
    const body = {
      partnerReferenceNo,
      originalReferenceNo,
      merchantId: config.dana.merchantId,
    };

    if (config.mockMode) {
      return { responseCode: '2004700', responseMessage: 'Successful', ...body };
    }

    const { accessToken } = await this.getAccessToken();
    const { headers, dataString } = this.buildSignedRequest('POST', relPath, body, accessToken);
    const { data } = await this.client.post(relPath, dataString, { headers });
    return data;
  }

  /** Cancel a QRIS MPM transaction. */
  async cancelQrisTransaction(partnerReferenceNo, originalReferenceNo) {
    const relPath = '/v1.0/qr/qr-mpm-cancel';
    const body = {
      partnerReferenceNo,
      originalReferenceNo,
      merchantId: config.dana.merchantId,
      reason: 'Merchant cancelled',
    };

    if (config.mockMode) {
      return { responseCode: '2005400', responseMessage: 'Successful' };
    }

    const { accessToken } = await this.getAccessToken();
    const { headers, dataString } = this.buildSignedRequest('POST', relPath, body, accessToken);
    const { data } = await this.client.post(relPath, dataString, { headers });
    return data;
  }

  // ------------------------------------------------------------------ mock ---

  _mockGenerate(body) {
    const ref = body.partnerReferenceNo;
    // A realistic-looking QRIS payload string (EMVCo). Not a real QR.
    const qrContent =
      '00020101021226610014ID.CO.QRIS.WWW0118' +
      ref.slice(0, 16).padEnd(16, '0') +
      '0215ID' +
      config.dana.merchantId.slice(0, 12).padEnd(12, '0') +
      '5204581453033605802ID5910DANA STORE6007JAKARTA6304ABCD';
    return {
      responseCode: '2004700',
      responseMessage: 'Successful',
      referenceNo: nanoid(16).toUpperCase(),
      partnerReferenceNo: ref,
      qrContent,
      qrUrl: `https://sandbox.dana.id/qr/${ref}`,
      validUpTo: body.validUpTo,
      additionalInfo: { description: body.additionalInfo?.description },
    };
  }
}

export const danaService = new DanaService();

/**
 * Map a DANA transaction status string (from a query/webhook response) to our
 * internal status. Returns null when the status is unknown/absent.
 */
export function mapDanaStatus(raw) {
  if (!raw) return null;
  const s = String(raw).toUpperCase();
  const map = {
    SUCCESS: 'SUCCESS',
    SUCCESSFUL: 'SUCCESS',
    PAID: 'SUCCESS',
    SUCCEEDED: 'SUCCESS',
    FAILED: 'FAILED',
    FAILURE: 'FAILED',
    DENIED: 'FAILED',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED',
    CANCELED: 'CANCELLED',
    PENDING: 'PENDING',
    INITIATED: 'PENDING',
    PROCESSING: 'PENDING',
  };
  return map[s] || null;
}

export default danaService;
