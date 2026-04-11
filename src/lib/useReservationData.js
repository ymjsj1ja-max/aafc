'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GROUPS, INITIAL_DATA } from '@/lib/constants';

const USE_FIREBASE = process.env.NEXT_PUBLIC_USE_FIREBASE === 'true';
const LS_KEY = 'aafc_dev_data';

// ── LocalStorage 헬퍼 ────────────────────────────────────────────────────────
function lsRead() {
  if (typeof window === 'undefined') return { ...INITIAL_DATA };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...INITIAL_DATA };
    const parsed = JSON.parse(raw);
    // 누락된 그룹 채우기
    const merged = { ...INITIAL_DATA };
    GROUPS.forEach(g => { if (parsed[g]) merged[g] = parsed[g]; });
    return merged;
  } catch {
    return { ...INITIAL_DATA };
  }
}

function lsWrite(data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

// ── 로컬 이벤트 버스 (LocalStorage 변경을 구독자들에게 broadcast) ─────────────
const listeners = new Set();
function notifyAll(data) {
  listeners.forEach(fn => fn(data));
}

// ── 메인 훅: useReservationData ───────────────────────────────────────────────
/**
 * Firebase 또는 LocalStorage 중 하나를 자동 선택하여
 * 실시간 데이터를 구독하고 쓰기 함수를 반환합니다.
 *
 * NEXT_PUBLIC_USE_FIREBASE=true 환경변수가 있을 때만 Firebase 사용.
 * 그 외에는 LocalStorage + 인메모리 이벤트 버스로 동작.
 */
export function useReservationData() {
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!USE_FIREBASE) {
      // ── LocalStorage 모드 ─────────────────────────────────────────────────
      setData(lsRead());
      setLoading(false);

      const handler = (newData) => setData({ ...newData });
      listeners.add(handler);
      return () => listeners.delete(handler);
    }

    // ── Firebase 모드 ─────────────────────────────────────────────────────
    let unsubscribe = () => {};
    (async () => {
      const { ref, onValue } = await import('firebase/database');
      const { db } = await import('@/lib/firebase');
      const dbRef = ref(db, 'aafc');
      unsubscribe = onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const merged = { ...INITIAL_DATA };
          GROUPS.forEach(g => { if (val[g]) merged[g] = val[g]; });
          setData(merged);
        }
        setLoading(false);
      }, () => setLoading(false));
      unsubRef.current = unsubscribe;
    })();

    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  /** 데이터 전체를 덮어씁니다 */
  const writeData = useCallback(async (newData) => {
    if (!USE_FIREBASE) {
      lsWrite(newData);
      notifyAll(newData);
      return;
    }
    const { ref, set } = await import('firebase/database');
    const { db } = await import('@/lib/firebase');
    await set(ref(db, 'aafc'), newData);
  }, []);

  /** 특정 그룹의 특정 경로만 업데이트합니다 */
  const updateGroup = useCallback(async (group, patch) => {
    if (!USE_FIREBASE) {
      const current = lsRead();
      const updated = {
        ...current,
        [group]: { ...current[group], ...patch },
      };
      lsWrite(updated);
      notifyAll(updated);
      return;
    }
    const { ref, update } = await import('firebase/database');
    const { db } = await import('@/lib/firebase');
    await update(ref(db, `aafc/${group}`), patch);
  }, []);

  /** 예약 추가: 여러 그룹에 한번에 entries 추가 */
  const addReservations = useCallback(async (entriesByGroup) => {
    if (!USE_FIREBASE) {
      const current = lsRead();
      const updated = { ...current };
      const processedEntriesByGroup = {};
      
      Object.entries(entriesByGroup).forEach(([group, entries]) => {
        const withIds = entries.map(ent => ({
          ...ent,
          id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
        processedEntriesByGroup[group] = withIds;
        const prev = updated[group]?.reservations || [];
        updated[group] = { ...updated[group], reservations: [...prev, ...withIds] };
      });
      lsWrite(updated);
      notifyAll(updated);
      return processedEntriesByGroup;
    }
    // Firebase: 최신 데이터 읽어서 merge 후 set
    const { ref, get, set } = await import('firebase/database');
    const { db } = await import('@/lib/firebase');
    const snapshot = await get(ref(db, 'aafc'));
    const latest = snapshot.exists() ? snapshot.val() : {};
    const newData = { ...INITIAL_DATA };
    GROUPS.forEach(g => { if (latest[g]) newData[g] = { ...latest[g] }; });
    
    // ID가 포함된 새로운 항목들 생성
    const processedEntriesByGroup = {};
    Object.entries(entriesByGroup).forEach(([group, entries]) => {
      processedEntriesByGroup[group] = entries.map(ent => ({
        ...ent,
        id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
    });

    Object.entries(processedEntriesByGroup).forEach(([group, entries]) => {
      const prev = newData[group]?.reservations || [];
      newData[group] = { ...newData[group], reservations: [...prev, ...entries] };
    });
    await set(ref(db, 'aafc'), newData);
    return processedEntriesByGroup; // 생성된 ID 포함 데이터 반환
  }, []);

  /** 모든 예약자 삭제 (정원은 유지) */
  const resetAllReservations = useCallback(async (currentData) => {
    const resetData = {};
    GROUPS.forEach(g => {
      resetData[g] = { capacity: currentData[g]?.capacity || 15, reservations: [] };
    });
    if (!USE_FIREBASE) {
      lsWrite(resetData);
      notifyAll(resetData);
      return;
    }
    const { ref, set } = await import('firebase/database');
    const { db } = await import('@/lib/firebase');
    await set(ref(db, 'aafc'), resetData);
  }, []);

  /** 특정 그룹의 특정 ID 예약자 삭제 */
  const removeReservation = useCallback(async (group, reservationId, currentReservations) => {
    const next = currentReservations.filter(r => r.id !== reservationId);
    if (next.length === currentReservations.length) return; // 이미 삭제되었거나 ID 불일치

    if (!USE_FIREBASE) {
      const current = lsRead();
      const updated = { ...current, [group]: { ...current[group], reservations: next } };
      lsWrite(updated);
      notifyAll(updated);
      return;
    }
    const { ref, update } = await import('firebase/database');
    const { db } = await import('@/lib/firebase');
    await update(ref(db, `aafc/${group}`), { reservations: next });
  }, []);

  return {
    data,
    loading,
    isFirebase: USE_FIREBASE,
    writeData,
    updateGroup,
    addReservations,
    resetAllReservations,
    removeReservation,
  };
}
