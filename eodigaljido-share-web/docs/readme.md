# 어디갈지도 공유 웹 — 사용 가이드

**서비스명:** 어디갈지도 (Eodigaljido)  
**공유 사이트:** https://share.eodigaljido.rjsgud.com  
**프로젝트 폴더:** `eodigaljido-share-web`

이 문서는 **링크를 받은 사용자**, **앱에서 공유하는 사용자**, **개발·운영 담당자**가 각각 무엇을 하면 되는지 정리합니다.

---

## 1. 이 서비스가 하는 일

모바일 앱 **어디갈지도**에서 보낸 공유 링크를 카카오톡·문자·SNS로 열었을 때 보여 주는 **웹 미리보기 페이지**입니다.

| 역할 | 설명 |
|------|------|
| 웹 | 코스·친구 초대 내용을 간단히 보여 줌 |
| 앱 전환 | 「앱에서 보기」 버튼으로 설치된 앱 실행 시도 |
| 스토어 | 앱이 없으면 Google Play(·App Store)로 안내 |
| 미리보기(OG) | 카톡 등에 붙는 제목·설명·이미지 제공 |

웹에서는 **로그인·친구 추가·코스 편집을 하지 않습니다.** 실제 기능은 모두 **앱**에서 합니다.

---

## 2. 일반 사용자 — 링크를 받았을 때

### 2.1 공유 코스 링크

**URL 형식**

```
https://share.eodigaljido.rjsgud.com/courses/public/{코스ID}
```

**이용 순서**

1. 카톡·문자 등에서 링크를 탭합니다.
2. 웹에서 코스 제목, 지역, 소요 시간, 경로 요약 등을 확인합니다.
3. **「앱에서 코스 보기」**를 누릅니다.
   - 앱이 설치되어 있으면 → 어디갈지도 앱이 열리며 해당 코스로 이동을 시도합니다.
   - 앱이 없거나 열리지 않으면 → 같은 링크(유니버설 링크)로 다시 시도하거나, **Google Play에서 받기**로 이동합니다.
4. 앱 설치 후 같은 링크를 다시 열면 앱에서 전체 코스를 볼 수 있습니다.

### 2.2 친구 초대 링크

**URL 형식**

```
https://share.eodigaljido.rjsgud.com/friends/add/{친구코드}
```

**이용 순서**

1. 초대 링크를 엽니다.
2. 초대한 사람 닉네임(또는 기본 안내)과 **친구 코드**를 확인합니다.
3. **「앱에서 친구 추가」**를 눌러 앱을 엽니다.
4. 앱에서 친구 추가·채팅·루트 공유를 이어갑니다.

> 친구 추가 API(`POST /friends/add`)는 **앱 전용**입니다. 웹은 안내만 합니다.

### 2.3 공동 루트 편집 초대 링크

**URL 형식**

```
https://share.eodigaljido.rjsgud.com/routes/collaborative/{코스ID}
```

**이용 순서**

1. 초대 링크를 엽니다.
2. (백엔드 preview가 있으면) 루트 제목·경로 요약을 확인합니다.
3. **「앱에서 공동 편집 참여」**를 눌러 앱을 엽니다.
4. 앱에서 로그인 후 공동 편집 화면으로 이동합니다.

> 편집 권한 검증은 **앱 + 백엔드**(`GET /api/courses/collaborative/{courseId}`)에서 처리합니다. 웹은 안내·앱 전환만 합니다.

### 2.4 홈(`/`)에 직접 들어간 경우

공유 링크가 아니라 사이트 주소만 연 경우, 서비스 소개와 **앱 다운로드** 버튼이 보입니다. 공유 받은 내용은 **위 세 종류의 링크**로 들어와야 합니다.

---

## 3. 앱 사용자 — 링크를 보낼 때

앱에서 「공유」 기능을 쓰면 아래 주소가 생성되어야 합니다. **경로·호스트를 바꾸지 마세요.** (앱 딥링크·앱 링크와 1:1로 맞춰져 있습니다.)

| 공유 종류 | 웹 URL | 앱 딥링크(참고) |
|-----------|--------|-----------------|
| 코스 | `https://share.eodigaljido.rjsgud.com/courses/public/{courseId}` | `eodigaljido://courses/public/{courseId}` |
| 친구 초대 | `https://share.eodigaljido.rjsgud.com/friends/add/{friendCode}` | `eodigaljido://friends/add/{friendCode}` |
| 공동 루트 편집 | `https://share.eodigaljido.rjsgud.com/routes/collaborative/{courseId}` | `eodigaljido://routes/collaborative/{courseId}` |

**체크 포인트**

- 카톡에 붙는 미리보기가 이상하면 → 코스/친구 페이지가 배포되어 있고, 백엔드 preview API가 응답하는지 확인합니다.
- 링크를 눌러도 앱만 안 열리면 → 앱 설치 여부, Android App Links / iOS Universal Links 설정(`.well-known`)을 확인합니다.

---

## 4. 개발자 — 로컬에서 실행하기

### 4.1 준비

- Node.js 18+ 권장
- 저장소: `web_front/eodigaljido-share-web`

### 4.2 최초 설정

```bash
cd eodigaljido-share-web
cp .env.example .env
npm install
```

`.env` 예시 (개발):

```env
VITE_API_BASE_URL=
VITE_SHARE_SITE_URL=https://share.eodigaljido.rjsgud.com
VITE_APP_SCHEME=eodigaljido
VITE_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.eodigaljido.app
VITE_APP_STORE_URL=
VITE_OG_IMAGE_URL=https://share.eodigaljido.rjsgud.com/og-default.png
```

개발 시 `VITE_API_BASE_URL`을 비우면 Vite가 `/api` 요청을 백엔드(`http://3.36.85.213:8080`)로 프록시합니다.

### 4.3 실행·빌드

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 http://localhost:5174 |
| `npm run build` | 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 미리보기 http://localhost:4174 |

### 4.4 로컬에서 페이지 확인

| 확인할 화면 | URL 예시 |
|-------------|----------|
| 홈 | http://localhost:5174/ |
| 코스 공유 | http://localhost:5174/courses/public/{실제코스ID} |
| 친구 초대 | http://localhost:5174/friends/add/{친구코드} |
| 404 | http://localhost:5174/없는경로 |

코스·친구 페이지는 **백엔드 API**가 켜져 있어야 데이터가 보입니다. API 오류 시 「다시 시도」 또는 404 안내가 나옵니다.

---

## 5. 운영자 — 배포·환경 변수

**Nginx + Let's Encrypt (서버 직접 배포, 명령어·설정 전체):** [nginx-deploy.md](./nginx-deploy.md)

### 5.1 배포 전 필수

1. **DNS** `share.eodigaljido.rjsgud.com` → 서버 IP (Nginx) 또는 호스팅(Vercel, Cloudflare Pages 등)
2. **환경 변수** (호스팅 대시보드에 설정, 빌드 시 주입)

| 변수 | 설명 | 앱(Expo) 대응 |
|------|------|----------------|
| `VITE_API_BASE_URL` | 백엔드 API 주소 (슬래시 없이) | `EXPO_PUBLIC_API_BASE_URL` |
| `VITE_SHARE_SITE_URL` | 이 사이트 공개 URL | `EXPO_PUBLIC_SHARE_BASE_URL` |
| `VITE_KAKAO_REST_API_KEY` | 장소검색·길찾기 (빌드·Nginx 프록시) | `EXPO_PUBLIC_KAKAO_REST_API_KEY` |
| `VITE_KAKAO_MAP_APP_KEY` | 카카오맵 JS SDK (웹 전용) | 콘솔 **JavaScript** 키 (앱 env 없음) |
| `VITE_APP_SCHEME` | `eodigaljido` | — |
| `VITE_PLAY_STORE_URL` | Play 스토어 링크 | — |
| `VITE_APP_STORE_URL` | App Store (없으면 비움) | — |
| `VITE_OG_IMAGE_URL` | 기본 OG 이미지 URL | — |

Google Maps / TMAP / Weather / OAuth 키는 share-web에서 쓰지 않습니다.

3. **SPA 라우팅:** 모든 경로 `/*` → `/index.html`
4. **예외:** `/.well-known/*` 는 JSON 파일 그대로 200 응답 (리다이렉트 금지)

### 5.2 앱 딥링크용 정적 파일

| 파일 | 할 일 |
|------|--------|
| `public/.well-known/apple-app-site-association` | `TEAM_ID`를 Apple 팀 ID로 교체 |
| `public/.well-known/assetlinks.json` | EAS SHA-256 지문으로 교체 |
| `public/og-default.png` | 1200×630 카톡 미리보기용 이미지 |

### 5.3 이미지 자산 (`public/img`)

| 파일 | 권장 용도 |
|------|-----------|
| `Eodigaljido.png` | 헤더 로고, favicon |
| `Eodigaljido_graphic_image.png` | `og-default.png` 원본(카톡 미리보기) |
| 그 외 | 필요할 때만 페이지에 추가 (과하게 넣지 않음) |

---

## 6. 백엔드·앱 팀 — 연동 요약

### 6.1 웹이 호출하는 API

| Method | Path | 용도 |
|--------|------|------|
| GET | `/api/courses/public/{id}/preview` | 코스 랜딩 (우선) |
| GET | `/api/courses/{id}` | preview 없을 때 fallback |
| GET | `/api/friends/code/{code}/preview` | 친구 초대 (선택, 없으면 코드만 표시) |

### 6.2 CORS

브라우저에서 axios 호출이 되려면 API 서버에 다음 origin 허용이 필요합니다.

```
https://share.eodigaljido.rjsgud.com
```

로컬 개발은 Vite 프록시로 우회합니다.

### 6.3 변경하면 안 되는 값

| 항목 | 값 |
|------|-----|
| 공유 호스트 | `share.eodigaljido.rjsgud.com` |
| 코스 path | `/courses/public/:courseId` |
| 친구 path | `/friends/add/:friendCode` |
| App scheme | `eodigaljido` |
| Android package | `com.eodigaljido.app` |

---

## 7. 자주 묻는 질문

**Q. 웹에서 로그인할 수 있나요?**  
A. 없습니다. 로그인·친구 추가·코스 편집은 앱에서만 합니다.

**Q. 카톡 미리보기가 안 바뀌어요.**  
A. 카톡 캐시 때문일 수 있습니다. `og:title`, `og:image`가 배포 URL 기준으로 나오는지 확인하고, 코스는 API의 `thumbnailUrl`·제목이 내려오는지 봅니다.

**Q. 「앱에서 보기」를 눌러도 웹만 남아요.**  
A. 앱 미설치, 또는 App Links / Universal Links 미설정일 수 있습니다. `.well-known` 파일과 앱 패키지·번들 ID를 맞춥니다.

**Q. 코스 페이지에 「찾을 수 없어요」가 나와요.**  
A. `courseId`가 잘못됐거나, API가 404를 반환하는 경우입니다. preview·일반 코스 API와 공개 여부를 백엔드에서 확인합니다.

**Q. 친구 초대에 닉네임이 「친구」로만 보여요.**  
A. `/api/friends/code/{code}/preview`가 아직 없거나 404일 때 기본 표시입니다. 백엔드 preview API를 붙이면 닉네임·프로필이 채워집니다.

---

## 8. 관련 문서

| 문서 | 위치 |
|------|------|
| 프로젝트 README (기술·배포 요약) | `eodigaljido-share-web/README.md` |
| 전체 구현 명세 | `web_front/docs/share-web-vite-prompt.md` |
| 백엔드 API (레포에 있다면) | `web_front/docs/share-link-backend-spec.md` |

---

## 9. 한 줄 요약

- **받는 사람:** 링크 열기 → 내용 확인 → 「앱에서 보기」 → 앱에서 이어하기  
- **보내는 사람:** 앱 공유 URL이 위 표와 같으면 됨  
- **개발자:** `npm run dev` / `.env` / API·CORS / 배포·`.well-known` 맞추기
