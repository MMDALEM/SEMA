'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
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
} from '@/components/ui';

const FIELD_TYPES = [
  { value: 'text', label: 'متن کوتاه' },
  { value: 'textarea', label: 'متن بلند' },
  { value: 'number', label: 'عدد' },
  { value: 'date', label: 'تاریخ' },
  { value: 'select', label: 'انتخابی' },
];

const EMPTY_FIELD = { key: '', label: '', type: 'text', required: false, options: '' };

/**
 * تعریف و مدیریت انواع درخواست (مالی) یا قابلیت‌ها (منابع انسانی).
 * scope: 'FINANCE' | 'HR'
 */
export default function TypeManager({ scope, title, itemNoun, examples }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    needsSeniorApproval: false,
    fields: [],
  });

  const load = useCallback(async () => {
    const d = await api(`/request-types?scope=${scope}`);
    setItems(d.items);
  }, [scope]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '', needsSeniorApproval: false, fields: [] });
    setError('');
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || '',
      needsSeniorApproval: Boolean(item.needsSeniorApproval),
      fields: item.fields.map((f) => ({ ...f, options: (f.options || []).join('، ') })),
    });
    setError('');
    setModalOpen(true);
  }

  function setField(index, key, value) {
    setForm((f) => {
      const fields = [...f.fields];
      fields[index] = { ...fields[index], [key]: value };
      return { ...f, fields };
    });
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        name: form.name,
        description: form.description,
        needsSeniorApproval: Boolean(form.needsSeniorApproval),
        scope,
        fields: form.fields.map((f) => ({
          key: f.key.trim(),
          label: f.label.trim(),
          type: f.type,
          required: Boolean(f.required),
          options:
            f.type === 'select'
              ? String(f.options)
                  .split(/[,،]/)
                  .map((o) => o.trim())
                  .filter(Boolean)
              : [],
        })),
      };
      if (editing) {
        await api(`/request-types/${editing._id || editing.id}`, { method: 'PATCH', body });
      } else {
        await api('/request-types', { method: 'POST', body });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item) {
    try {
      await api(`/request-types/${item._id || item.id}`, {
        method: 'PATCH',
        body: { isActive: !item.isActive },
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{examples}</p>
        </div>
        <Button onClick={openCreate}>+ تعریف {itemNoun} جدید</Button>
      </div>

      <Alert>{error}</Alert>

      <Card>
        {!items ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState text={`هنوز ${itemNoun}ی تعریف نشده است`} />
        ) : (
          <Table headers={['نام', 'توضیحات', 'فیلدهای فرم', 'وضعیت', 'عملیات']}>
            {items.map((item) => (
              <tr key={item._id || item.id} className="hover:bg-slate-50">
                <td className="px-3 py-2.5 font-medium text-slate-800">{item.name}</td>
                <td className="px-3 py-2.5 text-slate-500">{item.description || '—'}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {item.fields.length === 0 ? (
                      <span className="text-xs text-slate-400">بدون فیلد</span>
                    ) : (
                      item.fields.map((f) => (
                        <Badge key={f.key} tone="slate">
                          {f.label}
                        </Badge>
                      ))
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={item.isActive ? 'green' : 'red'}>
                      {item.isActive ? 'فعال' : 'غیرفعال'}
                    </Badge>
                    {item.needsSeniorApproval && <Badge tone="indigo">تایید مدیر اصلی</Badge>}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-2 text-xs">
                    <button className="text-indigo-600 hover:underline" onClick={() => openEdit(item)}>
                      ویرایش
                    </button>
                    <button
                      className={item.isActive ? 'text-rose-600 hover:underline' : 'text-emerald-600 hover:underline'}
                      onClick={() => toggleActive(item)}
                    >
                      {item.isActive ? 'غیرفعال' : 'فعال'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `ویرایش ${itemNoun}` : `تعریف ${itemNoun} جدید`}
        wide
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام" required>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </Field>
            <Field label="توضیحات">
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(form.needsSeniorApproval)}
              onChange={(e) => setForm((f) => ({ ...f, needsSeniorApproval: e.target.checked }))}
            />
            نیاز به تایید مدیر اصلی (سایت/کل) دارد — مناسب وام، خرید و موارد پرهزینه
          </label>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">
                فیلدهای فرم (اطلاعاتی که کارمند باید وارد کند)
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setForm((f) => ({ ...f, fields: [...f.fields, { ...EMPTY_FIELD }] }))}
              >
                + فیلد
              </Button>
            </div>

            {form.fields.length === 0 && (
              <p className="text-xs text-slate-400">
                مثلا برای «درخواست وام»: مبلغ (عدد)، مدت بازپرداخت (انتخابی)، توضیحات (متن بلند)
              </p>
            )}

            {form.fields.map((f, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-12">
                <Input
                  className="sm:col-span-3"
                  dir="ltr"
                  placeholder="key (انگلیسی)"
                  value={f.key}
                  onChange={(e) => setField(i, 'key', e.target.value)}
                  required
                />
                <Input
                  className="sm:col-span-3"
                  placeholder="عنوان فارسی"
                  value={f.label}
                  onChange={(e) => setField(i, 'label', e.target.value)}
                  required
                />
                <Select
                  className="sm:col-span-2"
                  value={f.type}
                  onChange={(e) => setField(i, 'type', e.target.value)}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={Boolean(f.required)}
                    onChange={(e) => setField(i, 'required', e.target.checked)}
                  />
                  الزامی
                </label>
                <button
                  type="button"
                  className="text-xs text-rose-600 hover:underline sm:col-span-2"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, fields: prev.fields.filter((_, j) => j !== i) }))
                  }
                >
                  حذف فیلد
                </button>
                {f.type === 'select' && (
                  <Input
                    className="sm:col-span-12"
                    placeholder="گزینه‌ها را با ویرگول جدا کنید: ۶ ماهه، ۱۲ ماهه، ۲۴ ماهه"
                    value={f.options}
                    onChange={(e) => setField(i, 'options', e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          <Alert>{error}</Alert>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'در حال ذخیره...' : 'ذخیره'}
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
