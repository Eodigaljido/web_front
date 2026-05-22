# 어디갈지도 공유 랜딩 웹 (eodigaljido-share-web)

앱에서 공유된 코스·친구 초대 링크를 웹에서 미리보고 앱 또는 스토어로 이동하는 SPA입니다.

**사용 방법(사용자·앱·개발·배포):** [docs/서비스-사용-가이드.md](./docs/서비스-사용-가이드.md)

## 기술 스택

- Vite + React 19 + TypeScript
- Tailwind CSS 3.4
- Axios, react-router-dom v7, react-helmet-async, lucide-react

## 로컬 실행

```bash
cp .env.example .env
npm install
npm run dev
```

개발 서버: http://localhost:5174  
API는 `vite.config.ts`의 `/api` 프록시로 `http://3.36.85.213:8080`에 연결됩니다.  
프로덕션 빌드 전 `.env`에 `VITE_API_BASE_URL`을 반드시 설정하세요.

## 라우트 (앱과 동일)

| Path | 설명 |
|------|------|
| `/` | 홈 |
| `/courses/public/:courseId` | 공유 코스 랜딩 |
| `/friends/add/:friendCode` | 친구 초대 랜딩 |

## 배포

1. DNS `share.eodigaljido.rjsgud.com` → Vercel / Cloudflare Pages 등
2. 환경 변수: `VITE_API_BASE_URL`, `VITE_SHARE_SITE_URL`, `VITE_APP_SCHEME`, 스토어 URL
3. SPA rewrite: `/*` → `/index.html`
4. `/.well-known/*`는 **리다이렉트 제외** (JSON 200으로 서빙)
5. `public/.well-known/apple-app-site-association`의 `TEAM_ID` 교체
6. `public/.well-known/assetlinks.json`의 `REPLACE_WITH_EAS_SHA256`을 EAS 빌드 SHA-256으로 교체
7. `public/og-default.png`를 1200×630 브랜드 이미지로 교체

## 앱 연동 계약

| 항목 | 값 |
|------|-----|
| 공유 호스트 | `share.eodigaljido.rjsgud.com` |
| 코스 path | `/courses/public/:courseId` |
| 친구 path | `/friends/add/:friendCode` |
| App scheme | `eodigaljido` |
| Android package | `com.eodigaljido.app` |

## 백엔드 API

| Method | Path |
|--------|------|
| GET | `/api/courses/public/{id}/preview` |
| GET | `/api/courses/{id}` (fallback) |
| GET | `/api/friends/code/{code}/preview` (optional) |

CORS에 `https://share.eodigaljido.rjsgud.com` origin을 허용해야 합니다.
