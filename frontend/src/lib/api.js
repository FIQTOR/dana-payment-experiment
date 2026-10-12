/**
 * Thin API client for the DANA Payment Experiment backend.
 * Vite proxies /api → http://localhost:4000 (see vite.config.js).
 */

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(json.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

export const api = {
  // Server + config introspection
  health: () => request('/payments/stats'),
  getConfig: () => request('/webhooks/config'),

  // Payments
  listPayments: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
    ).toString();
    return request(`/payments${qs ? `?${qs}` : ''}`);
  },
  getPayment: (ref) => request(`/payments/${ref}`),
  createPayment: (payload) =>
    request('/payments', { method: 'POST', body: JSON.stringify(payload) }),
  queryPayment: (ref) => request(`/payments/${ref}/query`, { method: 'POST' }),
  cancelPayment: (ref) => request(`/payments/${ref}/cancel`, { method: 'POST' }),
  refundPayment: (ref, payload = {}) =>
    request(`/payments/${ref}/refund`, { method: 'POST', body: JSON.stringify(payload) }),
  simulatePayment: (ref, payload) =>
    request(`/payments/${ref}/simulate`, { method: 'POST', body: JSON.stringify(payload) }),
  stats: () => request('/payments/stats'),

  // Public webhook URL helper
  webhookUrl: () => `${window.location.origin}/api/webhooks/dana`,
};

export function formatIDR(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
