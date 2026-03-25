# AA FC 예약 시스템 — 배포 가이드 (처음부터 끝까지)

> 전제: 새 구글 계정, 새 Firebase 프로젝트, 클린 상태 (node_modules / .next / out / .firebase 없음)
> 소스 코드만 존재하는 상태에서 시작

---

## 프로젝트 구조 (소스 코드만 있는 상태)

```
fc-web/
├── src/
│   ├── app/
│   │   ├── layout.js              ← 루트 레이아웃
│   │   ├── page.js                ← 홈 페이지 (예약 현황 대시보드)
│   │   ├── globals.css            ← 전역 스타일 (Tailwind CSS)
│   │   ├── favicon.ico
│   │   ├── admin/
│   │   │   └── page.js            ← 관리자 페이지
│   │   └── reserve/
│   │       ├── page.js            ← 예약 메인 (반 선택)
│   │       └── form/
│   │           └── page.js        ← 예약 폼 (이름/학년 입력)
│   ├── components/
│   │   └── ui/                    ← shadcn/ui 컴포넌트들
│   │       ├── badge.jsx
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       ├── dialog.jsx
│   │       ├── input.jsx
│   │       ├── progress.jsx
│   │       └── select.jsx
│   └── lib/
│       ├── constants.js           ← 상수 (반 이름, 정원 등)
│       ├── firebase.js            ← Firebase 초기화
│       ├── useReservationData.js   ← 예약 데이터 훅
│       └── utils.js               ← 유틸 함수
├── public/                        ← 정적 파일 (SVG 아이콘)
├── package.json                   ← 의존성 목록
├── package-lock.json
├── next.config.mjs                ← Next.js 설정 (정적 빌드)
├── postcss.config.mjs             ← PostCSS 설정
├── jsconfig.json                  ← 경로 별칭 (@/ → src/)
├── eslint.config.mjs
├── components.json                ← shadcn/ui 설정
├── check_hash.js                  ← 관리자 비밀번호 해시 생성 도구
├── .gitignore
└── .env.local                     ← ⚠️ 이 파일은 직접 만들어야 함 (git에 안 올라감)
```

---

## STEP 0: 사전 준비 — 필요한 것들

### 0-1. Node.js 설치 확인

```bash
node -v    # v18 이상이면 OK (권장: v20+)
npm -v     # 자동으로 같이 설치됨
```

- 없으면: https://nodejs.org 에서 LTS 버전 다운로드 → 설치
- 설치 후 터미널 재시작

### 0-2. Git 설치 확인

```bash
git --version    # git version 2.x.x 이면 OK
```

- 없으면: https://git-scm.com 에서 다운로드 → 설치
- 설치 시 기본 옵션 그대로 Next 클릭

### 0-3. GitHub 계정

- https://github.com 에서 계정 생성 (이미 있으면 스킵)
- GitHub CLI 설치 (선택): https://cli.github.com

### 0-4. Google 계정

- Firebase는 Google 계정으로 로그인
- 새 계정 or 기존 계정 어떤 것이든 OK

---

## STEP 1: 프로젝트 의존성 설치

### 1-1. 터미널에서 프로젝트 폴더로 이동

```bash
cd C:\Users\<사용자이름>\Desktop\fc-web
```

### 1-2. npm install 실행

```bash
npm install
```

- `package.json`에 적힌 모든 라이브러리를 다운로드
- 완료되면 `node_modules/` 폴더가 생김
- 시간: 약 30초 ~ 1분

### 1-3. 설치 확인

```bash
# 에러 없이 끝나면 성공. 아래로 확인 가능:
ls node_modules/.package-lock.json
```

---

## STEP 2: Firebase CLI 설치 + 로그인

### 2-1. Firebase CLI 전역 설치

```bash
npm install -g firebase-tools
```

- `-g` = global, 어디서든 `firebase` 명령어를 쓸 수 있게 설치
- 시간: 약 30초

### 2-2. 설치 확인

```bash
firebase --version
# 예: 14.x.x 이면 OK
```

### 2-3. Firebase 로그인

```bash
firebase login
```

1. 터미널에 "Allow Firebase to collect CLI usage..." → `Y` 입력
2. 브라우저가 자동으로 열림
3. **새 Google 계정**으로 로그인
4. "Firebase CLI가 내 Google 계정에 액세스하도록 허용" → 허용
5. 터미널에 `✔ Success! Logged in as your-email@gmail.com` 확인

---

## STEP 3: Firebase 프로젝트 생성 + 초기화

### 3-1. firebase init 실행

```bash
firebase init
```

### 3-2. 초기화 과정 — 질문별 응답

아래 순서대로 질문이 나옴. 정확히 따라하기:

```
? Are you ready to proceed?
→ Y (Enter)

? Which Firebase features do you want to set up?
→ 스페이스바로 아래 2개 선택 후 Enter:
  [x] Hosting: Set up deployments for static web apps
  [x] Realtime Database: Configure a security rules file

? Please select an option:
→ Create a new project

? Please specify a unique project id:
→ 원하는 이름 입력 (예: aafc-reservation-2024)
  ※ 전 세계에서 유일해야 함, 영어 소문자 + 숫자 + 하이픈만 가능

? What would you like to call your project?
→ Enter (기본값 = 프로젝트 ID와 동일)
```

잠시 기다리면 `✔ Your Firebase project is ready!` 나옴.

이어서 Hosting 질문:

```
? Detected a Next.js codebase with SSR features... use App Hosting instead?
→ N (Enter)
  ※ 우리는 정적 빌드(static export)라서 일반 Hosting으로 충분

? What do you want to use as your public directory?
→ out (Enter)
  ※ Next.js가 빌드 결과를 /out 폴더에 저장하기 때문

? Configure as a single-page app?
→ Y (Enter)

? Set up automatic builds and deploys with GitHub?
→ N (Enter)

? File out/index.html already exists. Overwrite?
→ N (Enter)
  ※ 만약 이 질문이 안 나오면 정상 (out 폴더가 아직 없는 경우)
```

이어서 Database 질문:

```
? What file should be used for Realtime Database Security Rules?
→ Enter (기본값: database.rules.json)

? It seems like you haven't initialized Realtime Database... set it up?
→ Y (Enter)

? Please choose the location for your default Realtime Database instance:
→ asia-southeast1 (선택)
  ※ 한국에서 가장 가까운 아시아 서버
```

### 3-3. 완료 확인

```
✔ Firebase initialization complete!
```

자동 생성된 파일 3개:
| 파일 | 역할 |
|------|------|
| `firebase.json` | 호스팅 설정 (어떤 폴더를 배포할지 등) |
| `.firebaserc` | 프로젝트 ID 연결 정보 |
| `database.rules.json` | DB 읽기/쓰기 권한 규칙 |

---

## STEP 4: Database 보안 규칙 수정

### 4-1. 기본 생성된 규칙 (읽기/쓰기 모두 차단됨)

```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```

### 4-2. 우리 앱에 맞게 수정

`database.rules.json` 파일을 열어서 아래 내용으로 **전체 교체**:

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

- `"aafc"` 경로 아래만 읽기/쓰기 허용
- 나머지 경로는 자동으로 차단됨

### ⚠️ 보안 참고
- 이 설정은 누구나 예약 데이터를 읽고 쓸 수 있음 (프로토타입/교육용)
- 운영 시에는 Firebase Authentication 추가하여 인증된 사용자만 쓰기 허용 권장

---

## STEP 5: Firebase 웹 앱 등록 + 환경변수 설정

### 5-1. 웹 앱 생성

```bash
firebase apps:create web "aafc-web" --project <네-프로젝트-ID>
```

예시:
```bash
firebase apps:create web "aafc-web" --project aafc-reservation-2024
```

출력에서 App ID 확인:
```
App information:
  - App ID: 1:123456789:web:abcdef123456
```

### 5-2. SDK config 가져오기

```bash
firebase apps:sdkconfig WEB <위에서-나온-App-ID> --project <네-프로젝트-ID>
```

예시:
```bash
firebase apps:sdkconfig WEB 1:123456789:web:abcdef123456 --project aafc-reservation-2024
```

출력 예시:
```json
{
  "projectId": "aafc-reservation-2024",
  "appId": "1:123456789:web:abcdef123456",
  "databaseURL": "https://aafc-reservation-2024-default-rtdb.asia-southeast1.firebasedatabase.app",
  "storageBucket": "aafc-reservation-2024.firebasestorage.app",
  "apiKey": "AIzaSy...",
  "authDomain": "aafc-reservation-2024.firebaseapp.com",
  "messagingSenderId": "123456789"
}
```

### 5-3. 환경변수 파일 분리 생성

프로젝트 루트에 아래와 같이 2가지 파일을 **직접 생성**합니다 (git 자동 제외):

#### 1) 로컬 개발용 (`.env.development`)
- `npm run dev` 실행 시 적용됩니다. 
- `NEXT_PUBLIC_USE_FIREBASE=false`로 설정하여 LocalStorage 기반으로 작업합니다.

```env
NEXT_PUBLIC_USE_FIREBASE=false
# 관리자 비밀번호 SHA-256 해시 (기본: 0000)
NEXT_PUBLIC_ADMIN_PASSWORD_HASH=5a8fdda3b8ee67ab5f8747a3cddcd7228e42278cb74e5de8c5d8094931986bed
```

#### 2) 서비스 빌드용 (`.env.production`)
- `npm run build` 실행 시 적용되며, Firebase Hosting에 배포될 설정입니다.
- `NEXT_PUBLIC_USE_FIREBASE=true`와 실제 Firebase 설정값을 넣습니다.

```env
NEXT_PUBLIC_USE_FIREBASE=true
# Firebase 설정 — 위 SDK config 출력값으로 채우기
NEXT_PUBLIC_FIREBASE_API_KEY=여기에-apiKey-값
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=여기에-authDomain-값
NEXT_PUBLIC_FIREBASE_DATABASE_URL=여기에-databaseURL-값
NEXT_PUBLIC_FIREBASE_PROJECT_ID=여기에-projectId-값
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=여기에-storageBucket-값
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=여기에-messagingSenderId-값
NEXT_PUBLIC_FIREBASE_APP_ID=여기에-appId-값

# 관리자 비밀번호 SHA-256 해시 (기본: 0000)
NEXT_PUBLIC_ADMIN_PASSWORD_HASH=5a8fdda3b8ee67ab5f8747a3cddcd7228e42278cb74e5de8c5d8094931986bed
```

### ⚠️ 주의사항
`next build`는 `.env.production`를 불러오지만, 만약 프로젝트 루트에 `.env.local`이 존재하면 그 값이 **우선순위가 가장 높으므로** 빌드 시 주의하십시오.

### 5-4. 관리자 비밀번호 변경 (선택)

기본 비밀번호 `0000`을 바꾸고 싶으면:

```bash
node check_hash.js
# 원하는 비밀번호 입력 → SHA-256 해시값 출력됨
# 출력된 해시값을 .env.local의 NEXT_PUBLIC_ADMIN_PASSWORD_HASH에 붙여넣기
```

---

## STEP 6: 빌드 + 로컬 확인

### 6-1. 프로젝트 빌드

```bash
npm run build
```

- Next.js가 모든 페이지를 정적 HTML로 변환
- 결과물이 `/out` 폴더에 저장됨
- 시간: 약 10~30초

### 6-2. 빌드 성공 확인

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /admin
├ ○ /reserve
└ ○ /reserve/form

○  (Static)  prerendered as static content
```

위와 같이 나오면 성공.

### 6-3. 로컬에서 미리보기 (선택)

```bash
npx serve out
```

- `http://localhost:3000` 에서 확인 가능
- Ctrl+C로 종료

---

## STEP 7: Firebase 배포

### 7-1. 배포 실행

```bash
firebase deploy
```

- Hosting (웹사이트) + Database (보안 규칙) 동시 배포
- 시간: 약 30초 ~ 1분

### 7-2. 배포 성공 확인

```
✔ Deploy complete!

Hosting URL: https://<네-프로젝트-ID>.web.app
```

이 URL이 실제 배포된 웹사이트 주소!

### 7-3. 배포 후 체크리스트

- [ ] `https://<네-프로젝트-ID>.web.app` 브라우저에서 접속
- [ ] 홈 화면: 5개 반 예약 현황 카드 표시되는지
- [ ] 예약: 반 선택 → 이름/학년 입력 → 예약 완료되는지
- [ ] 실시간: 다른 기기(핸드폰 등)에서 예약 후 자동 업데이트되는지
- [ ] 정원 초과: 15명 이상일 때 "마감" 표시되는지
- [ ] 관리자: `/admin` → 비밀번호 입력 → 관리 기능 동작하는지
- [ ] 모바일: 핸드폰 브라우저에서 레이아웃 정상인지

---

## STEP 8: Git & GitHub로 코드 관리

### 8-1. Git 초기화 + 첫 커밋

```bash
git init
git add .
git commit -m "Initial commit: AA FC 풋살 예약 시스템"
```

### 8-2. GitHub 저장소 생성 + Push

**방법 A: GitHub CLI 사용 (간편)**
```bash
gh auth login          # GitHub 로그인 (처음 한 번만)
gh repo create aafc-reservation --public --source=. --push
```

**방법 B: 수동**
1. https://github.com/new 에서 저장소 생성
   - Repository name: `aafc-reservation`
   - Public or Private 선택
   - "Create repository" 클릭
2. 터미널에서:
```bash
git remote add origin https://github.com/<네-GitHub-ID>/aafc-reservation.git
git branch -M main
git push -u origin main
```

### 8-3. git에 올라가지 않는 파일 확인

`.gitignore`에 의해 자동 제외됨:

| 제외되는 파일/폴더 | 이유 |
|---------------------|------|
| `node_modules/` | 용량 큼, `npm install`로 복원 |
| `.next/` | 개발 서버 캐시, `npm run dev`로 재생성 |
| `out/` | 빌드 결과물, `npm run build`로 재생성 |
| `.env*` | API 키, 비밀번호 등 민감 정보 포함 |
| `.firebase/` | Firebase 배포 캐시 |

### 8-4. 코드 수정 후 재배포 흐름

```bash
# 1. 코드 수정 후 git 커밋
git add .
git commit -m "수정 내용 설명"
git push

# 2. 재빌드 + 재배포
npm run build
firebase deploy
```

---

## STEP 9: .firebaserc 업데이트 (새 프로젝트 연결)

> firebase init에서 새 프로젝트를 만들었으면 자동으로 설정됨.
> 만약 기존 `.firebaserc`가 남아있는 경우에만 수동 수정:

`.firebaserc` 내용이 새 프로젝트 ID를 가리키는지 확인:

```json
{
  "projects": {
    "default": "<네-프로젝트-ID>"
  }
}
```

---

## 전체 명령어 순서 요약 (복사해서 쓰기)

```bash
# === STEP 1: 의존성 설치 ===
cd C:\Users\<사용자이름>\Desktop\fc-web
npm install

# === STEP 2: Firebase CLI ===
npm install -g firebase-tools
firebase login

# === STEP 3: Firebase 프로젝트 생성 + 초기화 ===
firebase init
# → Hosting + Realtime Database 선택
# → Create a new project
# → 프로젝트 ID 입력
# → public directory: out
# → SPA: Yes
# → GitHub deploys: No
# → DB location: asia-southeast1

# === STEP 4: DB 규칙 수정 ===
# database.rules.json을 열어서 aafc 경로 read/write true로 수정

# === STEP 5: 웹 앱 등록 + .env.local 작성 ===
firebase apps:create web "aafc-web" --project <네-프로젝트-ID>
firebase apps:sdkconfig WEB <App-ID> --project <네-프로젝트-ID>
# 출력값으로 .env.local 파일 생성

# === STEP 6: 빌드 ===
npm run build

# === STEP 7: 배포 ===
firebase deploy
# → Hosting URL 확인하고 브라우저에서 테스트

# === STEP 8: Git & GitHub ===
git init
git add .
git commit -m "Initial commit: AA FC 풋살 예약 시스템"
gh repo create aafc-reservation --public --source=. --push
# 또는 GitHub 웹에서 수동 생성 후 git remote add + push
```

---

## 트러블슈팅

### 빌드 에러: `'next' is not recognized`
- 원인: `npm install`을 안 했거나 실패
- 해결: `npm install` 다시 실행

### 빌드 에러: `Turbopack build failed`
- 원인: node_modules가 깨짐
- 해결: `rm -rf node_modules && npm install`

### 배포 후 사이트가 안 보임
- 원인: `/out` 폴더가 비어있거나 빌드 안 함
- 해결: `npm run build` 후 다시 `firebase deploy`

### 예약이 저장 안 됨 (Firebase DB 연결 안 됨)
- 원인 1: `.env.local`의 `NEXT_PUBLIC_USE_FIREBASE`가 `false`
- 원인 2: `.env.local`의 Firebase config 값이 잘못됨
- 원인 3: `database.rules.json`에서 read/write가 `false`
- 해결: `.env.local` 확인 → `npm run build` → `firebase deploy`

### `firebase login` 시 브라우저가 안 열림
- 해결: `firebase login --no-localhost` 실행 → URL 복사해서 브라우저에 직접 붙여넣기

### `firebase deploy` 시 권한 에러
- 원인: 로그인한 계정이 프로젝트 소유자가 아님
- 해결: `firebase logout` → `firebase login` (올바른 계정으로)
