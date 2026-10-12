import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import paymentsRouter from './routes/payments.js';
import disbursementsRouter from './routes/disbursements.js';
import webhooksRouter from './routes/webhooks.js';
import { errorHandler, notFound } from './middlewares/error.js';
import { rawBodySaver } from './middlewares/rawBody.js';
import { store, usingDb } from './store/transactions.js';
import { initDb, isDbEnabled } from './db/sequelize.js';

const app = express();

// Behind a proxy/tunnel (ngrok, cloudflared) so rate-limit sees the real IP.
app.set('trust proxy', 1);

// ---- Security & parsing middleware ----
app.use(helmet({ contentSecurityPolicy: false })); // CSP off: we serve an API, not HTML
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(morgan('dev'));

// Rate limit the API (generous default; tighten via env in production).
const rateMax = Number(process.env.RATE_LIMIT_MAX);
const limiter = rateLimit({
  windowMs: 60_000,
  max: Number.isFinite(rateMax) && rateMax > 0 ? rateMax : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'RATE_LIMITED', message: 'Too many requests, slow down.' },
});
app.use('/api', limiter);

app.use(express.json({ verify: rawBodySaver }));
app.use(express.urlencoded({ extended: true }));

// ---- Routes ----
app.get('/', (_req, res) => {
  res.json({
    name: 'DANA Payment Experiment API',
    version: '1.2.0',
    mode: config.mockMode ? 'mock' : 'live',
    storage: usingDb() ? 'mysql' : 'memory',
    docs: '/api/webhooks/config',
    endpoints: {
      createPayment: 'POST /api/payments',
      listPayments: 'GET /api/payments',
      getPayment: 'GET /api/payments/:ref',
      paymentQr: 'GET /api/payments/:ref/qr.svg',
      queryPayment: 'POST /api/payments/:ref/query',
      cancelPayment: 'POST /api/payments/:ref/cancel',
      refundPayment: 'POST /api/payments/:ref/refund',
      simulatePayment: 'POST /api/payments/:ref/simulate',
      stats: 'GET /api/payments/stats',
      createDisbursement: 'POST /api/disbursements',
      bankInquiry: 'POST /api/disbursements/inquiry',
      webhook: 'POST /api/webhooks/dana',
      disburseWebhook: 'POST /api/webhooks/disburse',
      events: 'GET /api/events (SSE)',
    },
  });
});

app.use('/api/payments', paymentsRouter);
app.use('/api/disbursements', disbursementsRouter);
app.use('/api/webhooks', webhooksRouter);

// ---- Server-Sent Events: real-time transaction updates for the dashboard ----
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  const onCreated = (txn) => res.write(`event: created\ndata: ${JSON.stringify(txn)}\n\n`);
  const onUpdated = (txn) => res.write(`event: updated\ndata: ${JSON.stringify(txn)}\n\n`);

  store.on('transaction:created', onCreated);
  store.on('transaction:updated', onUpdated);

  const keepAlive = setInterval(() => res.write(': ping\n\n'), 25_000);

  req.on('close', () => {
    clearInterval(keepAlive);
    store.off('transaction:created', onCreated);
    store.off('transaction:updated', onUpdated);
    res.end();
  });
});

// ---- Fallbacks ----
app.use(notFound);
app.use(errorHandler);

// ---- Boot ----
export async function start() {
  if (isDbEnabled()) {
    try {
      await initDb();
      console.log('  ➜  Storage:  MySQL (Sequelize) connected');
    } catch (err) {
      console.error('  ✖  MySQL connection failed:', err.message);
      console.error('     Falling back to the in-memory store.');
      process.env.DB_ENABLED = 'false';
    }
  } else {
    console.log('  ➜  Storage:  in-memory (set DB_ENABLED=true for MySQL)');
  }

  const server = app.listen(config.port, () => {
    const mode = config.mockMode ? '🧪 MOCK MODE (no live DANA calls)' : '🌐 LIVE MODE (calling DANA)';
    console.log(`\n  DANA Payment Experiment API`);
    console.log(`  ➜  Local:   http://localhost:${config.port}`);
    console.log(`  ➜  Mode:    ${mode}`);
    console.log(`  ➜  CORS:    ${config.corsOrigin.join(', ')}`);
    console.log(`  ➜  DANA:    ${config.dana.baseUrl}\n`);
  });

  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return server;
}

// Auto-start only when run directly (not when imported by tests).
const isMain = process.argv[1] && process.argv[1].endsWith('server.js');
if (isMain) start();

export default app;
