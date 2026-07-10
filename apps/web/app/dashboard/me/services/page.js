'use client';

import RequestCenter from '@/components/RequestCenter';

export default function MyServicesPage() {
  return (
    <RequestCenter
      scope="HR"
      title="خدمات و قابلیت‌ها"
      emptyTypesText="هنوز قابلیتی توسط منابع انسانی تعریف نشده است"
    />
  );
}
