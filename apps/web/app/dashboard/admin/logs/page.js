'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/labels';
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  Input,
  Pagination,
  Select,
  Spinner,
  Table,
} from '@/components/ui';

export default function LogsPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (action.trim()) params.set('action', action.trim());
    if (status) params.set('status', status);
    const d = await api(`/logs?${params.toString()}`);
    setData(d);
  }, [page, action, status]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">لاگ رخدادهای سیستم</h1>
      <Alert>{error}</Alert>

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="فیلتر بر اساس نوع رخداد (مثلا auth.login)"
            className="max-w-xs"
            dir="ltr"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          />
          <Select
            className="max-w-[160px]"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="SUCCESS">موفق</option>
            <option value="FAIL">ناموفق</option>
          </Select>
        </div>

        {!data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Table headers={['زمان', 'کاربر', 'رخداد', 'شرح', 'IP', 'وضعیت']}>
              {data.items.map((log) => (
                <tr key={log._id || log.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-500">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-3 py-2.5 font-medium">{log.actorName}</td>
                  <td className="px-3 py-2.5">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs" dir="ltr">
                      {log.action}
                    </code>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{log.message || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-400" dir="ltr">
                    {log.ip || '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={log.status === 'SUCCESS' ? 'green' : 'red'}>
                      {log.status === 'SUCCESS' ? 'موفق' : 'ناموفق'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.page} pages={data.pages} onChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
