'use client';

import { useReservationData } from '@/lib/useReservationData';
import { GROUPS, GROUP_COLORS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import CurrentDate from '@/components/CurrentDate';

export default function StatusPage() {
  const { data, loading, isFirebase } = useReservationData();

  const totalReserved = GROUPS.reduce((acc, g) => acc + (data[g]?.reservations?.length || 0), 0);
  const totalCapacity = GROUPS.reduce((acc, g) => acc + (data[g]?.capacity || 0), 0);
  const totalWaitlist = GROUPS.reduce((acc, g) => acc + (data[g]?.waitlist?.length || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">📋</div>
        </div>
        <p className="mt-4 text-sm font-bold text-slate-400 tracking-widest uppercase">Loading...</p>
      </div>
    );
  }

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
            <span className="text-sm font-bold">메인으로</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm">📋</span>
            <span className="font-black text-slate-900 tracking-tighter text-sm">참여현황</span>
          </div>
          <CurrentDate />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 개발 모드 배지 */}
        {!isFirebase && (
          <div className="mb-4 flex justify-center">
            <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              Local Dev Mode
            </span>
          </div>
        )}

        {/* 타이틀 + 요약 통계 */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-3">
            참여현황
          </h1>
          <div className="inline-flex items-center gap-4 bg-white rounded-2xl px-6 py-3 border border-slate-100 shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-black text-blue-600">{totalReserved}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">예약</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <div className="text-2xl font-black text-slate-400">{totalCapacity}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">정원</div>
            </div>
            {totalWaitlist > 0 && (
              <>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center">
                  <div className="text-2xl font-black text-amber-500">{totalWaitlist}</div>
                  <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">대기</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 각 반별 명단 */}
        <div className="space-y-4 mb-8">
          {GROUPS.map((group, i) => {
            const groupData = data[group] || { capacity: 15, reservations: [], waitlistCapacity: 5, waitlistEnabled: false, waitlist: [] };
            const reservations = groupData.reservations || [];
            const waitlist = groupData.waitlist || [];
            const cap = groupData.capacity;
            const count = reservations.length;
            const isFull = count >= cap;
            const colors = GROUP_COLORS[group];
            const waitlistEnabled = groupData.waitlistEnabled ?? false;

            return (
              <div
                key={group}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* 그룹 헤더 */}
                <div className={`px-5 py-4 ${colors.light} border-b ${colors.border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                      <span className={`font-black text-xl ${colors.text}`}>{group}</span>
                      {isFull && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full border text-red-500 bg-red-50 border-red-100">
                          FULL
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-black ${isFull ? 'text-red-500' : 'text-slate-500'}`}>
                      <span className={`text-lg ${isFull ? 'text-red-500' : colors.text}`}>{count}</span> / {cap}명
                    </span>
                  </div>
                  {/* 프로그레스 바 */}
                  <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${isFull ? 'bg-red-400' : colors.bg}`}
                      style={{ width: `${cap > 0 ? Math.min(100, (count / cap) * 100) : 0}%` }}
                    />
                  </div>
                </div>

                {/* 예약자 명단 */}
                <div className="p-5">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">예약자 명단</p>
                  {reservations.length === 0 ? (
                    <p className="text-slate-300 text-sm font-bold text-center py-3">아직 예약자가 없습니다</p>
                  ) : (
                    <div className="space-y-1.5">
                      {reservations.map((r, idx) => (
                        <div key={r.id || idx} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                          <span className="text-xs text-slate-400 font-bold w-6 text-right shrink-0">{idx + 1}.</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${colors.badge}`}>
                            {r.grade || '-'}
                          </span>
                          <span className="text-sm font-bold text-slate-700">
                            {r.name}
                          </span>
                          {(r.parentName || r.childName) && (
                            <span className="text-xs text-slate-400 font-medium">
                              ({r.parentName || r.childName})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 대기자 명단 */}
                  {waitlistEnabled && (
                    <div className="mt-4 pt-4 border-t border-dashed border-amber-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                          <span>⏳</span> 대기자 명단
                        </p>
                        <span className="text-xs font-black text-amber-500">
                          {waitlist.length}/{groupData.waitlistCapacity ?? 5}명
                        </span>
                      </div>
                      {waitlist.length === 0 ? (
                        <p className="text-amber-200 text-sm font-bold text-center py-3">대기자 없음</p>
                      ) : (
                        <div className="space-y-1.5">
                          {waitlist.map((r, idx) => (
                            <div key={r.id || idx} className="flex items-center gap-2 p-2 rounded-lg hover:bg-amber-50 transition-colors">
                              <span className="text-xs text-amber-400 font-black w-6 text-right shrink-0">대{idx + 1}.</span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 bg-amber-100 text-amber-700">
                                {r.grade || '-'}
                              </span>
                              <span className="text-sm font-bold text-slate-700">
                                {r.name}
                              </span>
                              {(r.parentName || r.childName) && (
                                <span className="text-xs text-slate-400 font-medium">
                                  ({r.parentName || r.childName})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 버튼 */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <Link href="/reserve">
            <Button className="w-full h-14 text-lg font-black rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all duration-200 hover:-translate-y-0.5">
              ⚽ 예약하기
            </Button>
          </Link>
          <Link href="/">
            <Button
              variant="outline"
              className="w-full h-12 text-base font-black rounded-2xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
            >
              ← 메인으로 돌아가기
            </Button>
          </Link>
        </div>

        <footer className="mt-10 text-center">
          <p className="text-[10px] text-slate-300 font-black tracking-widest uppercase">
            Built with Passion for AA FC
          </p>
        </footer>
      </main>
    </div>
  );
}
