import { Router } from 'express';
import { handleDanaNotification } from '../controllers/webhookController.js';
import { loadKey } from '../utils/signature.js';
import config from '../config/index.js';

const router = Router();

/**
 * DANA payment notification endpoint.
 * Configure this URL in the DANA dashboard (e.g. https://your-host/api/webhooks/dana).
 */
router.post('/dana', handleDanaNotification);

/** Health/inspection endpoint to showcase the current payment configuration. */
router.get('/config', (_req, res) => {
  res.json({
    success: true,
    data: {
      env: config.env,
      mockMode: config.mockMode,
      baseUrl: config.dana.baseUrl,
      partnerId: config.dana.partnerId,
      clientId: config.dana.clientId,
      merchantId: config.dana.merchantId,
      storeId: config.dana.storeId,
      channelId: config.dana.channelId,
      notificationUrl: `${config.dana.publicBaseUrl}/api/webhooks/dana`,
      // Check the actual files exist, not just that a path is configured.
      hasPrivateKey: Boolean(loadKey(config.dana.privateKeyPath)),
      hasPublicKey: Boolean(loadKey(config.dana.publicKeyPath)),
      hasClientSecret: Boolean(config.dana.clientSecret && config.dana.clientSecret !== 'change_me_client_secret'),
    },
  });
});

export default router;
