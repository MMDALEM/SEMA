'use client';

import TypeManager from '@/components/TypeManager';

export default function FinanceTypesPage() {
  return (
    <TypeManager
      scope="FINANCE"
      title="تعریف انواع درخواست مالی"
      itemNoun="درخواست"
      examples="مثل: درخواست وام، درخواست مساعده، هزینه ماموریت و ..."
    />
  );
}
