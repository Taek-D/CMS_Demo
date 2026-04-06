# CMS Auto-Debit Demo — 효성CMS 자동이체 플로우 재현 시스템

효성CMS API 스펙 기반의 자동이체 플로우 전체를 목업으로 구현한 풀스택 데모 시스템입니다.

## 🚀 기술 스택

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 3 + shadcn/ui
- **Backend**: Next.js Server Actions + API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (이메일/패스워드)
- **Encryption**: AES-256-CBC (계좌번호 암호화)
- **Deployment**: Vercel

## 📋 주요 기능

### 회원 (학부모) 기능
- 회원가입 / 로그인 (Supabase Auth)
- 계좌 등록 (AES-256 암호화 저장)
- 출금 동의 / 취소
- 결제 내역 조회

### 관리자 기능
- 회원 관리 (검색, 계좌 조회)
- 배치 출금 실행 (85% 성공률 시뮬레이션)
- 출금 결과 대시보드 (미납자 필터링)
- 배치 회차별 통계

## 🗄️ 데이터베이스

5개 테이블로 구성됩니다:

| 테이블 | 설명 |
|--------|------|
| `cms_members` | 회원 정보 |
| `cms_bank_accounts` | 계좌 정보 (암호화 저장) |
| `cms_billing_schedules` | 출금 스케줄 |
| `cms_billing_batches` | 배치 회차 |
| `cms_billing_results` | 출금 결과 |

## 🔒 보안

- 계좌번호: AES-256-CBC 암호화 저장
- 화면 표시: 계좌번호 마스킹 처리
- RLS (Row Level Security): 본인 데이터만 접근 가능
- 관리자 페이지: 이메일 기반 접근 제어

## 🚀 로컬 개발 환경 실행

### 1. 저장소 클론

```bash
git clone <repository-url>
cd cms-auto-debit-demo
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 아래 항목을 설정합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ACCOUNT_ENCRYPTION_KEY=your_64_char_hex_key
ADMIN_EMAIL=your_admin_email
```

### 4. Supabase 마이그레이션 적용

```bash
npx supabase db push
```

### 5. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000`에서 확인 가능합니다.

## 📦 빌드

```bash
npm run build
```

## 🌐 Vercel 배포

1. GitHub 레포지토리를 Vercel에 연결
2. 환경 변수 설정
3. 자동 배포

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/          # 인증 페이지 (로그인/회원가입)
│   ├── (member)/        # 회원 전용 페이지
│   ├── (admin)/         # 관리자 전용 페이지
│   └── api/             # API 라우트
├── components/
│   ├── auth/            # 인증 관련 컴포넌트
│   └── ui/              # shadcn/ui 컴포넌트
├── lib/
│   ├── supabase/        # Supabase 클라이언트
│   ├── crypto.ts        # 암호화 유틸리티
│   ├── constants.ts     # 상수 정의
│   └── types/           # TypeScript 타입
└── types/
    └── database.ts      # DB 타입 정의
supabase/
└── migrations/          # DB 마이그레이션
```

## ✅ 완료 기준

- [x] 회원가입 → 계좌 등록 → 출금 동의까지 학부모 플로우 정상 동작
- [x] 관리자: 배치 출금 실행 → 성공/실패 결과 확인 정상 동작
- [x] 계좌번호 AES-256 암호화 저장 + 마스킹 표시 확인
- [x] 동일 월 중복 배치 실행 방지 동작 확인
- [x] 미납자(실패) 필터링 정상 동작 확인

## 📄 라이선스

MIT
