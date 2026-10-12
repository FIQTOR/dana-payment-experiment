import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config/index.js';
import paymentsRouter from './routes/payments.js';
import webhooksRouter from './routes/webhooks.js';
import { errorHandler, notFound } from './middlewares/error.js';
import { rawBodySaver } from './middlewares/rawBody.js';
import { store } from './store/transactions.js';

const app = express();

// ---- Global middleware ----
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(morgan('dev'));
app.use(express.json({ verify: rawBodySaver }));
app.use(express.urlencoded({ extended: true }));

// ---- Routes ----
app.get('/', (_req, res) => {
  res.json({
    name: 'DANA Payment Experiment API',
    version: '1.0.0',
    mode: config.mockMode ? 'mock' : 'live',
    docs: '/api/webhooks/config',
    endpoints: {
      createPayment: 'POST /api/payments',
      listPayments: 'GET /api/payments',
      getPayment: 'GET /api/payments/:ref',
      paymentQr: 'GET /api/payments/:ref/qr.svg',
      queryPayment: 'POST /api/payments/:ref/query',
      cancelPayment: 'POST /api/payments/:ref/cancel',
      simulatePayment: 'POST /api/payments/:ref/simulate',
      stats: 'GET /api/payments/stats',
      webhook: 'POST /api/webhooks/dana',
      events: 'GET /api/events (SSE)',
    },
  });
});

app.use('/api/payments', paymentsRouter);
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

export default app;
