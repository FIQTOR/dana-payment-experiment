import { useState } from 'react';
import {
  IconBuildingBank,
  IconSend,
  IconLoader2,
  IconSearch,
  IconUserCheck,
  IconCash,
  IconHash,
  IconUser,
  IconNote,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { api, formatIDR } from '../lib/api';
import { useToast } from './Toast';

const BANKS = [
  { code: 'BCA', name: 'BCA' },
  { code: 'BNI', name: 'BNI' },
  { code: 'BRI', name: 'BRI' },
  { code: 'MANDIRI', name: 'Mandiri' },
  { code: 'CIMB', name: 'CIMB Niaga' },
  { code: 'PERMATA', name: 'Permata' },
  { code: 'DANAMON', name: 'Danamon' },
];

const emptyForm = {
  bankCode: 'BCA',
  bankAccountNo: '',
  beneficiaryName: '',
  amount: 50000,
  remark: '',
};

export default function DisbursementForm() {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [inquiry, setInquiry] = useState(null); // { accountName } | null
  const [inspecting, setInspecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    // Changing bank/account invalidates a previous account-name lookup.
    if (k === 'bankCode' || k === 'bankAccountNo') setInquiry(null);
  };

  const canInquire = form.bankCode && form.bankAccountNo.length >= 4;

  const checkAccount = async () => {
    if (!canInquire) return;
    setInspecting(true);
    setError(null);
    try {
      const res = await api.inquiryBank({ bankCode: form.bankCode, bankAccountNo: form.bankAccountNo });
      setInquiry({ accountName: res.data.accountName });
      setForm((f) => ({ ...f, beneficiaryName: f.beneficiaryName || res.data.accountName }));
      toast(`Account found: ${res.data.accountName}`, 'success');
    } catch (err) {
      setInquiry(null);
      setError(err.message);
      toast(err.message, 'error', 'Inquiry failed');
    } finally {
      setInspecting(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await api.createDisbursement({
        bankCode: form.bankCode,
        bankAccountNo: form.bankAccountNo,
        beneficiaryName: form.beneficiaryName,
        amount: Number(form.amount),
        remark: form.remark || undefined,
      });
      setResult(res.data);
      toast('Disbursement submitted.', 'success', 'Transfer created');
      setForm((f) => ({ ...emptyForm, bankCode: f.bankCode }));
      setInquiry(null);
    } catch (err) {
      setError(err.message);
      toast(err.message, 'error', 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-dana-400 focus:bg-white focus:ring-4 focus:ring-dana-100';

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      {/* Form */}
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:col-span-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-dana-100 text-dana-600">
            <IconBuildingBank size={20} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Transfer to bank</h3>
            <p className="text-xs text-slate-500">Disburse funds to a bank account via DANA</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <IconBuildingBank size={16} className="text-slate-400" /> Bank
            </label>
            <select value={form.bankCode} onChange={(e) => set('bankCode', e.target.value)} className={inputCls}>
              {BANKS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <IconHash size={16} className="text-slate-400" /> Account number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                required
                minLength={4}
                value={form.bankAccountNo}
                onChange={(e) => set('bankAccountNo', e.target.value.replace(/\D/g, ''))}
                placeholder="1234567890"
                className={inputCls}
              />
              <button
                type="button"
                onClick={checkAccount}
                disabled={!canInquire || inspecting}
                title="Check account name"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {inspecting ? <IconLoader2 size={16} className="animate-spin" /> : <IconSearch size={16} />}
              </button>
            </div>
          </div>
        </div>

        {inquiry && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <IconUserCheck size={16} /> {inquiry.accountName}
          </div>
        )}

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <IconUser size={16} className="text-slate-400" /> Beneficiary name
          </label>
          <input
            type="text"
            required
            maxLength={64}
            value={form.beneficiaryName}
            onChange={(e) => set('beneficiaryName', e.target.value)}
            placeholder="Account holder name"
            className={inputCls}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <IconCash size={16} className="text-slate-400" /> Amount (IDR)
            </label>
            <input
              type="number"
              min="1"
              required
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <IconNote size={16} className="text-slate-400" /> Remark (optional)
            </label>
            <input
              type="text"
              maxLength={140}
              value={form.remark}
              onChange={(e) => set('remark', e.target.value)}
              placeholder="e.g. supplier payout"
              className={inputCls}
            />
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
            <IconAlertCircle size={16} /> {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-dana-600 to-accent-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <IconLoader2 size={18} className="animate-spin" /> : <IconSend size={18} />}
          {loading ? 'Submitting transfer…' : `Transfer ${formatIDR(form.amount)}`}
        </button>
      </form>

      {/* Result / help */}
      <div className="space-y-4 lg:col-span-2">
        {result ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-card">
            <div className="mb-3 flex items-center gap-2 text-emerald-700">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100">
                <IconCheck size={18} />
              </span>
              <p className="text-sm font-semibold">Transfer submitted</p>
            </div>
            <dl className="space-y-2 text-xs">
              {[
                ['Reference', result.partnerReferenceNo],
                ['DANA ref', result.danaReferenceNo || '—'],
                ['Bank', `${result.bankCode} · ${result.bankAccountNo}`],
                ['Beneficiary', result.beneficiaryName],
                ['Amount', formatIDR(result.amount?.value)],
                ['Status', result.status],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4">
                  <dt className="text-slate-400">{k}</dt>
                  <dd className="max-w-[60%] break-all text-right font-medium text-slate-700">{v}</dd>
                </div>
              ))}
            </dl>
            {result.mockMode && (
              <p className="mt-3 text-[11px] text-emerald-600">Simulated (mock mode) — no real funds moved.</p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-card">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">How it works</h3>
            <ol className="space-y-3 text-xs text-slate-500">
              <li className="flex gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-slate-100 font-semibold text-slate-500">1</span>
                Check the account name (optional) to avoid typos.
              </li>
              <li className="flex gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-slate-100 font-semibold text-slate-500">2</span>
                Fill in the beneficiary and amount.
              </li>
              <li className="flex gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-slate-100 font-semibold text-slate-500">3</span>
                Submit — DANA processes the transfer and notifies via webhook.
              </li>
            </ol>
            <div className="mt-4 rounded-xl bg-slate-900 p-3">
              <p className="mb-1 text-[11px] font-medium text-slate-400">Disbursement notify URL</p>
              <code className="block truncate text-xs text-emerald-300">{api.webhookUrl().replace('/dana', '/disburse')}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
