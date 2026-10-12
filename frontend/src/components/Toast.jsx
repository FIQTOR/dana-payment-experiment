import { createContext, useCallback, useContext, useState } from 'react';
import { IconCheck, IconAlertTriangle, IconInfoCircle, IconX } from '@tabler/icons-react';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

const VARIANTS = {
  success: { icon: IconCheck, cls: 'border-emerald-200 bg-white', iconCls: 'bg-emerald-100 text-emerald-600' },
  error: { icon: IconAlertTriangle, cls: 'border-rose-200 bg-white', iconCls: 'bg-rose-100 text-rose-600' },
  info: { icon: IconInfoCircle, cls: 'border-slate-200 bg-white', iconCls: 'bg-dana-100 text-dana-600' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, variant = 'info', title) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, variant, title }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const remove = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const v = VARIANTS[t.variant] || VARIANTS.info;
          const Icon = v.icon;
          return (
            <div
              key={t.id}
              className={`animate-fade-in-up pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-card ${v.cls}`}
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${v.iconCls}`}>
                <Icon size={18} stroke={2.2} />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                {t.title && <p className="text-sm font-semibold text-slate-800">{t.title}</p>}
                <p className="text-sm text-slate-600">{t.message}</p>
              </div>
              <button
                onClick={() => remove(t.id)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <IconX size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
