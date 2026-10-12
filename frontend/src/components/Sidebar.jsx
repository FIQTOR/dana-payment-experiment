import {
  IconLayoutDashboard,
  IconPlus,
  IconListDetails,
  IconPlugConnected,
  IconBrandGithub,
  IconSpeakerphone,
} from '@tabler/icons-react';
import danaLogo from '../assets/dana-logo.svg';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { id: 'create', label: 'Create Payment', icon: IconPlus },
  { id: 'transactions', label: 'Transactions', icon: IconListDetails },
  { id: 'webhook', label: 'Webhook Tester', icon: IconSpeakerphone },
];

export default function Sidebar({ active, onChange, connected }) {
  return (
    <aside className="flex h-full w-full flex-col gap-2 border-slate-200 bg-white p-4 lg:w-64 lg:border-r">
      {/* Brand */}
      <div className="mb-2 flex flex-col gap-2 px-2 py-2">
        <img src={danaLogo} alt="DANA" className="h-7 w-auto" />
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900">Experiment Lab</p>
          <p className="text-xs text-slate-500">DANA Business API</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-dana-50 text-dana-700 ring-1 ring-inset ring-dana-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={19} stroke={2} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-2 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? 'live-dot bg-emerald-500' : 'bg-slate-300'
            }`}
          />
          <span className="font-medium text-slate-600">
            {connected ? 'Live stream connected' : 'Stream offline'}
          </span>
        </div>
        <a
          href="https://dashboard.dana.id/api-docs-v2/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
        >
          <IconPlugConnected size={15} />
          DANA API Docs
        </a>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
        >
          <IconBrandGithub size={15} />
          Source
        </a>
      </div>
    </aside>
  );
}
