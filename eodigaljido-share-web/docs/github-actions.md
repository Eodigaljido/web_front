# GitHub Actions — share-web

## 시크릿 (Repository secrets)

| 이름 | 필수 | 설명 |
|------|------|------|
| `EC2_HOST` | 배포 시 | EC2 퍼블릭 IP 또는 DNS |
| `EC2_USER` | 배포 시 | SSH 사용자 (Amazon Linux: `ec2-user`) |
| `EC2_KEY` | 배포 시 | `.pem` **전체 내용** (BEGIN~END 포함) |
| `VITE_KAKAO_MAP_APP_KEY` | 선택 | CI 빌드·서버 `.env`와 동일 (지도) |
| `VITE_KAKAO_REST_API_KEY` | 선택 | CI 빌드·서버 `.env`와 동일 |

배포 job은 EC2에서 `git pull` 후 **서버의 `.env`**로 `npm run build` 합니다.  
서버에 `/var/www/web_front` 클론과 `.env`가 있어야 합니다 → [nginx-deploy.md](./nginx-deploy.md).

## 워크플로

- 파일: `.github/workflows/share-web-ci.yml`
- **CI:** `lint` + `build` (PR·push)
- **Deploy:** `main` push 성공 시 EC2 SSH 배포

## 첫 실행이 안 보일 때

1. **Actions** → **share-web CI** → **Run workflow** (수동 실행)
2. 또는 `main`에 `eodigaljido-share-web/**` 변경을 push
3. 예전 `main.yml`만 있고 path가 `share-web-ci.yml`만 보면 실행 안 됨 → 지금은 두 파일 path 모두 포함

## EC2 사전 준비

```bash
# 최초 1회 (nginx-deploy.md 참고)
cd /var/www && git clone https://github.com/Eodigaljido/web_front.git
cd web_front/eodigaljido-share-web
# .env 작성 후 npm ci && npm run build
```

GitHub Actions SSH 키: 배포용 `.pem`을 `EC2_KEY`에 넣고, 해당 키페어로 EC2 인스턴스를 띄웠는지 확인하세요.
