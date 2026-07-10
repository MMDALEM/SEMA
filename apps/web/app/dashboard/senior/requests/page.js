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
  Modal,
  Pagination,
  Select,
  Spinner,
  Table,
  Textarea,
} from '@/components/ui';

/**
 * کارتابل مدیر اصلی (مدیر سایت / مدیر کل):
 * تایید درخواست‌هایی مثل وام و خرید، قبل از رسیدن به بخش مربوطه.
 */
export default function SeniorRequestsPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('PENDING_SENIOR');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [deciding, setDeciding] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set('status', status);
    const d = await api(`/requests/senior-inbox?${params.toString()}`);
    setData(d);
  }, [page, status]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function decide(approved) {
    setDeciding(true);
    setError('');
    try {
      await api(`/requests/${selected._id || selected.id}/senior-decision`, {
        method: 'PATCH',
        body: { approved, note },
      });
      setSelected(null);
      setNote('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeciding(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">تایید وام و خرید — مدیر اصلی</h1>
      <Alert>{error}</Alert>

      <Card>
        <div className="mb-4">
          <Select
            className="max-w-[220px]"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">همه وضعیت‌ها</option>
            {Object.entries(REQUEST_STATUS).map(([value, s]) => (
              <option key={value} value={value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>

        {!data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Table headers={['کارمند', 'نوع درخواست', 'تاریخ ثبت', 'وضعیت', 'عملیات']}>
              {data.items.map((r) => (
                <tr key={r._id || r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-medium">
                    {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '—'}
                    <span className="block text-xs text-slate-400">{r.employee?.position}</span>
                  </td>
                  <td className="px-3 py-2.5">{r.typeName}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{formatDateTime(r.createdAt)}</td>
                  <td className="px-3 py-2.5">
                    <Badge tone={REQUEST_STATUS[r.status]?.tone}>
                      {REQUEST_STATUS[r.status]?.label}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      className="text-xs text-indigo-600 hover:underline"
                      onClick={() => {
                        setSelected(r);
                        setNote('');
                        setError('');
                      }}
                    >
                      مشاهده و بررسی
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.page} pages={data.pages} onChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="جزئیات درخواست">
        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <p className="mb-2 font-medium text-slate-800">{selected.typeName}</p>
              <p className="text-slate-500">
                {selected.employee
                  ? `${selected.employee.firstName} ${selected.employee.lastName} — ${selected.employee.position}`
                  : ''}
              </p>
              <dl className="mt-3 space-y-1.5">
                {Object.entries(selected.payload || {}).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <dt className="text-slate-400">{key}:</dt>
                    <dd className="text-slate-700">{String(value)}</dd>
                  </div>
                ))}
              </dl>
              {selected.seniorDecision && (
                <p className="mt-3 text-xs text-slate-500">
                  نظر مدیر اصلی ({selected.seniorDecision.byName}):{' '}
                  {selected.seniorDecision.approved ? 'تایید' : 'رد'}
                  {selected.seniorDecision.note && ` — ${selected.seniorDecision.note}`}
                </p>
              )}
            </div>

            {selected.status === 'PENDING_SENIOR' ? (
              <>
                <Field label="یادداشت (اختیاری)">
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
                </Field>
                <Alert>{error}</Alert>
                <div className="flex gap-2">
                  <Button variant="success" disabled={deciding} onClick={() => decide(true)}>
                    تایید و ارسال به بخش مربوطه
                  </Button>
                  <Button variant="danger" disabled={deciding} onClick={() => decide(false)}>
                    رد درخواست
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                وضعیت:{' '}
                <Badge tone={REQUEST_STATUS[selected.status]?.tone}>
                  {REQUEST_STATUS[selected.status]?.label}
                </Badge>
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
