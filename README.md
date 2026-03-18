# ⚽ AA FC 풋살 예약 시스템

> AA FC 풋살 클럽의 **실시간 예약 시스템**입니다.  
> Firebase Realtime Database를 통해 모든 사용자가 동시에 예약 현황을 확인하고 예약할 수 있습니다.

---

## 📋 목차

- [기술 스택](#-기술-스택)
- [주요 기능](#-주요-기능)
- [프로젝트 구조](#-프로젝트-구조)
- [Firebase 구성](#-firebase-구성)
- [환경변수 설정](#-환경변수-설정)
- [로컬 개발](#-로컬-개발)
- [빌드 및 배포](#-빌드-및-배포)
- [페이지별 상세 설명](#-페이지별-상세-설명)
- [핵심 모듈 설명](#-핵심-모듈-설명)
- [관리자 기능](#-관리자-기능)
- [데이터 구조 (Firebase)](#-데이터-구조-firebase)
- [트러블슈팅](#-트러블슈팅)

---

## 🛠 기술 스택

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **프레임워크** | Next.js (App Router) | 16.1.6 | React 기반 SSG(정적 빌드) |
| **UI 라이브러리** | React | 19.2.3 | 컴포넌트 기반 UI |
| **스타일링** | Tailwind CSS v4 | ^4 | 유틸리티 퍼스트 CSS |
| **UI 컴포넌트** | shadcn/ui (base-nova) | ^4.0.8 | 사전 빌드된 UI 컴포넌트 |
| **데이터베이스** | Firebase Realtime Database | ^12.10.0 | 실시간 데이터 동기화 |
| **호스팅** | Firebase Hosting | — | 정적 사이트 배포 |
| **아이콘** | Lucide React | ^0.577.0 | SVG 아이콘 |
| **경로 별칭** | `@/` → `src/` | — | `jsconfig.json`에서 설정 |

---

## ✨ 주요 기능

### 사용자 기능
- 📊 **실시간 예약 현황 대시보드** — 5개 반(하이반, 미들반, 루키반, 아버지, 어머니)의 예약 상태 실시간 표시
- 📝 **다중 반 예약** — 여러 반을 동시에 선택하여 예약 가능
- 🔄 **실시간 동기화** — Firebase를 통해 모든 기기에서 실시간 업데이트
- 📱 **반응형 디자인** — 모바일/태블릿/데스크톱 모두 지원
- 🚫 **정원 초과 방지** — 정원 마감 시 해당 반 예약 자동 차단

### 관리자 기능
- 🔒 **SHA-256 비밀번호 인증** — 해시 기반 보안 비밀번호 검증
- ⚙️ **정원 조절** — 각 반별 정원 수 실시간 조절 (+/- 버튼)
- 🗑️ **개별 예약 삭제** — 특정 예약자 개별 삭제
- 🔄 **전체 초기화** — 모든 예약 데이터 일괄 삭제 (정원 수는 유지)

### 개발 모드
- 💾 **LocalStorage 폴백** — Firebase 없이 로컬 개발 가능
- 🏷️ **모드 표시 배지** — Firebase/Local 모드 자동 식별 표시

---

## 📁 프로젝트 구조

```
aafc/
├── src/
│   ├── app/                           # Next.js App Router 페이지
│   │   ├── layout.js                  # 루트 레이아웃 (Pretendard 폰트, 메타데이터)
│   │   ├── page.js                    # 홈 — 예약 현황 대시보드
│   │   ├── globals.css                # 전역 스타일 (Tailwind CSS v4)
│   │   ├── favicon.ico                # 파비콘
│   │   ├── admin/
│   │   │   └── page.js                # 관리자 — 비밀번호 인증 + 관리 패널
│   │   └── reserve/
│   │       ├── page.js                # 예약 STEP 1 — 반 선택 (다중)
│   │       └── form/
│   │           └── page.js            # 예약 STEP 2 — 이름/학년 입력 + 제출
│   ├── components/
│   │   └── ui/                        # shadcn/ui 컴포넌트 (base-nova 스타일)
│   │       ├── badge.jsx
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       ├── dialog.jsx
│   │       ├── input.jsx
│   │       ├── progress.jsx
│   │       └── select.jsx
│   └── lib/
│       ├── constants.js               # 상수 (반 이름, 학년 옵션, 색상 테마, 관리자 인증)
│       ├── firebase.js                # Firebase 앱 초기화 + DB export
│       ├── useReservationData.js       # ★ 핵심 훅: 데이터 CRUD + 실시간 구독
│       └── utils.js                   # cn() 유틸 (clsx + tailwind-merge)
├── public/                            # 정적 파일 (SVG 아이콘)
├── .env.local                         # ⚠️ 환경변수 (git 제외, 직접 생성 필요)
├── firebase.json                      # Firebase Hosting + Database 설정
├── .firebaserc                        # Firebase 프로젝트 ID 연결
├── database.rules.json                # Realtime Database 보안 규칙
├── next.config.mjs                    # Next.js 설정 (output: 'export' 정적 빌드)
├── components.json                    # shadcn/ui 설정
├── check_hash.js                      # 관리자 비밀번호 SHA-256 해시 생성 도구
├── DEPLOYMENT.md                      # 배포 가이드 (상세 단계별)
├── package.json                       # 의존성 및 스크립트
└── .gitignore                         # Git 제외 목록
```

---

## 🔥 Firebase 구성

### Firebase 서비스 사용 목록

| 서비스 | 용도 | 설정 파일 |
|--------|------|-----------|
| **Realtime Database** | 예약 데이터 저장 및 실시간 동기화 | `database.rules.json` |
| **Hosting** | 정적 빌드 결과물(`/out`) 배포 | `firebase.json` |

### Firebase 프로젝트 정보

```
프로젝트 ID: aa-fc-reservation
DB 리전:    asia-southeast1 (싱가포르)
DB URL:     https://aa-fc-reservation-default-rtdb.asia-southeast1.firebasedatabase.app
```

### `firebase.json` — 호스팅 + DB 설정

```json
{
  "hosting": {
    "public": "out",          // Next.js 정적 빌드 출력 폴더
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }  // SPA 라우팅
    ]
  },
  "database": {
    "rules": "database.rules.json"  // DB 보안 규칙 파일 경로
  }
}
```

### `database.rules.json` — 보안 규칙

```json
{
  "rules": {
    "aafc": {
      ".read": true,
      ".write": true
    }
  }
}
```

> ⚠️ **보안 주의**: 현재 `aafc` 경로는 누구나 읽기/쓰기 가능합니다.  
> 프로덕션 운영 시 Firebaee Authentication을 추가하여 인증된 사용자만 쓰기를 허용하는 것을 권장합니다.

### Firebase 초기화 코드 (`src/lib/firebase.js`)

```javascript
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL:       process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 중복 초기화 방지: 이미 초기화된 앱이 있으면 재사용
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getDatabase(app);
```

---

## 🔐 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성해야 합니다 (`.gitignore`에 의해 git에 포함되지 않음).

```env
# Firebase 모드 활성화 (false = LocalStorage 모드)
NEXT_PUBLIC_USE_FIREBASE=true

# Firebase SDK 설정값
NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://<project-id>-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<project-id>.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>

# 관리자 비밀번호 SHA-256 해시
# 기본 비밀번호: 0000
NEXT_PUBLIC_ADMIN_PASSWORD_HASH=<sha256-hash>
```

### 환경변수 동작 방식

| 변수 | 값 | 동작 |
|------|-----|------|
| `NEXT_PUBLIC_USE_FIREBASE` | `true` | Firebase Realtime DB 사용 (배포 모드) |
| `NEXT_PUBLIC_USE_FIREBASE` | `false` 또는 미설정 | LocalStorage 사용 (개발 모드) |

### 관리자 비밀번호 변경

```bash
node check_hash.js
# → 원하는 비밀번호 입력 → SHA-256 해시 출력
# → 출력된 해시를 .env.local의 NEXT_PUBLIC_ADMIN_PASSWORD_HASH에 설정
```

---

## 💻 로컬 개발

### 사전 요구사항

- **Node.js** ≥ 18 (권장: v20+)
- **npm** (Node.js와 함께 설치됨)

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev

# 3. 브라우저에서 접속
# → http://localhost:3000
```

### 로컬 모드 vs Firebase 모드

| | 로컬 모드 | Firebase 모드 |
|---|-----------|---------------|
| **데이터 저장소** | LocalStorage | Firebase Realtime DB |
| **실시간 동기화** | 같은 브라우저 탭 간만 | 모든 기기 간 실시간 |
| **설정** | `NEXT_PUBLIC_USE_FIREBASE=false` | `NEXT_PUBLIC_USE_FIREBASE=true` |
| **용도** | UI 개발, 디자인 작업 | 실제 운영, 테스트 |
| **표시** | 🟡 "Local Dev Mode" 배지 | 🟢 "실시간 현황" 배지 |

---

## 🚀 빌드 및 배포

### 정적 빌드

```bash
# Next.js 정적 빌드 (결과: /out 폴더)
npm run build
```

> `next.config.mjs`에서 `output: 'export'`로 설정되어 있어 **정적 HTML**로 빌드됩니다.

### Firebase 배포

```bash
# Firebase CLI 전역 설치 (최초 1회)
npm install -g firebase-tools

# Firebase 로그인 (최초 1회)
firebase login

# 빌드 + 배포
npm run build
firebase deploy
```

### 배포 후 접속 URL

```
https://aa-fc-reservation.web.app
https://aa-fc-reservation.firebaseapp.com
```

### 코드 수정 → 재배포 플로우

```bash
# 1. 코드 수정

# 2. 빌드
npm run build

# 3. 배포
firebase deploy

# 4. (선택) Git 커밋
git add .
git commit -m "변경 내용 설명"
git push
```

---

## 📄 페이지별 상세 설명

### `/` — 예약 현황 대시보드 (`src/app/page.js`)

| 항목 | 설명 |
|------|------|
| **역할** | 5개 반의 예약 현황을 실시간으로 보여주는 메인 페이지 |
| **데이터** | `useReservationData()` 훅으로 Firebase 실시간 구독 |
| **표시 정보** | 반별 예약자 수, 정원, 프로그레스 바, 예약자 명단(이름+학년 배지) |
| **상태 표시** | 정원 초과 시 `FULL` 배지 + 빨간색 강조 |
| **네비게이션** | "예약하기" 버튼 → `/reserve`, "관리자 페이지" 버튼 → `/admin` |

### `/reserve` — 반 선택 STEP 1 (`src/app/reserve/page.js`)

| 항목 | 설명 |
|------|------|
| **역할** | 예약할 반을 선택하는 첫 번째 단계 |
| **기능** | 다중 선택 가능, 정원 마감된 반은 선택 불가 |
| **상태** | 선택된 반 배지 하단 표시 |
| **네비게이션** | "다음 단계로" → `/reserve/form?types=선택된반들` |

### `/reserve/form` — 예약 폼 STEP 2 (`src/app/reserve/form/page.js`)

| 항목 | 설명 |
|------|------|
| **역할** | 이름과 학년을 입력하고 예약을 완료하는 두 번째 단계 |
| **입력** | URL 쿼리 파라미터(`types`)로 선택된 반 수신 |
| **데이터 제출** | `addReservations()` 으로 선택된 모든 반에 예약자 추가 |
| **학년 옵션** | 4살 ~ 중등 3학년 (13개 옵션) |

### `/admin` — 관리자 패널 (`src/app/admin/page.js`)

| 항목 | 설명 |
|------|------|
| **역할** | 예약 관리 (정원 조절, 예약 삭제) |
| **인증** | SHA-256 해시 비교 방식의 비밀번호 인증 |
| **기능** | 반별 정원 +/- 조절, 개별 예약 삭제, 전체 초기화 |
| **보안** | 비밀번호 해시 값은 환경변수로 관리 |

---

## 🧩 핵심 모듈 설명

### `src/lib/useReservationData.js` — 데이터 관리 훅

> **프로젝트의 가장 핵심 모듈.** Firebase와 LocalStorage 모드를 자동으로 전환하며, 모든 CRUD 작업을 처리합니다.

#### 반환값

```javascript
const {
  data,                   // 전체 예약 데이터 객체
  loading,                // 데이터 로딩 중 여부
  isFirebase,             // Firebase 모드 사용 여부
  writeData,              // 전체 데이터 덮어쓰기
  updateGroup,            // 특정 그룹 부분 업데이트 (정원 변경 등)
  addReservations,        // 예약 추가 (여러 그룹에 한번에)
  resetAllReservations,   // 전체 예약 삭제 (정원 유지)
  removeReservation,      // 특정 그룹의 특정 인덱스 예약 삭제
} = useReservationData();
```

#### 동작 방식

```
NEXT_PUBLIC_USE_FIREBASE=true
  └→ Firebase Realtime DB의 /aafc 경로에 onValue 리스너 등록
  └→ 데이터 변경 시 자동으로 state 업데이트 (실시간)

NEXT_PUBLIC_USE_FIREBASE=false
  └→ LocalStorage 'aafc_dev_data' 키 사용
  └→ 인메모리 이벤트 버스로 같은 탭 내 컴포넌트 간 동기화
```

#### Firebase 모드에서의 데이터 흐름

```
[사용자 예약] → addReservations()
  → get(ref(db, 'aafc'))        ← 최신 데이터 읽기
  → merge (기존 + 신규 예약)
  → set(ref(db, 'aafc'), data)  ← 전체 데이터 쓰기
  → onValue 리스너가 자동 감지  ← 모든 클라이언트에 push
```

### `src/lib/constants.js` — 상수 및 설정

| Export | 설명 |
|--------|------|
| `GROUPS` | 반 이름 배열: `['하이반', '미들반', '루키반', '아버지', '어머니']` |
| `GRADE_OPTIONS` | 학년 선택 옵션 배열 (4살 ~ 중등 3학년) |
| `INITIAL_DATA` | 초기 데이터 구조 (각 반 정원 15명, 빈 예약 배열) |
| `GROUP_COLORS` | 반별 색상 테마 (Tailwind 클래스 매핑) |
| `verifyAdminPassword()` | SHA-256 해시를 이용한 비밀번호 검증 함수 |

### `src/lib/firebase.js` — Firebase 초기화

- `initializeApp()`으로 Firebase 앱 초기화
- `getApps()` 체크로 중복 초기화 방지
- `db` (Realtime Database 인스턴스) export

---

## 🔒 관리자 기능

### 인증 방식

```
사용자 입력 → SHA-256 해시 변환 → 환경변수의 해시값과 비교
```

- 비밀번호 원문은 어디에도 저장되지 않음 (해시만 `.env.local`에 저장)
- 클라이언트 사이드 검증 (서버 불필요)

### 비밀번호 변경 절차

1. `node check_hash.js` 실행
2. 새 비밀번호 입력 → SHA-256 해시 출력
3. `.env.local`의 `NEXT_PUBLIC_ADMIN_PASSWORD_HASH` 값 교체
4. `npm run build` → `firebase deploy`

---

## 📊 데이터 구조 (Firebase)

### Realtime Database 경로

```
/aafc
  ├── /하이반
  │     ├── capacity: 15              (number)
  │     └── reservations: [           (array)
  │           { name: "홍길동", grade: "초등 3학년" },
  │           { name: "김철수", grade: "5살" },
  │           ...
  │         ]
  ├── /미들반
  │     ├── capacity: 15
  │     └── reservations: [...]
  ├── /루키반
  │     ├── capacity: 15
  │     └── reservations: [...]
  ├── /아버지
  │     ├── capacity: 15
  │     └── reservations: [...]
  └── /어머니
        ├── capacity: 15
        └── reservations: [...]
```

### 예약 항목 스키마

```typescript
interface Reservation {
  name: string;   // 예약자 이름
  grade: string;  // 학년 (예: "초등 3학년", "5살")
}

interface GroupData {
  capacity: number;             // 정원 (기본: 15)
  reservations: Reservation[];  // 예약자 목록
}
```

---

## 🔧 트러블슈팅

### 빌드 관련

| 증상 | 원인 | 해결 |
|------|------|------|
| `'next' is not recognized` | `npm install` 미실행 | `npm install` 실행 |
| `Turbopack build failed` | node_modules 손상 | `rm -rf node_modules && npm install` |
| 빌드 후 `/out` 폴더 없음 | `next.config.mjs` 설정 문제 | `output: 'export'` 확인 |

### Firebase 관련

| 증상 | 원인 | 해결 |
|------|------|------|
| 예약 저장 안 됨 | `NEXT_PUBLIC_USE_FIREBASE=false` | `.env.local`에서 `true`로 변경 |
| DB 연결 실패 | `.env.local` 값 오류 | SDK config 값 재확인 |
| 권한 에러 | `database.rules.json` 규칙 | `aafc` 경로 read/write `true` 확인 |
| 배포 시 권한 에러 | 잘못된 계정 로그인 | `firebase logout` → `firebase login` |
| `firebase deploy` 실패 | 빌드 안 함 | `npm run build` 후 재시도 |

### 관리자 관련

| 증상 | 원인 | 해결 |
|------|------|------|
| 비밀번호 불일치 | 해시 값 불일치 | `node check_hash.js`로 해시 재생성 |
| 관리자 페이지 빈 화면 | 빌드 후 미배포 | `npm run build` → `firebase deploy` |

---

## 📎 참고 문서

- [DEPLOYMENT.md](./DEPLOYMENT.md) — 새 환경에서 처음부터 배포하는 상세 단계별 가이드
- [Firebase Realtime Database 문서](https://firebase.google.com/docs/database)
- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [shadcn/ui 문서](https://ui.shadcn.com/)
- [Tailwind CSS v4 문서](https://tailwindcss.com/docs)

---

## 📜 NPM 스크립트

```bash
npm run dev      # 개발 서버 실행 (http://localhost:3000)
npm run build    # 정적 빌드 (/out 폴더 생성)
npm run start    # 프로덕션 서버 실행 (정적 빌드에서는 미사용)
npm run lint     # ESLint 코드 검사
```

---

## 📌 Git 제외 파일 (`.gitignore`)

| 파일/폴더 | 이유 | 복원 방법 |
|-----------|------|-----------|
| `node_modules/` | 용량 큼 | `npm install` |
| `.next/` | 개발 캐시 | `npm run dev` |
| `out/` | 빌드 결과물 | `npm run build` |
| `.env*` | API 키, 비밀번호 해시 등 민감 정보 | 직접 생성 필요 |
| `.firebase/` | 배포 캐시 | `firebase deploy` 시 자동 생성 |
| `check_hash.js` | 비밀번호 해시 유틸 (로컬 전용) | — |
