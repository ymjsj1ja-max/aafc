'use client';

import { useState } from 'react';
import { useReservationData } from '@/lib/useReservationData';
import { GROUPS, GROUP_COLORS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReservePage() {
  const router = useRouter();
  const [selected, setSelected] = useState([]);         // 일반 예약
  const [waitlistSelected, setWaitlistSelected] = useState([]); // 대기 신청
  const { data } = useReservationData();

  const toggleNormal = (group) => {
    setSelected(s => s.includes(group) ? s.filter(x => x !== group) : [...s, group]);
  };

  const toggleWaitlist = (group) => {
    setWaitlistSelected(s => s.includes(group) ? s.filter(x => x !== group) : [...s, group]);
  };

  const handleNext = () => {
    if (!selected.length && !waitlistSelected.length) return;
    const params = new URLSearchParams();
    if (selected.length) params.set('types', selected.join(','));
    if (waitlistSelected.length) params.set('waitlistTypes', waitlistSelected.join(','));
    router.push(`/reserve/form?${params.toString()}`);
  };

  const totalSelected = selected.length + waitlistSelected.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span className="text-sm font-bold">현황으로</span>
          </Link>
          <span className="font-black text-slate-900 tracking-tighter">⚽ AA FC</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 타이틀 */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">STEP 1 / 2</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">반 선택</h2>
          <p className="text-slate-500 text-sm mt-1">예약할 반을 선택하세요 (다중 선택 가능)</p>
        </div>

        {/* 반 선택 카드 */}
        <div className="space-y-3 mb-8">
          {GROUPS.map((group, i) => {
            const groupData = data[group] || { capacity: 15, reservations: [], waitlistCapacity: 5, waitlistEnabled: false, waitlist: [] };
            const count = (groupData.reservations || []).length;
            const cap = groupData.capacity;
            const isFull = count >= cap;
            const waitlistEnabled = groupData.waitlistEnabled ?? false;
            const waitlistCount = (groupData.waitlist || []).length;
            const waitlistCap = groupData.waitlistCapacity ?? 5;
            const waitlistAvailable = waitlistEnabled && waitlistCount < waitlistCap;

            const isSelected = selected.includes(group);
            const isWaitlistSelected = waitlistSelected.includes(group);
            const colors = GROUP_COLORS[group];

            return (
              <div key={group} style={{ animationDelay: `${i * 60}ms` }}>
                {/* ── 정원 여유 → 일반 예약 버튼 ── */}
                {!isFull && (
                  <button
                    onClick={() => toggleNormal(group)}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200
                      ${isSelected
                        ? `${colors.light} ${colors.border} shadow-md`
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm transition-all duration-200
                          ${isSelected ? colors.bg : 'bg-slate-100 text-slate-400'}`}>
                          {isSelected ? '✓' : group.slice(0, 1)}
                        </div>
                        <div>
                          <div className={`font-black text-lg ${isSelected ? colors.text : 'text-slate-700'}`}>
                            {group}
                          </div>
                          <div className="text-xs text-slate-400 font-medium">현재 {count}명 예약됨</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-500">{count} / {cap}</div>
                      </div>
                    </div>
                    <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isSelected ? colors.bg : 'bg-slate-300'}`}
                        style={{ width: `${cap > 0 ? Math.min(100, (count / cap) * 100) : 0}%` }}
                      />
                    </div>
                  </button>
                )}

                {/* ── 정원 마감 + 대기 불가 → 비활성 카드 ── */}
                {isFull && !waitlistAvailable && (
                  <div className="w-full p-5 rounded-2xl border-2 bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 text-slate-400 font-black text-sm">
                          {group.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-black text-lg text-slate-400">{group}</div>
                          <div className="text-xs text-slate-400 font-medium">현재 {count}명 예약됨</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-red-400">{count} / {cap}</div>
                        <div className="text-[10px] font-black text-red-400 uppercase">FULL</div>
                      </div>
                    </div>
                    <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-red-300 w-full" />
                    </div>
                  </div>
                )}

                {/* ── 정원 마감 + 대기 가능 → 대기 신청 버튼 ── */}
                {isFull && waitlistAvailable && (
                  <button
                    onClick={() => toggleWaitlist(group)}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200
                      ${isWaitlistSelected
                        ? 'bg-amber-50 border-amber-400 shadow-md shadow-amber-100'
                        : 'bg-white border-amber-100 hover:border-amber-300 hover:shadow-md'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-200
                          ${isWaitlistSelected ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-400'}`}>
                          {isWaitlistSelected ? '✓' : '⏳'}
                        </div>
                        <div>
                          <div className={`font-black text-lg flex items-center gap-2 ${isWaitlistSelected ? 'text-amber-600' : 'text-slate-700'}`}>
                            {group}
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                              대기 가능
                            </span>
                          </div>
                          <div className="text-xs text-amber-500 font-medium">
                            정원 마감 · 대기 {waitlistCount}/{waitlistCap}명
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-red-400">{count} / {cap}</div>
                        <div className="text-[10px] font-black text-red-400 uppercase">FULL</div>
                      </div>
                    </div>
                    {/* 대기 프로그레스 바 */}
                    <div className="mt-3 h-1 bg-amber-50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isWaitlistSelected ? 'bg-amber-500' : 'bg-amber-200'}`}
                        style={{ width: `${waitlistCap > 0 ? Math.min(100, (waitlistCount / waitlistCap) * 100) : 0}%` }}
                      />
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 선택 표시 + 다음 버튼 */}
        <div className="space-y-3">
          {totalSelected > 0 && (
            <div className="flex gap-2 flex-wrap">
              {selected.map(g => (
                <span key={g} className={`text-xs font-black px-3 py-1.5 rounded-full ${GROUP_COLORS[g].badge}`}>
                  {g} ✓
                </span>
              ))}
              {waitlistSelected.map(g => (
                <span key={`wait-${g}`} className="text-xs font-black px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
                  ⏳ {g} 대기
                </span>
              ))}
            </div>
          )}
          <Button
            onClick={handleNext}
            disabled={!totalSelected}
            className="w-full h-14 text-lg font-black rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 disabled:bg-slate-200 disabled:shadow-none hover:-translate-y-0.5 transition-all duration-200"
          >
            다음 단계로 →
          </Button>
        </div>
      </main>
    </div>
  );
}
