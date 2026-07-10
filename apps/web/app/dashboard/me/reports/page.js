'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { REPORT_STATUS, formatDate } from '@/lib/labels';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Spinner,
  Table,
  Textarea,
} from '@/components/ui';

const today = () => new Date().toISOString().slice(0, 10);

export default function MyReportsPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ date: today(), title: '', content: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const d = await api('/reports/mine');
    setItems(d.items);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const d = await api('/reports', { method: 'POST', body: form });
      setSuccess(d.message);
      setForm({ date: today(), title: '', content: '' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">گزارش‌کار من</h1>

      <Card title="ثبت گزارش‌کار جدید">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="تاریخ گزارش" required>
              <Input type="date" dir="ltr" value={form.date} onChange={set('date')} required />
            </Field>
            <Field label="عنوان" required>
              <Input
                placeholder="مثلا: گزارش فعالیت‌های امروز"
                value={form.title}
                onChange={set('title')}
                required
              />
            </Field>
          </div>
          <Field label="شرح فعالیت‌ها" required>
            <Textarea rows={5} value={form.content} onChange={set('content')} required />
          </Field>
          <Alert>{error}</Alert>
          <Alert tone="green">{success}</Alert>
          <Button type="submit" disabled={saving}>
            {saving ? 'در حال ارسال...' : 'ارسال برای مدیر میانی'}
          </Button>
        </form>
      </Card>

      <Card title="گزارش‌های قبلی">
        {!items ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState text="هنوز گزارشی ثبت نکرده‌اید" />
        ) : (
          <Table headers={['تاریخ', 'عنوان', 'وضعیت', 'بازخورد مدیر']}>
            {items.map((r) => (
              <tr key={r._id || r.id} className="hover:bg-slate-50">
                <td className="px-3 py-2.5">{formatDate(r.date)}</td>
                <td className="px-3 py-2.5 font-medium">{r.title}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={REPORT_STATUS[r.status]?.tone}>{REPORT_STATUS[r.status]?.label}</Badge>
                </td>
                <td className="px-3 py-2.5 text-slate-500">{r.managerNote || '—'}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
