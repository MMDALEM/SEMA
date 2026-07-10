'use client';

import TypeManager from '@/components/TypeManager';

export default function HrCapabilitiesPage() {
  return (
    <TypeManager
      scope="HR"
      title="تعریف قابلیت‌ها و خدمات"
      itemNoun="قابلیت"
      examples="مثل: رزرو غذا، درخواست جلسه با مدیران، درخواست تجهیزات و ..."
    />
  );
}
