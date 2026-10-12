import { useState } from 'react';
import {
  IconBolt,
  IconCurrencyDollar,
  IconFileDescription,
  IconLoader2,
  IconQrcode,
  IconUser,
  IconClockHour4,
} from '@tabler/icons-react';
import { api, formatIDR } from '../lib/api';
import { useToast } from './Toast';

const PRESETS = [10000, 25000, 50000, 100000, 250000];

export default function CreatePaymentForm({ onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    amount: 25000,
    description: 'Pembayaran pesanan',
    customerName: '',
    validUpToMinutes: 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.createPayment({
        amount: Number(form.amount),
        description: form.description,
        customerName: form.customerName,
        validUpToMinutes: Number(form.validUpToMinutes),
      });
      toast('Payment created — QR is ready to scan.', 'success', 'Transaction created');
      onCreated?.(res.data);
      setForm((f) => ({ ...f, description: 'Pembayaran pesanan', customerName: '' }));
    } catch (err) {
      setError(err.message);
      toast(err.message, 'error', 'Could not create payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-5">
      {/* Form */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:col-span-3">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <IconCurrencyDollar size={16} className="text-slate-400" /> Amount (IDR)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              Rp
            </span>
            <input
              type="number"
              min="1"
              required
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-dana-400 focus:bg-white focus:ring-4 focus:ring-dana-100"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set('amount', p)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  Number(form.amount) === p
                    ? 'bg-dana-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {formatIDR(p)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <IconFileDescription size={16} className="text-slate-400" /> Description
          </label>
          <input
            type="text"
            maxLength={140}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="e.g. Kopi Susu Gula Aren x2"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-dana-400 focus:bg-white focus:ring-4 focus:ring-dana-100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <IconUser size={16} className="text-slate-400" /> Customer (optional)
            </label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => set('customerName', e.target.value)}
              placeholder="Customer name"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-dana-400 focus:bg-white focus:ring-4 focus:ring-dana-100"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <IconClockHour4 size={16} className="text-slate-400" /> Valid for (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="1440"
              value={form.validUpToMinutes}
              onChange={(e) => set('validUpToMinutes', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-dana-400 focus:bg-white focus:ring-4 focus:ring-dana-100"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-dana-600 to-accent-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-dana-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <IconLoader2 size={18} className="animate-spin" /> : <IconQrcode size={18} />}
          {loading ? 'Creating payment…' : 'Generate QRIS Payment'}
        </button>
      </div>

      {/* Live preview */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-card lg:col-span-2">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Preview
        </p>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <div className="mx-auto mb-3 grid h-28 w-28 place-items-center rounded-2xl bg-gradient-to-br from-dana-500 to-accent-500 text-white">
            <IconQrcode size={56} stroke={1.5} />
          </div>
          <p className="text-xs font-medium text-slate-400">Total payment</p>
          <p className="text-2xl font-bold text-slate-900">{formatIDR(form.amount)}</p>
          <p className="mt-1 line-clamp-1 text-sm text-slate-500">
            {form.description || 'No description'}
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <IconBolt size={14} className="text-dana-500" />
            Live QRIS · valid {form.validUpToMinutes} min
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">
          Scanning happens in the DANA app on a real sandbox integration.
        </p>
      </div>
    </form>
  );
}
