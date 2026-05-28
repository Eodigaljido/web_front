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

## SSH 배포 실패 (`Permission denied (password)`, exit 255)

CI는 **비밀번호가 아니라 PEM 키**로만 접속합니다. 아래를 순서대로 확인하세요.

### 1. Repository secrets (Settings → Secrets and variables → Actions)

| Secret | 올바른 예 |
|--------|-----------|
| `EC2_HOST` | `3.36.85.213` 또는 `eodigaljido.uk` (공백·`ssh://` 없음) |
| `EC2_USER` | Amazon Linux → **`ec2-user`** (Ubuntu AMI면 `ubuntu`) |
| `EC2_KEY` | `.pem` 파일 **전체** (아래 형식 그대로, 줄바꿈 유지) |

```
-----BEGIN RSA PRIVATE KEY-----
…
-----END RSA PRIVATE KEY-----
```

또는 `-----BEGIN OPENSSH PRIVATE KEY-----` … `-----END OPENSSH PRIVATE KEY-----`

**자주 하는 실수**

- 인스턴스 띄울 때 받은 `.pem`이 아닌 다른 키를 넣음
- `BEGIN`/`END` 한 줄만 넣거나, 한 줄로 붙여 넣음 (GitHub Secret은 여러 줄 붙여넣기 가능해야 함)
- 키 앞뒤에 `"` 따옴표를 넣음
- EC2를 **재생성**했는데 예전 IP·예전 키를 그대로 씀

### 2. 로컬에서 먼저 SSH 테스트

```bash
ssh -i "your-key.pem" ec2-user@EC2_PUBLIC_IP
```

로컬에서도 안 되면 → Actions도 안 됩니다. EC2 콘솔에서 **키 페어**와 **퍼블릭 IP**를 맞추세요.

### 3. EC2 보안 그룹

- 인바운드 **SSH 22**: GitHub Actions IP는 매번 바뀝니다. 테스트 시에는 잠시 `0.0.0.0/0` 또는 본인 IP만 허용 후, 안정화되면 [GitHub meta API](https://api.github.com/meta)의 `actions` CIDR로 제한하는 것을 권장합니다.

### 4. 서버에 배포 경로

```bash
ls /var/www/web_front/eodigaljido-share-web
```

없으면 [nginx-deploy.md](./nginx-deploy.md) §2대로 `git clone` 후 `.env`·`npm run build`를 먼저 해 두세요.

### 5. CI 로그 해석 (수정된 워크플로)

- `EC2_KEY에 BEGIN … PRIVATE KEY 헤더가 없습니다` → Secret에 키 전체를 다시 저장
- `EC2_KEY 형식이 올바르지 않습니다` → 줄바꿈 깨짐; `.pem`을 메모장이 아닌 VS Code 등으로 열어 전체 복사
- 여전히 `Permission denied` → **키 페어 ≠ EC2 인스턴스** 또는 **EC2_USER** 오류 가능성이 큼
