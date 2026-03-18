'use client';

import { useReservationData } from '@/lib/useReservationData';
import { GROUPS, GROUP_COLORS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const { data, loading, isFirebase } = useReservationData();

  const totalReserved = GROUPS.reduce((acc, g) => acc + (data[g]?.reservations?.length || 0), 0);
  const totalCapacity = GROUPS.reduce((acc, g) => acc + (data[g]?.capacity || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">⚽</div>
        </div>
        <p className="mt-4 text-sm font-bold text-slate-400 tracking-widest uppercase">Loading AA FC...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            <span className="font-black text-slate-900 tracking-tighter">AA FC</span>
            <span className="text-xs font-bold text-slate-400 ml-1">RESERVATION</span>
          </div>
          <Link href="/admin">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 h-7 px-3 rounded-full"
            >
              관리자 페이지
            </Button>
          </Link>
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

        {/* 히어로 섹션 */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 shadow-lg shadow-blue-200">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            {isFirebase ? '실시간 현황' : '로컬 현황'}
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">
            AA FC 예약 현황
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            전체 예약{' '}
            <span className="font-black text-blue-600">{totalReserved}</span>명 / {totalCapacity}명
          </p>
        </div>

        {/* 현황 카드 목록 */}
        <div className="space-y-3 mb-8">
          {GROUPS.map((group, i) => {
            const groupData = data[group] || { capacity: 15, reservations: [] };
            const reservations = groupData.reservations || [];
            const count = reservations.length;
            const cap = groupData.capacity;
            const pct = cap > 0 ? Math.min(100, (count / cap) * 100) : 0;
            const isFull = count >= cap;
            const colors = GROUP_COLORS[group];

            return (
              <div
                key={group}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-200"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                    <span className="font-black text-slate-800 text-lg">{group}</span>
                    {isFull && (
                      <span className="text-[10px] font-black text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                        FULL
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-black ${isFull ? 'text-red-500' : colors.text}`}>
                      {count}
                    </span>
                    <span className="text-slate-400 text-sm font-bold"> / {cap}명</span>
                  </div>
                </div>

                {/* 프로그레스 바 */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${isFull ? 'bg-red-400' : colors.bg}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* 예약자 명단 */}
                {reservations.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {reservations.map((r, idx) => (
                      <span key={idx} className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                        {r.grade ? `${r.grade} ` : ''}{r.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 font-bold">아직 예약자가 없습니다</p>
                )}
              </div>
            );
          })}
        </div>

        {/* 예약하기 버튼 */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <Link href="/reserve">
            <Button className="w-full h-14 text-lg font-black rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all duration-200 hover:-translate-y-0.5">
              ⚽ 예약하기
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
