'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useReservationData } from '@/lib/useReservationData';
import { GROUPS, GRADE_OPTIONS, GROUP_COLORS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

function FormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typesParam = searchParams.get('types') || '';
  const selectedTypes = typesParam ? typesParam.split(',') : [];

  const { data: dbData, addReservations } = useReservationData();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 각 타입별 입력 폼 상태: { [group]: [{ grade, name }] }
  const [forms, setForms] = useState(() => {
    const initial = {};
    selectedTypes.forEach(g => { initial[g] = [{ grade: '', name: '' }]; });
    return initial;
  });

  useEffect(() => {
    if (!selectedTypes.length) router.replace('/reserve');
  }, []);

  const addRow = (group) => {
    setForms(prev => ({
      ...prev,
      [group]: [...prev[group], { grade: '', name: '' }],
    }));
  };

  const removeRow = (group, idx) => {
    setForms(prev => {
      const rows = [...prev[group]];
      if (rows.length === 1) return prev;
      rows.splice(idx, 1);
      return { ...prev, [group]: rows };
    });
  };

  const updateRow = (group, idx, field, value) => {
    setForms(prev => {
      const rows = [...prev[group]];
      rows[idx] = {
        ...rows[idx],
        [field]: field === 'name' ? value.replace(/\s/g, '') : value,
      };
      return { ...prev, [group]: rows };
    });
  };

  const handleSubmit = async () => {
    // 유효성 검사
    for (const group of selectedTypes) {
      const rows = forms[group] || [];
      const hasEntry = rows.some(r => r.name.trim());
      if (!hasEntry) {
        alert(`[${group}] 에 최소 한 명의 이름을 입력해주세요.`);
        return;
      }
      for (const r of rows) {
        if (r.name.trim() && !r.grade && group !== '아버지' && group !== '어머니') {
          alert(`[${group}] 이름을 입력한 행에 학년을 선택해주세요.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const entriesByGroup = {};
      for (const group of selectedTypes) {
        const rows = forms[group] || [];
        const entries = rows
          .filter(r => r.name.trim())
          .map(r => ({ grade: r.grade, name: r.name.trim() }));
        if (entries.length) entriesByGroup[group] = entries;
      }
      await addReservations(entriesByGroup);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // 완료 화면
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center px-4">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="text-6xl mb-4">⚽</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">예약 완료!</h2>
          <p className="text-slate-500 mb-4">예약이 성공적으로 접수되었습니다.</p>
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {selectedTypes.map(g => (
              <span key={g} className={`text-sm font-bold px-3 py-1 rounded-full ${GROUP_COLORS[g].badge}`}>
                {g}
              </span>
            ))}
          </div>
          <Link href="/">
            <Button className="h-12 px-8 font-black rounded-2xl bg-blue-600 hover:bg-blue-700">
              현황 보러가기 →
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/reserve"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span className="text-sm font-bold">반 선택으로</span>
          </Link>
          <span className="font-black text-slate-900 tracking-tighter">⚽ AA FC</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
        {/* 타이틀 */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">STEP 2 / 2</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">예약 정보 입력</h2>
          <p className="text-slate-500 text-sm mt-1">학년과 이름을 입력해주세요</p>
        </div>

        {/* 각 반별 입력 섹션 */}
        <div className="space-y-6">
          {selectedTypes.map((group) => {
            const groupData = dbData[group] || { capacity: 15, reservations: [] };
            const currentCount = (groupData.reservations || []).length;
            const cap = groupData.capacity;
            const isFull = currentCount >= cap;
            const colors = GROUP_COLORS[group];
            const rows = forms[group] || [{ grade: '', name: '' }];

            return (
              <div key={group} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* 반 헤더 */}
                <div className={`px-5 py-4 ${colors.light} border-b ${colors.border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                      <span className={`font-black text-xl ${colors.text}`}>{group}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${isFull ? 'text-red-500' : 'text-slate-500'}`}>
                        현재{' '}
                        <span className={`text-lg ${isFull ? 'text-red-500' : colors.text}`}>
                          {currentCount}
                        </span>
                        {' '}/ {cap}명
                      </span>
                      {isFull && (
                        <span className="text-[10px] font-black text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                          FULL
                        </span>
                      )}
                    </div>
                  </div>
                  {/* 프로그레스 바 */}
                  <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isFull ? 'bg-red-400' : colors.bg} transition-all duration-500`}
                      style={{ width: `${cap > 0 ? Math.min(100, (currentCount / cap) * 100) : 0}%` }}
                    />
                  </div>
                </div>

                {/* 입력 행들 */}
                <div className="p-5 space-y-3">
                  {rows.map((row, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-center animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                      {/* 학년 드롭다운 (부모님 반이 아닌 경우만 표시) */}
                      {group !== '아버지' && group !== '어머니' && (
                        <Select
                          value={row.grade}
                          onValueChange={(val) => updateRow(group, idx, 'grade', val)}
                        >
                          <SelectTrigger className="w-40 shrink-0 h-11 text-sm font-medium">
                            <SelectValue placeholder="학년 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADE_OPTIONS.map(g => (
                              <SelectItem key={g} value={g} className="text-sm">{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {/* 이름 입력 */}
                      <Input
                        type="text"
                        placeholder="이름 (띄어쓰기 자동 제거)"
                        value={row.name}
                        onChange={(e) => updateRow(group, idx, 'name', e.target.value)}
                        className="flex-1 h-11 text-sm font-medium"
                      />

                      {/* 행 삭제 버튼 */}
                      {rows.length > 1 && (
                        <button
                          onClick={() => removeRow(group, idx)}
                          className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-400 transition-all duration-150 text-lg font-bold shrink-0"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* 인원 추가하기 버튼 (타입별 중앙 하단) */}
                <div className="px-5 pb-5 flex justify-center">
                  <button
                    onClick={() => addRow(group)}
                    className={`flex items-center gap-2 text-sm font-black px-5 py-2.5 rounded-xl border-2 border-dashed
                      ${colors.border} ${colors.text} ${colors.light} hover:opacity-80 transition-all duration-150`}
                  >
                    <span className="text-lg">+</span>
                    인원 추가하기
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 하단 고정 접수하기 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200/60">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-14 text-lg font-black rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 hover:-translate-y-0.5 transition-all duration-200 disabled:bg-slate-300 disabled:shadow-none disabled:translate-y-0"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                접수 중...
              </span>
            ) : '✅ 접수하기'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ReserveFormPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    }>
      <FormContent />
    </Suspense>
  );
}
