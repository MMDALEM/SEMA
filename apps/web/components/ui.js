'use client';

export function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:text-slate-300',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300',
    ghost: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-300',
  };
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={cx(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={cx(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
        className
      )}
      rows={3}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={cx(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({ label, required, children, hint }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="mr-1 text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <div className={cx('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

const badgeTones = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
};

export function Badge({ tone = 'slate', children }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1',
        badgeTones[tone] || badgeTones.slate
      )}
    >
      {children}
    </span>
  );
}

export function Alert({ tone = 'red', children }) {
  const tones = {
    red: 'border-rose-200 bg-rose-50 text-rose-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-sky-200 bg-sky-50 text-sky-700',
  };
  if (!children) return null;
  return <div className={cx('rounded-lg border px-4 py-3 text-sm', tones[tone])}>{children}</div>;
}

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div
        className={cx(
          'relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl',
          wide ? 'max-w-3xl' : 'max-w-lg'
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Table({ headers, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-right text-xs text-slate-500">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );
}

export function EmptyState({ text = 'موردی یافت نشد' }) {
  return <p className="py-10 text-center text-sm text-slate-400">{text}</p>;
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-sm">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        قبلی
      </Button>
      <span className="px-2 text-slate-500">
        صفحه {page.toLocaleString('fa-IR')} از {pages.toLocaleString('fa-IR')}
      </span>
      <Button variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        بعدی
      </Button>
    </div>
  );
}
