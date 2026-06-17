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
import CurrentDate from '@/components/CurrentDate';

function FormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 파라미터 파싱
  const typesParam = searchParams.get('types') || '';
  const waitlistTypesParam = searchParams.get('waitlistTypes') || '';
  const selectedTypes = typesParam ? typesParam.split(',').filter(Boolean) : [];
  const waitlistTypes = waitlistTypesParam ? waitlistTypesParam.split(',').filter(Boolean) : [];
  const allTypes = [...selectedTypes, ...waitlistTypes];

  const { data: dbData, addReservations, addWaitlistEntries } = useReservationData();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // 완료 시 어떤 반이 대기로 등록됐는지 기록
  const [submittedWaitlistGroups, setSubmittedWaitlistGroups] = useState([]);

  // 각 타입별 입력 폼 상태
  const [forms, setForms] = useState(() => {
    const initial = {};
    allTypes.forEach(g => {
      if (g === '아버지' || g === '어머니') {
        initial[g] = [{ role: '참관', name: '', childName: '', level: '' }];
      } else {
        initial[g] = [{ grade: '', name: '', parentName: '' }];
      }
    });
    return initial;
  });

  useEffect(() => {
    if (!allTypes.length) router.replace('/reserve');
  }, []);

  const isWaitlistGroup = (group) => waitlistTypes.includes(group);

  // 행 추가 (대기 그룹은 waitlistCapacity 기준으로 체크)
  const addRow = (group) => {
    const groupData = dbData[group] || { capacity: 15, reservations: [], waitlistCapacity: 5, waitlist: [] };
    const currentFormRows = forms[group]?.length || 0;

    if (isWaitlistGroup(group)) {
      const currentWaitlistCount = (groupData.waitlist || []).length;
      const maxWaitlist = groupData.waitlistCapacity ?? 5;
      if (currentWaitlistCount + currentFormRows >= maxWaitlist) {
        alert(`[${group}] 대기 정원(${maxWaitlist}명)이 가득 찼습니다.`);
        return;
      }
    } else {
      const currentCount = (groupData.reservations || []).length;
      const maxAllowed = groupData.capacity;
      if (currentCount + currentFormRows >= maxAllowed) {
        alert(`[${group}] 정원(${maxAllowed}명)이 가득 찼습니다.`);
        return;
      }
    }

    const newRow = (group === '아버지' || group === '어머니')
      ? { role: '참관', name: '', childName: '', level: '' }
      : { grade: '', name: '', parentName: '' };
    setForms(prev => ({ ...prev, [group]: [...prev[group], newRow] }));
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
        [field]: (field === 'name' || field === 'parentName' || field === 'childName')
          ? value.replace(/\s/g, '')
          : value,
      };
      if (field === 'role' && value === '참관') rows[idx].level = '';
      return { ...prev, [group]: rows };
    });
  };

  const handleSubmit = async () => {
    // ── 유효성 검사 ──
    for (const group of allTypes) {
      const rows = forms[group] || [];
      const hasEntry = rows.some(r => r.name.trim());
      if (!hasEntry) {
        alert(`[${group}] 에 최소 한 명의 이름을 입력해주세요.`);
        return;
      }
      for (const r of rows) {
        if (r.name.trim()) {
          if (group === '아버지' || group === '어머니') {
            if (r.role === '참여' && !r.level) {
              alert(`[${group}] 참여 시 뛸 반(하이/미들/루키)을 선택해주세요.`);
              return;
            }
            if (!r.childName.trim()) {
              alert(`[${group}] 동명이인 방지를 위해 자녀 이름을 입력해주세요.`);
              return;
            }
          } else {
            if (!r.grade) {
              alert(`[${group}] 학년을 선택해주세요.`);
              return;
            }
            if (!r.parentName.trim()) {
              alert(`[${group}] 동명이인 방지를 위해 부모님 성함을 입력해주세요.`);
              return;
            }
          }
        }
      }

      // 정원/대기 정원 초과 검증
      const groupData = dbData[group] || { capacity: 15, reservations: [], waitlistCapacity: 5, waitlist: [] };
      const newEntriesCount = rows.filter(r => r.name.trim()).length;

      if (isWaitlistGroup(group)) {
        const currentWaitlistCount = (groupData.waitlist || []).length;
        const maxWaitlist = groupData.waitlistCapacity ?? 5;
        if (currentWaitlistCount + newEntriesCount > maxWaitlist) {
          alert(`[${group}] 대기 정원(${maxWaitlist}명)을 초과했습니다.`);
          return;
        }
      } else {
        const currentCount = (groupData.reservations || []).length;
        if (currentCount + newEntriesCount > groupData.capacity) {
          alert(`[${group}] 신청 중 인원이 가득 찼습니다 (최대 ${groupData.capacity}명).`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      // 일반 예약 / 대기 신청 분리
      const normalEntriesByGroup = {};
      const waitlistEntriesByGroup = {};

      for (const group of allTypes) {
        const rows = forms[group] || [];
        const entries = rows
          .filter(r => r.name.trim())
          .map(r => {
            if (group === '아버지' || group === '어머니') {
              return {
                grade: r.role === '참여' ? `${r.role}(${r.level})` : r.role,
                name: r.name.trim(),
                childName: r.childName.trim(),
              };
            }
            return {
              grade: r.grade,
              name: r.name.trim(),
              parentName: r.parentName.trim(),
            };
          });

        if (entries.length) {
          if (isWaitlistGroup(group)) {
            waitlistEntriesByGroup[group] = entries;
          } else {
            normalEntriesByGroup[group] = entries;
          }
        }
      }

      // 각각 저장 후 localStorage에 ID 기록
      const allAddedIds = [];

      if (Object.keys(normalEntriesByGroup).length) {
        const added = await addReservations(normalEntriesByGroup);
        if (typeof window !== 'undefined' && added) {
          Object.values(added).forEach(groupEntries =>
            groupEntries.forEach(e => allAddedIds.push(e.id))
          );
        }
      }

      if (Object.keys(waitlistEntriesByGroup).length) {
        const added = await addWaitlistEntries(waitlistEntriesByGroup);
        if (typeof window !== 'undefined' && added) {
          Object.values(added).forEach(groupEntries =>
            groupEntries.forEach(e => allAddedIds.push(e.id))
          );
        }
      }

      if (typeof window !== 'undefined' && allAddedIds.length) {
        const myIds = JSON.parse(localStorage.getItem('aafc_my_reservations') || '[]');
        localStorage.setItem('aafc_my_reservations', JSON.stringify([...myIds, ...allAddedIds]));
      }

      setSubmittedWaitlistGroups(waitlistTypes);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 완료 화면 ──
  if (submitted) {
    const hasWaitlist = submittedWaitlistGroups.length > 0;
    const hasNormal = selectedTypes.length > 0;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center px-4">
        <div className="text-center animate-in fade-in zoom-in duration-500 max-w-sm w-full">
          <div className="text-6xl mb-4">{hasWaitlist && !hasNormal ? '⏳' : '⚽'}</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
            {hasWaitlist && !hasNormal ? '대기 신청 완료!' : '접수 완료!'}
          </h2>
          <p className="text-slate-500 mb-5">
            {hasWaitlist && !hasNormal
              ? '대기자 명단에 등록되었습니다.'
              : hasWaitlist
                ? '예약 및 대기 신청이 완료되었습니다.'
                : '예약이 성공적으로 접수되었습니다.'
            }
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {selectedTypes.map(g => (
              <span key={g} className={`text-sm font-bold px-3 py-1 rounded-full ${GROUP_COLORS[g].badge}`}>
                {g} ✓
              </span>
            ))}
            {submittedWaitlistGroups.map(g => (
              <span key={`w-${g}`} className="text-sm font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                ⏳ {g} 대기
              </span>
            ))}
          </div>
          {hasWaitlist && (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-bold text-center">
              자리가 생기면 관리자가 연락드립니다 📞
            </div>
          )}
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
          <div className="w-24 flex justify-end">
            <CurrentDate />
          </div>
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
          {allTypes.map((group) => {
            const groupData = dbData[group] || { capacity: 15, reservations: [], waitlistCapacity: 5, waitlist: [] };
            const isWaitlist = isWaitlistGroup(group);

            const currentCount = isWaitlist
              ? (groupData.waitlist || []).length
              : (groupData.reservations || []).length;
            const cap = isWaitlist
              ? (groupData.waitlistCapacity ?? 5)
              : groupData.capacity;
            const isFull = currentCount >= cap;
            const colors = GROUP_COLORS[group];
            const rows = forms[group] || [{ grade: '', name: '' }];

            return (
              <div key={group} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isWaitlist ? 'border-amber-200' : 'border-slate-100'}`}>
                {/* 반 헤더 */}
                <div className={`px-5 py-4 border-b ${isWaitlist ? 'bg-amber-50 border-amber-200' : `${colors.light} ${colors.border}`}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${isWaitlist ? 'bg-amber-400' : colors.bg}`} />
                      <span className={`font-black text-xl ${isWaitlist ? 'text-amber-600' : colors.text}`}>{group}</span>
                      {isWaitlist && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-700">
                          ⏳ 대기 신청
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${isFull ? 'text-red-500' : isWaitlist ? 'text-amber-600' : 'text-slate-500'}`}>
                        {isWaitlist ? '대기 ' : '현재 '}
                        <span className={`text-lg ${isFull ? 'text-red-500' : isWaitlist ? 'text-amber-600' : colors.text}`}>
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
                  <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isWaitlist ? 'bg-amber-100' : 'bg-white/60'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-400' : isWaitlist ? 'bg-amber-400' : colors.bg}`}
                      style={{ width: `${cap > 0 ? Math.min(100, (currentCount / cap) * 100) : 0}%` }}
                    />
                  </div>
                </div>

                {/* 입력 행들 */}
                <div className="p-5 space-y-3">
                  {rows.map((row, idx) => (
                    <div
                      key={idx}
                      className="space-y-2 pb-4 border-b border-slate-50 last:border-0 last:pb-0 animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                      <div className="flex gap-2 items-center">
                        {/* 학년/역할 선택 */}
                        {(group === '아버지' || group === '어머니') ? (
                          <Select
                            value={row.role || '참관'}
                            onValueChange={(val) => updateRow(group, idx, 'role', val)}
                          >
                            <SelectTrigger className="w-24 shrink-0 h-11 text-sm font-medium">
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="참관" className="text-sm">참관</SelectItem>
                              <SelectItem value="참여" className="text-sm">참여</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Select
                            value={row.grade}
                            onValueChange={(val) => updateRow(group, idx, 'grade', val)}
                          >
                            <SelectTrigger className="w-32 shrink-0 h-11 text-sm font-medium">
                              <SelectValue placeholder="학년 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {GRADE_OPTIONS.map(g => (
                                <SelectItem key={g} value={g} className="text-sm">{g}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        <Input
                          type="text"
                          placeholder="성함 (띄어쓰기 제거)"
                          value={row.name}
                          onChange={(e) => updateRow(group, idx, 'name', e.target.value)}
                          className="flex-1 h-11 text-sm font-medium"
                        />

                        {rows.length > 1 && (
                          <button
                            onClick={() => removeRow(group, idx)}
                            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-400 transition-all duration-150 text-lg font-bold shrink-0"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* 추가 정보 */}
                      <div className="flex gap-2 pl-1">
                        {(group === '아버지' || group === '어머니') && row.role === '참여' && (
                          <Select
                            value={row.level}
                            onValueChange={(val) => updateRow(group, idx, 'level', val)}
                          >
                            <SelectTrigger className="w-32 shrink-0 h-10 text-xs font-bold bg-blue-50 border-blue-100 text-blue-600">
                              <SelectValue placeholder="뛸 반 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="하이" className="text-xs">하이반</SelectItem>
                              <SelectItem value="미들" className="text-xs">미들반</SelectItem>
                              <SelectItem value="루키" className="text-xs">루키반</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Input
                          type="text"
                          placeholder={(group === '아버지' || group === '어머니') ? '자녀 이름 (동명이인 방지용)' : '부모님 성함 (동명이인 방지용)'}
                          value={(group === '아버지' || group === '어머니') ? row.childName : row.parentName}
                          onChange={(e) => updateRow(group, idx, (group === '아버지' || group === '어머니') ? 'childName' : 'parentName', e.target.value)}
                          className="flex-1 h-10 text-xs font-medium bg-slate-50/50 border-dashed"
                        />
                        {rows.length > 1 && <div className="w-11 shrink-0" />}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 인원 추가 버튼 */}
                <div className="px-5 pb-5 flex flex-col items-center gap-2">
                  {currentCount + rows.length < cap ? (
                    <button
                      onClick={() => addRow(group)}
                      className={`flex items-center gap-2 text-sm font-black px-5 py-2.5 rounded-xl border-2 border-dashed transition-all duration-150
                        ${isWaitlist
                          ? 'border-amber-200 text-amber-600 bg-amber-50 hover:opacity-80'
                          : `${colors.border} ${colors.text} ${colors.light} hover:opacity-80`
                        }`}
                    >
                      <span className="text-lg">+</span>
                      인원 추가하기
                    </button>
                  ) : (
                    <div className={`text-[10px] font-black px-3 py-2 rounded-xl border border-dashed ${isWaitlist ? 'text-amber-500 bg-amber-50 border-amber-200' : 'text-slate-400 bg-slate-50 border-slate-200'}`}>
                      {isWaitlist ? `대기 정원에 도달했습니다 (최대 ${cap}명)` : `신청 가능 인원에 도달했습니다 (최대 ${cap}명)`}
                    </div>
                  )}
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
            ) : waitlistTypes.length > 0 && selectedTypes.length === 0
              ? '⏳ 대기 신청하기'
              : '✅ 접수하기'
            }
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
