import { IconCreditCard, IconCircleCheck, IconClock, IconCoins } from '@tabler/icons-react';
import { formatIDR } from '../lib/api';

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tint}`}>
        <Icon size={22} stroke={2} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate text-lg font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default function StatsGrid({ stats }) {
  const s = stats || { total: 0, byStatus: {}, successValue: 0 };
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={IconCreditCard} label="Total Transactions" value={s.total} tint="bg-dana-100 text-dana-600" />
      <StatCard
        icon={IconCircleCheck}
        label="Successful"
        value={s.byStatus?.SUCCESS || 0}
        tint="bg-emerald-100 text-emerald-600"
      />
      <StatCard
        icon={IconClock}
        label="Pending"
        value={s.byStatus?.PENDING || 0}
        tint="bg-amber-100 text-amber-600"
      />
      <StatCard
        icon={IconCoins}
        label="Collected"
        value={formatIDR(s.successValue)}
        tint="bg-violet-100 text-violet-600"
      />
    </div>
  );
}
