import { IconInbox, IconQrcode } from '@tabler/icons-react';
import { formatIDR, formatDateTime } from '../lib/api';
import StatusBadge from './StatusBadge';

export default function TransactionList({ transactions, onOpen, filter, onFilter, loading }) {
  const filters = ['ALL', 'PENDING', 'SUCCESS', 'REFUNDED', 'FAILED', 'CANCELLED'];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Transactions
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {transactions.length}
          </span>
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => onFilter(f)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition ${
                filter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
            <IconInbox size={24} />
          </span>
          <p className="text-sm font-medium text-slate-600">No transactions yet</p>
          <p className="max-w-xs text-xs text-slate-400">
            Create a payment from the “Create Payment” tab to see it appear here in real time.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {transactions.map((t) => (
            <li key={t.partnerReferenceNo}>
              <button
                onClick={() => onOpen(t)}
                className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
                  <IconQrcode size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {t.description || 'DANA payment'}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {t.partnerReferenceNo} · {formatDateTime(t.createdAt)}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-bold text-slate-900">{formatIDR(t.amount?.value)}</p>
                  <p className="text-xs text-slate-400">{t.payer?.accountNo || '—'}</p>
                </div>
                <StatusBadge status={t.status} size="sm" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
