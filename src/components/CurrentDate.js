'use client';

import { useEffect, useState } from 'react';

export default function CurrentDate() {
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekDay = weekDays[now.getDay()];
    setDateStr(`${year}. ${month}. ${day}. (${weekDay})`);
  }, []);

  if (!dateStr) return null;

  return (
    <span className="text-xs font-black text-slate-600 tabular-nums tracking-tight bg-slate-100/50 px-2 py-1 rounded-lg border border-slate-200/50">
      {dateStr}
    </span>
  );
}
