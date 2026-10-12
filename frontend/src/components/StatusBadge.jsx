import {
  IconCircleCheck,
  IconClock,
  IconCircleX,
  IconBan,
  IconHourglassHigh,
} from '@tabler/icons-react';

const MAP = {
  PENDING: {
    label: 'Pending',
    icon: IconClock,
    cls: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
  },
  SUCCESS: {
    label: 'Success',
    icon: IconCircleCheck,
    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  FAILED: {
    label: 'Failed',
    icon: IconCircleX,
    cls: 'bg-rose-50 text-rose-700 ring-rose-200',
    dot: 'bg-rose-500',
  },
  EXPIRED: {
    label: 'Expired',
    icon: IconHourglassHigh,
    cls: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: IconBan,
    cls: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
};

export default function StatusBadge({ status, size = 'md' }) {
  const cfg = MAP[status] || MAP.PENDING;
  const Icon = cfg.icon;
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${pad} ${cfg.cls}`}
    >
      <Icon size={iconSize} stroke={2.2} />
      {cfg.label}
    </span>
  );
}
