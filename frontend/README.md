# DANA Pay · Frontend

React 19 + Vite 8 + TailwindCSS v4 + Tabler Icons dashboard for the DANA
payment experiment.

```bash
npm install
npm run dev     # http://localhost:5173  (proxies /api → http://localhost:4000)
```

## Tabs

- **Dashboard** — live stats + recent transactions + quick-create form
- **Create Payment** — QRIS payment builder with live preview
- **Transactions** — filterable full list, opens a detail modal with QR,
  timeline, query/cancel, and mock-mode simulation controls
- **Webhook Tester** — copy the notification URL and POST sample DANA payloads

## Stack notes

- **Tailwind v4** is wired via `@tailwindcss/vite` (no `tailwind.config.js`);
  design tokens live in `src/index.css` under `@theme`.
- Real-time updates come from the backend's SSE stream via
  `src/hooks/useTransactionEvents.js`.

See the [root README](../README.md) for full setup and the backend docs.
