'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { REQUEST_STATUS, formatDateTime } from '@/lib/labels';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  Table,
  Textarea,
} from '@/components/ui';

function DynamicField({ field, value, onChange }) {
  const common = { value: value ?? '', onChange: (e) => onChange(e.target.value), required: field.required };
  switch (field.type) {
    case 'number':
      return <Input type="number" dir="ltr" {...common} />;
    case 'date':
      return <Input type="date" dir="ltr" {...common} />;
    case 'textarea':
      return <Textarea {...common} />;
    case 'select':
      return (
        <Select {...common}>
          <option value="">انتخاب کنید...</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      );
    default:
      return <Input {...common} />;
  }
}

/**
 * میز کار کارمند برای یک حوزه: مشاهده انواع فعال، ثبت درخواست و پیگیری/لغو.
 * scope: 'FINANCE' | 'HR'
 */
export default function RequestCenter({ scope, title, emptyTypesText }) {
  const [types, setTypes] = useState(null);
  const [mine, setMine] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeType, setActiveType] = useState(null);
  const [payload, setPayload] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [t, m] = await Promise.all([
      api(`/request-types?scope=${scope}`),
      api(`/requests/mine?scope=${scope}`),
    ]);
    setTypes(t.items.filter((x) => x.isActive));
    setMine(m.items);
  }, [scope]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const d = await api('/requests', {
        method: 'POST',
        body: { typeId: activeType._id || activeType.id, payload },
      });
      setSuccess(d.message);
      setActiveType(null);
      setPayload({});
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function cancel(request) {
    if (!window.confirm('این درخواست لغو شود؟')) return;
    setError('');
    try {
      await api(`/requests/${request._id || request.id}/cancel`, { method: 'PATCH' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      <Alert>{error}</Alert>
      <Alert tone="green">{success}</Alert>

      <Card title="موارد قابل ثبت">
        {!types ? (
          <Spinner />
        ) : types.length === 0 ? (
          <EmptyState text={emptyTypesText} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {types.map((t) => (
              <button
                key={t._id || t.id}
                className="rounded-xl border border-slate-200 bg-white p-4 text-right transition hover:border-indigo-400 hover:shadow-md"
                onClick={() => {
                  setActiveType(t);
                  setPayload({});
                  setError('');
                  setSuccess('');
                }}
              >
                <p className="font-medium text-slate-800">{t.name}</p>
                {t.description && <p className="mt-1 text-xs text-slate-500">{t.description}</p>}
                <p className="mt-3 text-xs font-medium text-indigo-600">ثبت درخواست ←</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card title="درخواست‌های من">
        {!mine ? (
          <Spinner />
        ) : mine.length === 0 ? (
          <EmptyState text="هنوز درخواستی ثبت نکرده‌اید" />
        ) : (
          <Table headers={['نوع', 'تاریخ ثبت', 'وضعیت', 'یادداشت بررسی', 'عملیات']}>
            {mine.map((r) => (
              <tr key={r._id || r.id} className="hover:bg-slate-50">
                <td className="px-3 py-2.5 font-medium">{r.typeName}</td>
                <td className="px-3 py-2.5 text-xs text-slate-500">{formatDateTime(r.createdAt)}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={REQUEST_STATUS[r.status]?.tone}>{REQUEST_STATUS[r.status]?.label}</Badge>
                </td>
                <td className="px-3 py-2.5 text-slate-500">{r.decisionNote || '—'}</td>
                <td className="px-3 py-2.5">
                  {['PENDING', 'PENDING_SENIOR'].includes(r.status) && (
                    <button className="text-xs text-rose-600 hover:underline" onClick={() => cancel(r)}>
                      لغو درخواست
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={Boolean(activeType)}
        onClose={() => setActiveType(null)}
        title={activeType ? `ثبت ${activeType.name}` : ''}
      >
        {activeType && (
          <form onSubmit={submit} className="space-y-4">
            {activeType.description && (
              <p className="text-sm text-slate-500">{activeType.description}</p>
            )}
            {activeType.fields.length === 0 && (
              <p className="text-sm text-slate-400">این مورد نیاز به اطلاعات اضافه ندارد.</p>
            )}
            {activeType.fields.map((f) => (
              <Field key={f.key} label={f.label} required={f.required}>
                <DynamicField
                  field={f}
                  value={payload[f.key]}
                  onChange={(v) => setPayload((p) => ({ ...p, [f.key]: v }))}
                />
              </Field>
            ))}
            <Alert>{error}</Alert>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'در حال ثبت...' : 'ثبت درخواست'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setActiveType(null)}>
                انصراف
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
