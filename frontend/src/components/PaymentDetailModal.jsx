import { useState } from 'react';
import {
  IconCircleCheck,
  IconClock,
  IconCopy,
  IconDownload,
  IconLoader2,
  IconRefresh,
  IconQrcode,
  IconBan,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import { api, formatIDR, formatDateTime } from '../lib/api';
import { useToast } from './Toast';

function Row({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span
        className={`max-w-[60%] break-all text-right text-xs text-slate-700 ${
          mono ? 'font-mono' : 'font-medium'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function PaymentDetailModal({ open, onClose, transaction, onUpdate }) {
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  const t = transaction;

  if (!t) return null;

  const copy = (text, label) => {
    if (!text) {
      toast('Nothing to copy yet.', 'error');
      return;
    }
    navigator.clipboard?.writeText(text);
    toast(`${label} copied to clipboard`, 'success');
  };

  const action = async (kind) => {
    setBusy(kind);
    try {
      let res;
      if (kind === 'query') res = await api.queryPayment(t.partnerReferenceNo);
      else if (kind === 'cancel') res = await api.cancelPayment(t.partnerReferenceNo);
      else if (kind === 'simulate-success')
        res = await api.simulatePayment(t.partnerReferenceNo, { status: 'SUCCESS', payerName: 'Test Payer' });
      else if (kind === 'simulate-failed')
        res = await api.simulatePayment(t.partnerReferenceNo, { status: 'FAILED' });
      else return;

      const updated = res?.data?.transaction || res?.data;
      if (updated) onUpdate?.(updated);
      if (kind === 'query') toast('Status refreshed from DANA.', 'info');
      else toast('Transaction updated.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const downloadQr = () => {
    const a = document.createElement('a');
    a.href = `/api/payments/${t.partnerReferenceNo}/qr.svg`;
    a.download = `dana-qr-${t.partnerReferenceNo}.svg`;
    a.click();
  };

  const isPending = t.status === 'PENDING';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={IconQrcode}
      title={t.description || 'DANA payment'}
      subtitle={formatIDR(t.amount?.value)}
      footer={
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => action('query')}
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {busy === 'query' ? <IconLoader2 size={16} className="animate-spin" /> : <IconRefresh size={16} />}
            Query Status
          </button>
          {isPending && (
            <button
              onClick={() => action('cancel')}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
            >
              {busy === 'cancel' ? <IconLoader2 size={16} className="animate-spin" /> : <IconBan size={16} />}
              Cancel
            </button>
          )}
        </div>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {/* QR */}
        <div className="flex flex-col items-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {t.qrImage ? (
              <img src={t.qrImage} alt="QRIS code" className="h-48 w-48" />
            ) : (
              <div className="grid h-48 w-48 place-items-center text-slate-300">
                <IconQrcode size={64} stroke={1.2} />
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => copy(t.qrContent, 'QR payload')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
            >
              <IconCopy size={14} /> Copy payload
            </button>
            <button
              onClick={downloadQr}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
            >
              <IconDownload size={14} /> SVG
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-medium text-slate-400">Status</span>
            <StatusBadge status={t.status} size="sm" />
          </div>
          <Row label="Reference No" value={t.partnerReferenceNo} mono />
          <Row label="DANA Ref No" value={t.danaReferenceNo || '—'} mono />
          <Row label="Amount" value={formatIDR(t.amount?.value)} />
          <Row label="Created" value={formatDateTime(t.createdAt)} />
          <Row label="Valid until" value={formatDateTime(t.validUntil)} />
          {t.payer && (
            <Row
              label="Payer"
              value={`${t.payer.name || 'Payer'} · ${t.payer.accountNo || ''}`}
            />
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Timeline</p>
        <ol className="space-y-2">
          {t.history?.map((h, i) => (
            <li key={i} className="flex items-center gap-3 text-xs">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full ${
                  h.status === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-600'
                    : h.status === 'FAILED' || h.status === 'CANCELLED'
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {h.status === 'SUCCESS' ? (
                  <IconCheck size={13} />
                ) : h.status === 'FAILED' || h.status === 'CANCELLED' ? (
                  <IconX size={13} />
                ) : (
                  <IconClock size={13} />
                )}
              </span>
              <span className="font-medium text-slate-600">{h.status}</span>
              <span className="text-slate-400">{h.note}</span>
              <span className="ml-auto text-slate-300">{formatDateTime(h.at)}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Experiment controls */}
      {isPending && (
        <div className="mt-5 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <IconCircleCheck size={14} /> Experiment controls (mock mode)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => action('simulate-success')}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy === 'simulate-success' ? <IconLoader2 size={14} className="animate-spin" /> : <IconCheck size={14} />}
              Mark as paid
            </button>
            <button
              onClick={() => action('simulate-failed')}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
            >
              {busy === 'simulate-failed' ? <IconLoader2 size={14} className="animate-spin" /> : <IconX size={14} />}
              Mark as failed
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
