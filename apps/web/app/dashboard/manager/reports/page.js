'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { REPORT_STATUS, formatDate, formatDateTime } from '@/lib/labels';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Modal,
  Pagination,
  Select,
  Spinner,
  Table,
  Textarea,
} from '@/components/ui';

export default function ManagerReportsPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set('status', status);
    const d = await api(`/reports/team?${params.toString()}`);
    setData(d);
  }, [page, status]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function markSeen() {
    setSaving(true);
    setError('');
    try {
      await api(`/reports/${selected._id || selected.id}/seen`, {
        method: 'PATCH',
        body: { managerNote: note },
      });
      setSelected(null);
      setNote('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">گزارش‌کار اعضای تیم</h1>
      <Alert>{error}</Alert>

      <Card>
        <div className="mb-4">
          <Select
            className="max-w-[180px]"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">همه</option>
            <option value="SUBMITTED">در انتظار بررسی</option>
            <option value="SEEN">بررسی شده</option>
          </Select>
        </div>

        {!data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Table headers={['کارمند', 'عنوان', 'تاریخ گزارش', 'ثبت', 'وضعیت', 'عملیات']}>
              {data.items.map((r) => (
                <tr key={r._id || r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-medium">
                    {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '—'}
                  </td>
                  <td className="px-3 py-2.5">{r.title}</td>
                  <td className="px-3 py-2.5">{formatDate(r.date)}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{formatDateTime(r.createdAt)}</td>
                  <td className="px-3 py-2.5">
                    <Badge tone={REPORT_STATUS[r.status]?.tone}>{REPORT_STATUS[r.status]?.label}</Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      className="text-xs text-indigo-600 hover:underline"
                      onClick={() => {
                        setSelected(r);
                        setNote(r.managerNote || '');
                        setError('');
                      }}
                    >
                      مشاهده
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.page} pages={data.pages} onChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="جزئیات گزارش‌کار" wide>
        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-800">{selected.title}</p>
              <p className="mt-1 text-xs text-slate-400">تاریخ گزارش: {formatDate(selected.date)}</p>
              <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{selected.content}</p>
            </div>
            <Field label="بازخورد مدیر (اختیاری)">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <Alert>{error}</Alert>
            <Button disabled={saving} onClick={markSeen}>
              {saving ? 'در حال ثبت...' : 'ثبت بازخورد و علامت‌گذاری به‌عنوان بررسی‌شده'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
