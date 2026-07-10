export const ROLE_LABELS = {
  ADMIN: 'مدیریت',
  FINANCE: 'مالی',
  HR: 'منابع انسانی',
  MANAGER: 'مدیر میانی',
  SITE_MANAGER: 'مدیر سایت',
  GENERAL_MANAGER: 'مدیر کل',
  EMPLOYEE: 'کارمند',
};

export const REQUEST_STATUS = {
  PENDING_SENIOR: { label: 'در انتظار مدیر اصلی', tone: 'amber' },
  PENDING: { label: 'در انتظار بررسی بخش', tone: 'blue' },
  APPROVED: { label: 'تایید شده', tone: 'green' },
  REJECTED: { label: 'رد شده', tone: 'red' },
  CANCELED: { label: 'لغو شده', tone: 'slate' },
};

export const LEAVE_STATUS = {
  PENDING_MANAGER: { label: 'در انتظار مدیر میانی', tone: 'amber' },
  PENDING_SENIOR: { label: 'در انتظار مدیر اصلی', tone: 'amber' },
  PENDING_HR: { label: 'در انتظار منابع انسانی', tone: 'blue' },
  APPROVED: { label: 'تایید نهایی', tone: 'green' },
  REJECTED: { label: 'رد شده', tone: 'red' },
  CANCELED: { label: 'لغو شده', tone: 'slate' },
};

export const LEAVE_TYPE_LABELS = {
  DAILY: 'روزانه',
  HOURLY: 'ساعتی',
  SICK: 'استعلاجی',
};

export const REPORT_STATUS = {
  SUBMITTED: { label: 'در انتظار بررسی', tone: 'amber' },
  SEEN: { label: 'بررسی شده', tone: 'green' },
};

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fa-IR');
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fa-IR');
}
