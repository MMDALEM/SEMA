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
  Modal,
  Pagination,
  Select,
  Spinner,
  Table,
  Textarea,
} from '@/components/ui';

const MODE_CONFIG = {
  MANAGER: { decidableStatus: 'PENDING_MANAGER', endpoint: 'manager-decision' },
  SENIOR: { decidableStatus: 'PENDING_SENIOR', endpoint: 'senior-decision' },
  HR: { decidableStatus: 'PENDING_HR', endpoint: 'hr-decision' },
};

/**
 * کارتابل مرخصی.
 * mode: 'MANAGER' مدیر میانی | 'SENIOR' مدیر اصلی (سایت/کل) | 'HR' تصمیم نهایی منابع انسانی
 */
export default function LeavesInbox({ mode, title }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(MODE_CONFIG[mode].decidableStatus);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [deciding, setDeciding] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set('status', status);
    const d = await api(`/leaves/inbox?${params.toString()}`);
    setData(d);
  }, [page, status]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const { decidableStatus, endpoint: decideEndpoint } = MODE_CONFIG[mode];

  async function decide(approved) {
    setDeciding(true);
    setError('');
    try {
      await api(`/leaves/${selected._id || selected.id}/${decideEndpoint}`, {
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
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
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
            {Object.entries(LEAVE_STATUS).map(([value, s]) => (
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
            <Table headers={['کارمند', 'نوع', 'از تاریخ', 'تا تاریخ', 'وضعیت', 'عملیات']}>
              {data.items.map((l) => (
                <tr key={l._id || l.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-medium">
                    {l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : '—'}
                    <span className="block text-xs text-slate-400">{l.employee?.position}</span>
                  </td>
                  <td className="px-3 py-2.5">{LEAVE_TYPE_LABELS[l.leaveType]}</td>
                  <td className="px-3 py-2.5">{formatDate(l.startDate)}</td>
                  <td className="px-3 py-2.5">{formatDate(l.endDate)}</td>
                  <td className="px-3 py-2.5">
                    <Badge tone={LEAVE_STATUS[l.status]?.tone}>{LEAVE_STATUS[l.status]?.label}</Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      className="text-xs text-indigo-600 hover:underline"
                      onClick={() => {
                        setSelected(l);
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

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="جزئیات مرخصی">
        {selected && (
          <div className="space-y-4">
            <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-800">
                {selected.employee
                  ? `${selected.employee.firstName} ${selected.employee.lastName}`
                  : ''}{' '}
                — مرخصی {LEAVE_TYPE_LABELS[selected.leaveType]}
              </p>
              <p className="text-slate-600">
                از {formatDate(selected.startDate)} تا {formatDate(selected.endDate)}
                {selected.startTime && ` (${selected.startTime} تا ${selected.endTime})`}
              </p>
              {selected.reason && <p className="text-slate-600">علت: {selected.reason}</p>}
              {selected.managerDecision && (
                <p className="text-xs text-slate-500">
                  نظر مدیر میانی ({selected.managerDecision.byName}):{' '}
                  {selected.managerDecision.approved ? 'تایید' : 'رد'}
                  {selected.managerDecision.note && ` — ${selected.managerDecision.note}`}
                </p>
              )}
              {selected.seniorDecision && (
                <p className="text-xs text-slate-500">
                  نظر مدیر اصلی ({selected.seniorDecision.byName}):{' '}
                  {selected.seniorDecision.approved ? 'تایید' : 'رد'}
                  {selected.seniorDecision.note && ` — ${selected.seniorDecision.note}`}
                </p>
              )}
              {selected.hrDecision && (
                <p className="text-xs text-slate-500">
                  نظر منابع انسانی ({selected.hrDecision.byName}):{' '}
                  {selected.hrDecision.approved ? 'تایید' : 'رد'}
                  {selected.hrDecision.note && ` — ${selected.hrDecision.note}`}
                </p>
              )}
            </div>

            {selected.status === decidableStatus ? (
              <>
                <Field label="یادداشت (اختیاری)">
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
                </Field>
                <Alert>{error}</Alert>
                <div className="flex gap-2">
                  <Button variant="success" disabled={deciding} onClick={() => decide(true)}>
                    {mode === 'HR' ? 'تایید نهایی' : 'تایید و ارسال به مرحله بعد'}
                  </Button>
                  <Button variant="danger" disabled={deciding} onClick={() => decide(false)}>
                    رد درخواست
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                وضعیت فعلی:{' '}
                <Badge tone={LEAVE_STATUS[selected.status]?.tone}>
                  {LEAVE_STATUS[selected.status]?.label}
                </Badge>
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
