'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ROLE_LABELS, formatDate } from '@/lib/labels';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Pagination,
  Select,
  Spinner,
  Table,
} from '@/components/ui';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  nationalId: '',
  role: 'EMPLOYEE',
  position: '',
  department: '',
  manager: '',
  seniorManager: '',
};

export default function UsersPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [managers, setManagers] = useState([]);
  const [seniors, setSeniors] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (q.trim()) params.set('q', q.trim());
    if (roleFilter) params.set('role', roleFilter);
    const d = await api(`/users?${params.toString()}`);
    setData(d);
  }, [page, q, roleFilter]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  useEffect(() => {
    api('/users/managers')
      .then((d) => setManagers(d.items))
      .catch(() => {});
    api('/users/seniors')
      .then((d) => setSeniors(d.items))
      .catch(() => {});
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }

  function openEdit(user) {
    setEditing(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email || '',
      nationalId: user.nationalId || '',
      role: user.role,
      position: user.position,
      department: user.department || '',
      manager: user.manager?._id || user.manager?.id || '',
      seniorManager: user.seniorManager?._id || user.seniorManager?.id || '',
    });
    setError('');
    setModalOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        ...form,
        manager: form.manager || null,
        seniorManager: form.seniorManager || null,
      };
      if (editing) {
        await api(`/users/${editing._id || editing.id}`, { method: 'PATCH', body });
      } else {
        const d = await api('/users', { method: 'POST', body });
        setCreatedUser(d.user);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user) {
    try {
      await api(`/users/${user._id || user.id}/status`, {
        method: 'PATCH',
        body: { isActive: !user.isActive },
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function regenerateCode(user) {
    if (!window.confirm('کد یکتای فعلی باطل و کد جدید صادر می‌شود. ادامه می‌دهید؟')) return;
    try {
      const d = await api(`/users/${user._id || user.id}/regenerate-code`, { method: 'POST' });
      setCreatedUser(d.user);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">مدیریت کاربران</h1>
        <Button onClick={openCreate}>+ کاربر جدید</Button>
      </div>

      <Alert>{error}</Alert>

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="جستجو (نام، شماره، کد یکتا، سمت...)"
            className="max-w-xs"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <Select
            className="max-w-[180px]"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">همه نقش‌ها</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
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
            <Table
              headers={['نام', 'شماره تلفن', 'کد یکتا', 'نقش', 'سمت', 'مدیر میانی', 'مدیر اصلی', 'وضعیت', 'عملیات']}
            >
              {data.items.map((u) => (
                <tr key={u._id || u.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-medium text-slate-800">
                    {u.firstName} {u.lastName}
                    <span className="block text-xs text-slate-400">
                      عضویت: {formatDate(u.createdAt)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5" dir="ltr">
                    {u.phone}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs" dir="ltr">
                    {u.uniqueCode}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={u.role === 'ADMIN' ? 'indigo' : 'slate'}>
                      {ROLE_LABELS[u.role]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">{u.position}</td>
                  <td className="px-3 py-2.5 text-slate-500">
                    {u.manager ? `${u.manager.firstName} ${u.manager.lastName}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">
                    {u.seniorManager
                      ? `${u.seniorManager.firstName} ${u.seniorManager.lastName}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={u.isActive ? 'green' : 'red'}>
                      {u.isActive ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <button className="text-indigo-600 hover:underline" onClick={() => openEdit(u)}>
                        ویرایش
                      </button>
                      <button className="text-amber-600 hover:underline" onClick={() => regenerateCode(u)}>
                        کد جدید
                      </button>
                      <button
                        className={u.isActive ? 'text-rose-600 hover:underline' : 'text-emerald-600 hover:underline'}
                        onClick={() => toggleActive(u)}
                      >
                        {u.isActive ? 'غیرفعال' : 'فعال'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.page} pages={data.pages} onChange={setPage} />
          </>
        )}
      </Card>

      {/* فرم ایجاد / ویرایش */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'ویرایش کاربر' : 'ثبت‌نام کاربر جدید'}
        wide
      >
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="نام" required>
            <Input value={form.firstName} onChange={set('firstName')} required />
          </Field>
          <Field label="نام خانوادگی" required>
            <Input value={form.lastName} onChange={set('lastName')} required />
          </Field>
          <Field label="شماره تلفن همراه" required hint="کد یک‌بارمصرف ورود به این شماره پیامک می‌شود">
            <Input dir="ltr" placeholder="09121234567" value={form.phone} onChange={set('phone')} required />
          </Field>
          <Field label="کد ملی">
            <Input dir="ltr" maxLength={10} value={form.nationalId} onChange={set('nationalId')} />
          </Field>
          <Field label="ایمیل">
            <Input dir="ltr" type="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="نقش (سطح دسترسی)" required>
            <Select value={form.role} onChange={set('role')}>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="سمت شغلی" required>
            <Input placeholder="مثلا: کارشناس فروش" value={form.position} onChange={set('position')} required />
          </Field>
          <Field label="واحد / دپارتمان">
            <Input value={form.department} onChange={set('department')} />
          </Field>
          <Field label="مدیر میانی" hint="گزارش‌کار و مرخصی این کارمند به این مدیر ارجاع می‌شود">
            <Select value={form.manager} onChange={set('manager')}>
              <option value="">— بدون مدیر میانی —</option>
              {managers.map((m) => (
                <option key={m._id || m.id} value={m._id || m.id}>
                  {m.firstName} {m.lastName} ({m.position})
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="مدیر اصلی (سایت / کل)"
            hint="تایید مرخصی، وام و خرید این کارمند بر عهده این مدیر است"
          >
            <Select value={form.seniorManager} onChange={set('seniorManager')}>
              <option value="">— بدون مدیر اصلی —</option>
              {seniors.map((m) => (
                <option key={m._id || m.id} value={m._id || m.id}>
                  {m.firstName} {m.lastName} ({ROLE_LABELS[m.role]})
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Alert>{error}</Alert>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'در حال ذخیره...' : editing ? 'ذخیره تغییرات' : 'ثبت‌نام کاربر'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              انصراف
            </Button>
          </div>
        </form>
      </Modal>

      {/* نمایش کد یکتای صادرشده */}
      <Modal
        open={Boolean(createdUser)}
        onClose={() => setCreatedUser(null)}
        title="کد یکتای کاربر"
      >
        {createdUser && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-slate-600">
              کد یکتای ورودِ «{createdUser.firstName} {createdUser.lastName}» — این کد را به کاربر بدهید:
            </p>
            <p
              dir="ltr"
              className="rounded-xl bg-slate-900 py-4 font-mono text-xl tracking-widest text-emerald-400"
            >
              {createdUser.uniqueCode}
            </p>
            <Button
              variant="secondary"
              onClick={() => navigator.clipboard?.writeText(createdUser.uniqueCode)}
            >
              کپی کد
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
