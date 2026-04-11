export const GROUPS = ['하이반', '미들반', '루키반', '아버지', '어머니'];
export const WAITING_CAPACITY = 3;

export const GRADE_OPTIONS = [
  '4살', '5살', '6살', '7살',
  '초등 1학년', '초등 2학년', '초등 3학년',
  '초등 4학년', '초등 5학년', '초등 6학년',
  '중등 1학년', '중등 2학년', '중등 3학년',
];

export const INITIAL_DATA = {
  '하이반': { capacity: 15, reservations: [] },
  '미들반': { capacity: 15, reservations: [] },
  '루키반': { capacity: 15, reservations: [] },
  '아버지': { capacity: 15, reservations: [] },
  '어머니': { capacity: 15, reservations: [] },
};

export const GROUP_COLORS = {
  '하이반': { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  '미들반': { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  '루키반': { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
  '아버지': { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  '어머니': { bg: 'bg-pink-500', light: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700' },
};

// 관리자 비밀번호 검증 (SHA-256 해시 비교)
export async function verifyAdminPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const targetHash = process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HASH;
  console.log('Input Hash:', hashHex);
  console.log('Target Hash:', targetHash);
  
  return hashHex === targetHash;
}
