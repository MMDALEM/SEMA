'use client';

import RequestCenter from '@/components/RequestCenter';

export default function MyFinanceRequestsPage() {
  return (
    <RequestCenter
      scope="FINANCE"
      title="درخواست‌های مالی من"
      emptyTypesText="هنوز نوع درخواستی توسط بخش مالی تعریف نشده است"
    />
  );
}
