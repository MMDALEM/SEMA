'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ROLE_LABELS } from '@/lib/labels';
import { UserContext } from '@/lib/user-context';
import { Spinner, cx } from '@/components/ui';

const NAV_SECTIONS = [
  {
    title: 'عمومی',
    roles: null,
    items: [{ href: '/dashboard', label: 'داشبورد', icon: '🏠' }],
  },
  {
    title: 'میز کار من',
    roles: null,
    items: [
      { href: '/dashboard/me/requests', label: 'درخواست‌های مالی من', icon: '💳' },
      { href: '/dashboard/me/services', label: 'خدمات و قابلیت‌ها', icon: '🍽️' },
      { href: '/dashboard/me/leaves', label: 'مرخصی‌های من', icon: '🌴' },
      { href: '/dashboard/me/reports', label: 'گزارش‌کار من', icon: '📝' },
    ],
  },
  {
    title: 'مدیریت',
    roles: ['ADMIN'],
    items: [
      { href: '/dashboard/admin/users', label: 'مدیریت کاربران', icon: '👥' },
      { href: '/dashboard/admin/logs', label: 'لاگ رخدادها', icon: '📋' },
    ],
  },
  {
    title: 'بخش مالی',
    roles: ['ADMIN', 'FINANCE'],
    items: [
      { href: '/dashboard/finance/types', label: 'تعریف انواع درخواست', icon: '🧾' },
      { href: '/dashboard/finance/requests', label: 'کارتابل درخواست‌های مالی', icon: '💰' },
    ],
  },
  {
    title: 'منابع انسانی',
    roles: ['ADMIN', 'HR'],
    items: [
      { href: '/dashboard/hr/capabilities', label: 'تعریف قابلیت‌ها', icon: '🛠️' },
      { href: '/dashboard/hr/requests', label: 'کارتابل خدمات', icon: '📥' },
      { href: '/dashboard/hr/leaves', label: 'کارتابل مرخصی', icon: '🗂️' },
    ],
  },
  {
    title: 'مدیر میانی',
    roles: ['ADMIN', 'MANAGER'],
    items: [
      { href: '/dashboard/manager/reports', label: 'گزارش‌کار تیم', icon: '📊' },
      { href: '/dashboard/manager/leaves', label: 'مرخصی تیم', icon: '✅' },
    ],
  },
  {
    title: 'مدیر اصلی',
    roles: ['ADMIN', 'SITE_MANAGER', 'GENERAL_MANAGER'],
    items: [
      { href: '/dashboard/senior/leaves', label: 'تایید مرخصی', icon: '🖊️' },
      { href: '/dashboard/senior/requests', label: 'تایید وام و خرید', icon: '🏦' },
    ],
  },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => router.replace('/login'));
  }, [router]);

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/login');
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const sections = NAV_SECTIONS.filter((s) => !s.roles || s.roles.includes(user.role));

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
          س
        </div>
        <div>
          <p className="font-bold text-white">سما</p>
          <p className="text-xs text-slate-400">سیستم مدیریت اداری</p>
        </div>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-2 pb-2 text-xs font-medium text-slate-500">{section.title}</p>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cx(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                      pathname === item.href
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-800 p-4">
        <p className="text-sm font-medium text-white">
          {user.firstName} {user.lastName}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {user.position} · {ROLE_LABELS[user.role]}
        </p>
        <button
          onClick={logout}
          className="mt-3 w-full rounded-lg bg-slate-800 py-2 text-sm text-slate-300 transition hover:bg-rose-600 hover:text-white"
        >
          خروج از سیستم
        </button>
      </div>
    </nav>
  );

  return (
    <UserContext.Provider value={user}>
      <div className="flex min-h-screen">
        {/* سایدبار دسکتاپ */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-slate-900 lg:block">
          {sidebar}
        </aside>

        {/* سایدبار موبایل */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuOpen(false)} />
            <aside className="absolute inset-y-0 right-0 w-64 bg-slate-900">{sidebar}</aside>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            >
              ☰ منو
            </button>
            <span className="font-bold text-slate-800">سما</span>
          </header>
          <main className="mx-auto max-w-6xl p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </UserContext.Provider>
  );
}
