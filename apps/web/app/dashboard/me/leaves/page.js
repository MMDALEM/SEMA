'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LEAVE_STATUS, LEAVE_TYPE_LABELS, formatDate } from '@/lib/labels';
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

const EMPTY_FORM = {
  leaveType: 'DAILY',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  reason: '',
};

function toInputDate(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export default function MyLeavesPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const d = await api('/leaves/mine');
    setItems(d.items);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function openEdit(leave) {
    setEditing(leave);
    setForm({
      leaveType: leave.leaveType,
      startDate: toInputDate(leave.startDate),
      endDate: toInputDate(leave.endDate),
      startTime: leave.startTime || '',
      endTime: leave.endTime || '',
      reason: leave.reason || '',
    });
    setError('');
    setModalOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api(`/leaves/${editing._id || editing.id}`, { method: 'PATCH', body: form });
      } else {
        await api('/leaves', { method: 'POST', body: form });
      }
      setModalOpen(false);
      setSuccess(editing ? 'درخواست ویرایش شد' : 'درخواست مرخصی ثبت شد');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function cancel(leave) {
    if (!window.confirm('این درخواست مرخصی لغو شود؟')) return;
    setError('');
    try {
      await api(`/leaves/${leave._id || leave.id}/cancel`, { method: 'PATCH' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const editable = (status) => ['PENDING_MANAGER', 'PENDING_SENIOR', 'PENDING_HR'].includes(status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">مرخصی‌های من</h1>
        <Button onClick={openCreate}>+ درخواست مرخصی</Button>
      </div>

      <Alert>{error}</Alert>
      <Alert tone="green">{success}</Alert>

      <Card>
        {!items ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState text="هنوز درخواست مرخصی ثبت نکرده‌اید" />
        ) : (
          <Table
            headers={['نوع', 'از تاریخ', 'تا تاریخ', 'وضعیت', 'نظر مدیر میانی', 'نظر مدیر اصلی', 'نظر منابع انسانی', 'عملیات']}
          >
            {items.map((l) => (
              <tr key={l._id || l.id} className="hover:bg-slate-50">
                <td className="px-3 py-2.5 font-medium">{LEAVE_TYPE_LABELS[l.leaveType]}</td>
                <td className="px-3 py-2.5">{formatDate(l.startDate)}</td>
                <td className="px-3 py-2.5">{formatDate(l.endDate)}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={LEAVE_STATUS[l.status]?.tone}>{LEAVE_STATUS[l.status]?.label}</Badge>
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-500">
                  {l.managerDecision ? (l.managerDecision.approved ? '✅ تایید' : '❌ رد') : '—'}
                  {l.managerDecision?.note && <span className="block">{l.managerDecision.note}</span>}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-500">
                  {l.seniorDecision ? (l.seniorDecision.approved ? '✅ تایید' : '❌ رد') : '—'}
                  {l.seniorDecision?.note && <span className="block">{l.seniorDecision.note}</span>}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-500">
                  {l.hrDecision ? (l.hrDecision.approved ? '✅ تایید' : '❌ رد') : '—'}
                  {l.hrDecision?.note && <span className="block">{l.hrDecision.note}</span>}
                </td>
                <td className="px-3 py-2.5">
                  {editable(l.status) && (
                    <div className="flex gap-2 text-xs">
                      <button className="text-indigo-600 hover:underline" onClick={() => openEdit(l)}>
                        ویرایش
                      </button>
                      <button className="text-rose-600 hover:underline" onClick={() => cancel(l)}>
                        لغو
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'ویرایش درخواست مرخصی' : 'درخواست مرخصی جدید'}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="نوع مرخصی" required>
            <Select value={form.leaveType} onChange={set('leaveType')}>
              {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="از تاریخ" required>
              <Input type="date" dir="ltr" value={form.startDate} onChange={set('startDate')} required />
            </Field>
            <Field label="تا تاریخ" required>
              <Input type="date" dir="ltr" value={form.endDate} onChange={set('endDate')} required />
            </Field>
          </div>
          {form.leaveType === 'HOURLY' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="از ساعت">
                <Input type="time" dir="ltr" value={form.startTime} onChange={set('startTime')} />
              </Field>
              <Field label="تا ساعت">
                <Input type="time" dir="ltr" value={form.endTime} onChange={set('endTime')} />
              </Field>
            </div>
          )}
          <Field label="علت مرخصی">
            <Textarea value={form.reason} onChange={set('reason')} />
          </Field>
          <Alert>{error}</Alert>
          {editing && (
            <Alert tone="blue">با ویرایش، درخواست دوباره از ابتدای گردش کار تایید می‌شود</Alert>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'در حال ثبت...' : 'ثبت'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              انصراف
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
