'use client';

import { useState } from 'react';
import { useReservationData } from '@/lib/useReservationData';
import { GROUPS, GROUP_COLORS, verifyAdminPassword } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Link from 'next/link';
import CurrentDate from '@/components/CurrentDate';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  const { 
    data, 
    loading, 
    isFirebase,
    updateGroup, 
    resetAllReservations, 
    removeReservation 
  } = useReservationData();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setAuthError('');
    const ok = await verifyAdminPassword(password);
    setVerifying(false);
    if (ok) {
      setAuthed(true);
    } else {
      setAuthError('비밀번호가 올바르지 않습니다.');
      setPassword('');
    }
  };

  const handleCapacityChange = async (group, delta) => {
    const current = data[group]?.capacity || 15;
    const next = Math.max(1, current + delta);
    try {
      await updateGroup(group, { capacity: next });
    } catch (e) {
      alert('저장 실패. 네트워크를 확인하세요.');
    }
  };

  const handleResetAll = async () => {
    try {
      await resetAllReservations(data);
      setShowResetConfirm(false);
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    } catch (e) {
      alert('초기화 실패. 네트워크를 확인하세요.');
    }
  };

  const handleRemoveOne = async (group, idx) => {
    if (!confirm(`이 예약자를 삭제하시겠습니까?`)) return;
    try {
      await removeReservation(group, idx, data[group]?.reservations || []);
    } catch (e) {
      alert('삭제 실패');
    }
  };

  // 로그인 전 화면
  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-sm animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl backdrop-blur">
              🔒
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter">관리자 인증</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">AA FC 관리자 전용 페이지입니다</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="관리자 비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-center text-lg tracking-widest focus:bg-white/15 focus:border-white/40"
                autoFocus
              />
              {authError && (
                <p className="text-red-400 text-sm font-bold text-center mt-2 animate-in fade-in duration-200">
                  {authError}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={!password || verifying}
              className="w-full h-12 font-black rounded-xl bg-white text-slate-900 hover:bg-slate-100 transition-all"
            >
              {verifying ? '확인 중...' : '입장하기'}
            </Button>
            <div className="text-center">
              <Link href="/" className="text-slate-500 text-sm hover:text-slate-300 transition-colors font-medium">
                ← 메인으로 돌아가기
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 관리자 패널
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span className="text-sm font-bold">메인으로</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm">🔑</span>
            <span className="font-black text-slate-900 tracking-tighter text-sm mr-2">관리자 패널</span>
            <CurrentDate />
          </div>
          <button
            onClick={() => { setAuthed(false); setPassword(''); }}
            className="text-xs text-slate-400 hover:text-red-500 font-bold transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {!isFirebase && (
          <div className="mb-4 flex justify-center">
            <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              Local Admin Mode
            </span>
          </div>
        )}

        {/* 툴바 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">예약 관리</h2>
            <p className="text-slate-400 text-sm">정원 조절 및 예약자 관리</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowResetConfirm(true)}
            className="h-9 px-4 text-sm font-black rounded-xl"
          >
            전체 삭제
          </Button>
        </div>

        {resetDone && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-bold text-center animate-in fade-in duration-300">
            ✅ 모든 예약이 초기화되었습니다
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {GROUPS.map((group) => {
              const groupData = data[group] || { capacity: 15, reservations: [] };
              const reservations = groupData.reservations || [];
              const cap = groupData.capacity;
              const colors = GROUP_COLORS[group];

              return (
                <div key={group} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* 그룹 헤더 */}
                  <div className={`px-5 py-4 ${colors.light} border-b ${colors.border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                        <span className={`font-black text-lg ${colors.text}`}>{group}</span>
                      </div>
                      {/* 정원 조절 */}
                      <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-slate-200 shadow-sm">
                        <span className="text-xs text-slate-400 font-bold mr-1">정원</span>
                        <button
                          onClick={() => handleCapacityChange(group, -1)}
                          className={`w-7 h-7 rounded-lg bg-slate-50 ${colors.text} font-black text-lg flex items-center justify-center hover:bg-slate-100 transition-colors`}
                        >
                          −
                        </button>
                        <span className={`text-lg font-black w-8 text-center ${colors.text}`}>{cap}</span>
                        <button
                          onClick={() => handleCapacityChange(group, 1)}
                          className={`w-7 h-7 rounded-lg bg-slate-50 ${colors.text} font-black text-lg flex items-center justify-center hover:bg-slate-100 transition-colors`}
                        >
                          +
                        </button>
                        <span className="text-xs text-slate-400 font-bold ml-1">명</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-3 bg-white/60 rounded-full overflow-hidden border border-slate-200/50 p-[1px]">
                        <div
                          className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
                          style={{ width: `${cap > 0 ? Math.min(100, (Math.min(cap, reservations.length) / cap) * 100) : 0}%` }}
                        />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-slate-500">
                          정원 {Math.min(cap, reservations.length)}/{cap}
                        </span>
                        {reservations.length > cap && (
                          <span className="text-[10px] font-bold text-amber-500">
                            대기 +{reservations.length - cap}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 예약자 목록 */}
                  <div className="p-5">
                    {reservations.length === 0 ? (
                      <p className="text-slate-300 text-sm font-bold text-center py-2">예약자 없음</p>
                    ) : (
                      <div className="space-y-2">
                          {reservations.map((r, idx) => {
                            const isWaiting = idx >= cap;
                            return (
                              <div key={idx} className={`flex items-center justify-between group p-1.5 rounded-lg transition-colors ${isWaiting ? 'bg-amber-50/50' : ''}`}>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400 font-bold w-5 text-right">{idx + 1}.</span>
                                  {isWaiting && (
                                    <span className="text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-md">대기</span>
                                  )}
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isWaiting ? 'bg-amber-100 text-amber-700' : colors.badge}`}>
                                    {r.grade}
                                  </span>
                                  <span className="text-sm font-bold text-slate-700">
                                    {r.name}
                                    {(r.parentName || r.childName) && (
                                      <span className="text-slate-400 font-medium ml-1">
                                        ({r.parentName || r.childName})
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleRemoveOne(group, idx)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all text-lg font-bold w-6 h-6 flex items-center justify-center"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 전체 삭제 확인 다이얼로그 */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">모든 예약 삭제</DialogTitle>
            <DialogDescription className="text-slate-500">
              모든 예약자 정보가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              <br />정원 수는 유지됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(false)}
              className="flex-1 font-bold"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetAll}
              className="flex-1 font-black"
            >
              삭제 확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
