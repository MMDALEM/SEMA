'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useUser } from '@/lib/user-context';
import { ROLE_LABELS } from '@/lib/labels';
import { Card, Spinner } from '@/components/ui';

function StatCard({ label, value, href, icon }) {
  const body = (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">
          {Number(value ?? 0).toLocaleString('fa-IR')}
        </p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function DashboardHome() {
  const user = useUser();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api('/stats')
      .then((d) => setStats(d.stats))
      .catch(() => setStats({}));
  }, []);

  if (!stats) return <Spinner />;

  const cards = [
    { key: 'myPendingRequests', label: 'درخواست‌های در انتظار من', icon: '💳', href: '/dashboard/me/requests' },
    { key: 'myPendingLeaves', label: 'مرخصی‌های در انتظار من', icon: '🌴', href: '/dashboard/me/leaves' },
    { key: 'totalUsers', label: 'کل کاربران سیستم', icon: '👥', href: '/dashboard/admin/users' },
    { key: 'logsToday', label: 'رخدادهای ۲۴ ساعت اخیر', icon: '📋', href: '/dashboard/admin/logs' },
    { key: 'pendingFinance', label: 'درخواست‌های مالی در انتظار', icon: '💰', href: '/dashboard/finance/requests' },
    { key: 'pendingHrRequests', label: 'درخواست خدمات در انتظار', icon: '📥', href: '/dashboard/hr/requests' },
    { key: 'pendingHrLeaves', label: 'مرخصی در انتظار منابع انسانی', icon: '🗂️', href: '/dashboard/hr/leaves' },
    { key: 'teamPendingLeaves', label: 'مرخصی تیم در انتظار شما', icon: '✅', href: '/dashboard/manager/leaves' },
    { key: 'teamNewReports', label: 'گزارش‌کار جدید تیم', icon: '📊', href: '/dashboard/manager/reports' },
    { key: 'seniorPendingLeaves', label: 'مرخصی در انتظار تایید شما', icon: '🖊️', href: '/dashboard/senior/leaves' },
    { key: 'seniorPendingRequests', label: 'وام/خرید در انتظار تایید شما', icon: '🏦', href: '/dashboard/senior/requests' },
  ].filter((c) => stats[c.key] !== undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          سلام، {user.firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {user.position} · {ROLE_LABELS[user.role]}
          {user.department ? ` · ${user.department}` : ''}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <StatCard key={c.key} label={c.label} value={stats[c.key]} icon={c.icon} href={c.href} />
        ))}
      </div>

      <Card title="راهنمای سریع">
        <ul className="list-disc space-y-1.5 pr-5 text-sm leading-7 text-slate-600">
          <li>از بخش «میز کار من» می‌توانید درخواست مالی، خدمات، مرخصی و گزارش‌کار ثبت کنید.</li>
          <li>درخواست‌های در انتظار را می‌توانید تا قبل از تصمیم‌گیری ویرایش یا لغو کنید.</li>
          <li>
            مرخصی ابتدا به تایید مدیر میانی، سپس مدیر اصلی (سایت/کل) و در نهایت منابع انسانی می‌رسد.
          </li>
          <li>درخواست‌هایی مثل وام و خرید قبل از بخش مالی باید به تایید مدیر اصلی برسند.</li>
        </ul>
      </Card>
    </div>
  );
}
