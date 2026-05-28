# Nginx 배포 가이드 — Amazon Linux EC2 (복사용)

**도메인:** `eodigaljido.uk`  
**OS:** Amazon Linux 2023 (EC2 기본 AMI 권장)  
**SSH 사용자:** `ec2-user`  
**배포:** Public GitHub 로 `git clone` (인증 없음)

> Amazon Linux **2** 도 쓸 수 있으나 본 문서는 AL2023 기준입니다. AL2 는 맨 아래 부록을 참고하세요.

---

## 0. 변수 (한 번만 설정)

```bash
export DOMAIN="eodigaljido.uk"
export REPO_URL="https://github.com/Eodigaljido/web_front.git"
export WEB_ROOT="/var/www/web_front/eodigaljido-share-web/dist"
export API_BACKEND="http://3.36.85.213:8080"
export CERT_EMAIL="admin@example.com"
```

---

## 0-1. EC2 보안 그룹 (AWS 콘솔)

인바운드 규칙 예시:

| 유형 | 포트 | 소스 |
|------|------|------|
| SSH | 22 | 내 IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

---

## 1. 패키지 설치 (Amazon Linux 2023)

```bash
sudo dnf update -y
sudo dnf install -y nginx git curl

# Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

node -v
npm -v

sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 2. 소스 배포 (Public, ec2-user)

```bash
sudo mkdir -p /var/www
sudo chown ec2-user:ec2-user /var/www
cd /var/www
git clone "$REPO_URL" web_front
cd /var/www/web_front/eodigaljido-share-web
```

---

## 3. 환경변수 `.env`

```bash
cd /var/www/web_front/eodigaljido-share-web

cat > .env << 'EOF'
VITE_API_BASE_URL=
VITE_SHARE_SITE_URL=https://eodigaljido.uk
VITE_APP_SCHEME=eodigaljido
VITE_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.eodigaljido.app
VITE_APP_STORE_URL=
VITE_OG_IMAGE_URL=https://eodigaljido.uk/og-default.png
VITE_KAKAO_MAP_APP_KEY=카카오_JavaScript_키
VITE_KAKAO_REST_API_KEY=앱_EXPO_PUBLIC_KAKAO_REST_API_KEY_와_동일
EOF
```

`VITE_API_BASE_URL` 은 빈 값 → `/api` 는 Nginx 가 프록시 처리 (CORS 회피).

---

## 4. 빌드

```bash
cd /var/www/web_front/eodigaljido-share-web
npm ci
npm run build
ls -la dist dist/.well-known
```

### SELinux (Permission denied 시)

```bash
sudo chcon -R -t httpd_sys_content_t /var/www/web_front/eodigaljido-share-web/dist
```

---

## 5. Nginx 설정 (AL2023: `conf.d/`)

Amazon Linux 는 `sites-available` 대신 **`/etc/nginx/conf.d/`** 를 사용합니다.

```bash
sudo tee /etc/nginx/conf.d/eodigaljido-share.conf << 'NGINX'
server {
    listen 80;
    server_name eodigaljido.uk;

    root /var/www/web_front/eodigaljido-share-web/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 256;

    location /api/ {
        proxy_pass http://3.36.85.213:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 15s;
        proxy_read_timeout 15s;
    }

    # 카카오 REST 프록시 (REST API 키는 서버에서만 사용)
    location /kakao-api/ {
        proxy_pass https://dapi.kakao.com/;
        proxy_set_header Host dapi.kakao.com;
        proxy_set_header Authorization "KakaoAK YOUR_KAKAO_REST_API_KEY";
        proxy_ssl_server_name on;
    }

    # Authorization 헤더 = .env 의 VITE_KAKAO_REST_API_KEY (= 앱 EXPO_PUBLIC_KAKAO_REST_API_KEY)

    # 카카오 길찾기 (웹 지도 polyline)
    location /kakao-navi/ {
        proxy_pass https://apis-navi.kakao.com/;
        proxy_set_header Host apis-navi.kakao.com;
        proxy_set_header Authorization "KakaoAK YOUR_KAKAO_REST_API_KEY";
        proxy_ssl_server_name on;
    }

    location = /.well-known/apple-app-site-association {
        default_type application/json;
        try_files $uri =404;
    }

    location /.well-known/ {
        default_type application/json;
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
NGINX
```

```bash
# 기본 welcome 페이지 비활성화 (충돌 방지)
sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true

sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. DNS

| 유형 | 이름 | 값 |
|------|------|-----|
| A | `@` (루트) | `EC2_퍼블릭_IP` |

```bash
dig +short eodigaljido.uk
curl -I http://eodigaljido.uk
```

---

## 7. SSL 인증서 (Let's Encrypt)

### 7.1 Certbot 설치 (AL2023)

```bash
sudo dnf install -y certbot python3-certbot-nginx
```

### 7.2 발급 + Nginx HTTPS 자동 설정

```bash
sudo certbot --nginx \
  -d eodigaljido.uk \
  --email admin@example.com \
  --agree-tos \
  --no-eff-email \
  --redirect
```

> `admin@example.com` 은 실제 받을 메일로 변경하세요.

### 7.3 갱신 테스트

```bash
sudo certbot renew --dry-run
sudo systemctl list-timers | grep certbot
```

### 7.4 브라우저 «보안 인증서를 신뢰할 수 없음»

| 원인 | 확인 |
|------|------|
| `eodigaljido.uk` 용 인증서 없음 | `sudo ls /etc/letsencrypt/live/eodigaljido.uk` |
| 예전 도메인 인증서만 있음 (`share.eodigaljido.rjsgud.com`) | 인증서 SAN에 `eodigaljido.uk` 없음 → 이름 불일치 |
| DNS 미설정 | `dig +short eodigaljido.uk @8.8.8.8` → EC2 IP 나와야 Certbot 가능 |
| Cloudflare Proxy(주황 구름) + EC2 자체 서명 | Cloudflare SSL 모드 **Full (strict)** + EC2에 Let's Encrypt 필요 |

**순서:** DNS A `@` → EC2 IP 확인 → Certbot → `https://eodigaljido.uk` 테스트.

```bash
dig +short eodigaljido.uk @8.8.8.8
sudo ls /etc/letsencrypt/live/
echo | openssl s_client -connect eodigaljido.uk:443 -servername eodigaljido.uk 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null
sudo certbot --nginx -d eodigaljido.uk -d share.eodigaljido.rjsgud.com \
  --email admin@example.com --agree-tos --no-eff-email --redirect
```

공유 링크는 **`https://eodigaljido.uk/...`** 로 보내세요. HTTP만 되는 동안 카톡/브라우저에서 경고가 날 수 있습니다.

---

## 8. HTTPS 적용 후 config 예시 (참고)

Certbot 이 `/etc/nginx/conf.d/eodigaljido-share.conf` 를 수정합니다.

```nginx
server {
    listen 80;
    server_name eodigaljido.uk;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name eodigaljido.uk;

    ssl_certificate     /etc/letsencrypt/live/eodigaljido.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eodigaljido.uk/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/web_front/eodigaljido-share-web/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    location /api/ {
        proxy_pass http://3.36.85.213:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /.well-known/apple-app-site-association {
        default_type application/json;
        try_files $uri =404;
    }

    location /.well-known/ {
        default_type application/json;
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 9. 동작 확인

```bash
curl -I https://eodigaljido.uk
curl -I https://eodigaljido.uk/courses/public/test-id
curl https://eodigaljido.uk/.well-known/assetlinks.json
```

---

## 10. 재배포 (ec2-user)

> **주의:** `~/Backend` 가 아니라 **`/var/www/web_front`** 입니다. 백엔드(Java) 레포와 공유 웹(Vite) 레포는 서로 다릅니다.  
> `cd: /var/www/web_front: No such file or directory` 가 나오면 아래 **§10-1 최초 클론**을 먼저 실행하세요.

### 10-1. 최초 1회 — `/var/www/web_front` 없을 때

```bash
sudo mkdir -p /var/www
sudo chown ec2-user:ec2-user /var/www
cd /var/www
git clone https://github.com/Eodigaljido/web_front.git
cd /var/www/web_front/eodigaljido-share-web
# §3 .env 작성 후:
npm ci
npm run build
sudo chcon -R -t httpd_sys_content_t dist 2>/dev/null || true
sudo nginx -t && sudo systemctl reload nginx
```

### 10-2. 이후 재배포 (경로가 이미 있을 때)

```bash
cd /var/www/web_front
git pull origin main
cd /var/www/web_front/eodigaljido-share-web
npm ci
npm run build
sudo chcon -R -t httpd_sys_content_t /var/www/web_front/eodigaljido-share-web/dist 2>/dev/null || true
sudo nginx -t && sudo systemctl reload nginx
```

---

## 11. 체크리스트

- [ ] EC2 보안 그룹 80/443 개방
- [ ] DNS A 레코드 → EC2 퍼블릭 IP
- [ ] `npm run build` 후 `dist/` 존재
- [ ] SPA 라우팅 OK
- [ ] `/api/` 프록시 OK
- [ ] HTTPS + certbot 갱신
- [ ] `.well-known` TEAM_ID / SHA-256 확인

---

## 12. 문제 해결

| 증상 | 조치 |
|------|------|
| `No such file or directory` `/var/www/web_front` | §10-1 로 **web_front** 클론 (Backend 폴더와 별개) |
| `npm ci` / `package.json` ENOENT, `Backend` 경로 | `pwd` 확인 → `cd /var/www/web_front/eodigaljido-share-web` |
| `git pull` 이 Backend만 갱신됨 | `cd /var/www/web_front` 에서 pull |
| **500 Internal Server Error** | 아래 §12-1 — 대부분 `dist/index.html` 없음·경로 불일치 |
| 403 Forbidden | SELinux `chcon`, `dist` 경로·권한 확인 |
| 502 `/api` | API 서버, EC2→백엔드 SG/포트 확인 |
| nginx 설정 오류 | `sudo nginx -t` |
| certbot 실패 | DNS 전파, 80 포트 개방 확인 |

### 12-1. 500 Internal Server Error

Nginx 설정은 있는데 **빌드 결과(`dist`)가 없거나 경로가 다를 때** 자주 납니다. (`try_files` → `/index.html` 무한 루프)

```bash
# 1) Nginx가 보는 root와 파일 존재 여부
sudo grep -E "^\s*root " /etc/nginx/conf.d/eodigaljido-share.conf
ls -la /var/www/web_front/eodigaljido-share-web/dist/index.html

# 없으면 → shere_front만 클론한 경우: 이동 후 빌드
sudo mkdir -p /var/www
sudo mv ~/shere_front /var/www/web_front 2>/dev/null || true
cd /var/www/web_front/eodigaljido-share-web
npm ci && npm run build
ls -la dist/index.html

# 2) 에러 로그 (원인 한 줄 확인)
sudo tail -40 /var/log/nginx/error.log

# 3) 권한·SELinux
sudo chmod -R a+rX /var/www/web_front
sudo chcon -R -t httpd_sys_content_t /var/www/web_front/eodigaljido-share-web/dist

# 4) 로컬 응답 코드
curl -sI http://127.0.0.1/ -H "Host: eodigaljido.uk" | head -5

sudo nginx -t && sudo systemctl reload nginx
```

로그에 `rewrite or internal redirection cycle` 인데 `dist/index.html` **이미 있음** → Nginx **`root`가 다른 경로**이거나, 예전 도메인(`share.eodigaljido.rjsgud.com`)용 `server` 블록이 남아 있음.

```bash
# 어떤 server_name / root 가 쓰이는지 확인
sudo nginx -T 2>/dev/null | grep -E "server_name|root " | grep -A0 -B0 .

# 예: Host가 share.eodigaljido.rjsgud.com 인데 root 가 옛 경로면 500
curl -sI http://127.0.0.1/ -H "Host: share.eodigaljido.rjsgud.com" | head -3
curl -sI http://127.0.0.1/ -H "Host: eodigaljido.uk" | head -3
```

**조치:** `eodigaljido-share.conf` 에서 모든 관련 `server` 블록의 `root` 를 아래로 통일하고, `server_name` 을 `eodigaljido.uk` 로 맞추거나 예전 도메인은 301 리다이렉트.

```nginx
root /var/www/web_front/eodigaljido-share-web/dist;
```

---

## 13. 예전 도메인 → eodigaljido.uk (명령어로 일괄 수정)

EC2 에서 **아래 블록 전체**를 복사해 한 번에 실행하세요. (`internal redirection cycle` / 500 해결)

```bash
set -euo pipefail

CONF=/etc/nginx/conf.d/eodigaljido-share.conf
DIST=/var/www/web_front/eodigaljido-share-web/dist
LEGACY=share.eodigaljido.rjsgud.com
DOMAIN=eodigaljido.uk

# 사전 확인
test -f "$DIST/index.html"
sudo test -f "$CONF"

echo "=== 수정 전 ==="
sudo grep -nE 'server_name|root ' "$CONF" || true

# 백업
sudo cp -a "$CONF" "${CONF}.bak.$(date +%Y%m%d%H%M%S)"

# 1) 모든 server 블록의 root → 실제 dist 경로
sudo sed -i "s|^[[:space:]]*root[[:space:]].*;|    root ${DIST};|" "$CONF"

# 2) server_name 에 eodigaljido.uk 추가 (예전 도메인만 있는 줄)
sudo sed -i \
  -e "s/^\([[:space:]]*server_name[[:space:]]\+\)${LEGACY}\(.*\);/\1${DOMAIN} ${LEGACY}\2;/" \
  -e "s/^\([[:space:]]*server_name[[:space:]]\+\)${DOMAIN}[[:space:]]\+${DOMAIN}\(.*\);/\1${DOMAIN}\2;/" \
  "$CONF"

# 3) Certbot 경로가 예전 도메인 폴더면 신규로 (인증서가 이미 있을 때만)
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  sudo sed -i "s|/etc/letsencrypt/live/${LEGACY}/|/etc/letsencrypt/live/${DOMAIN}/|g" "$CONF"
else
  echo "참고: /etc/letsencrypt/live/${DOMAIN} 없음 → SSL 경로는 그대로 두었습니다."
  echo "      HTTPS용: sudo certbot --nginx -d ${DOMAIN} --redirect"
fi

# 4) 예전 도메인 HTTP → 신규 HTTPS 리다이렉트 (중복 없을 때만)
REDIR=/etc/nginx/conf.d/eodigaljido-legacy-redirect.conf
if [ ! -f "$REDIR" ]; then
  sudo tee "$REDIR" >/dev/null <<NGINX
server {
    listen 80;
    server_name ${LEGACY};
    return 301 https://${DOMAIN}\$request_uri;
}
NGINX
fi

# SELinux·권한
sudo chmod -R a+rX /var/www/web_front
sudo chcon -R -t httpd_sys_content_t "$DIST" 2>/dev/null || true

echo "=== 수정 후 ==="
sudo grep -nE 'server_name|root ' "$CONF" || true

sudo nginx -t
sudo systemctl reload nginx

echo "=== 응답 테스트 ==="
curl -sI "http://127.0.0.1/" -H "Host: ${LEGACY}" | head -5
curl -sI "http://127.0.0.1/" -H "Host: ${DOMAIN}" | head -5
echo "완료. 브라우저에서 https://${DOMAIN}/ 확인"
```

### 13-1. HTTP 404 / SSL 없음 / 붙여넣기 깨짐

> **Windows PowerShell 에서 `sudo tee` / `<<EOF` 실행 금지** → EC2 에 `ssh ec2-user@3.36.85.213` 접속한 **Linux 셸**에서만 실행.

**404 + `conflicting server name ... ignored`** → `conf.d` 에 예전 스니펫이 겹침. 긴급 최소 설정:

```bash
bash /var/www/web_front/eodigaljido-share-web/scripts/nginx-fix-http-minimal.sh
```

(스크립트 없으면 `git pull` 후 실행, 또는 §13-1 아래 **수동 4줄**)

```bash
sudo mv /etc/nginx/conf.d/eodigaljido-legacy-redirect.conf /etc/nginx/conf.d/eodigaljido-legacy-redirect.conf.disabled 2>/dev/null || true
sudo tee /etc/nginx/conf.d/eodigaljido-share.conf << 'EOF'
server {
    listen 80 default_server;
    server_name eodigaljido.uk share.eodigaljido.rjsgud.com;
    root /var/www/web_front/eodigaljido-share-web/dist;
    index index.html;
    location /api/ { proxy_pass http://127.0.0.1:8080/api/; proxy_set_header Host $host; }
    location / { try_files $uri $uri/ /index.html; }
}
EOF
sudo nginx -t && sudo systemctl reload nginx
curl -sI http://127.0.0.1/ -H "Host: eodigaljido.uk" | head -3
```

**`dig` 가 비어 있음** → Certbot 불가. Cloudflare **A `@` → EC2 IP**, 등록업체 **NS = Cloudflare** 먼저.  
임시 확인: PC `hosts` 에 `3.36.85.213 eodigaljido.uk` 추가 후 브라우저 `http://eodigaljido.uk/`

정식 배포 스크립트 (`git pull` 후):

```bash
cd /var/www/web_front
git pull origin main
bash eodigaljido-share-web/scripts/nginx-fix-share-web.sh
```

- SSL 인증서 **있으면** → HTTPS(443) + HTTP→HTTPS 리다이렉트
- SSL **없으면** → HTTP(80)만으로 `dist` 서빙 (종료하지 않음)
- 끝에 `curl` / `dig` 로 자동 확인

**SSL 발급 (DNS가 3.36.85.213 로 풀린 뒤):**

```bash
sudo ls /etc/letsencrypt/live/
sudo certbot --nginx -d eodigaljido.uk -d share.eodigaljido.rjsgud.com \
  --email admin@example.com --agree-tos --no-eff-email --redirect
bash /var/www/web_front/eodigaljido-share-web/scripts/nginx-fix-share-web.sh
```

`HTTPS` 에서 `200` / HTTP 에서 `200` 또는 `301` 이면 Nginx 정상. `dig` 가 비어 있으면 **Cloudflare NS·A(@)** 를 먼저 맞추세요.

`HTTP/1.1 200` 또는 `301` 이 나오면 정상입니다. 여전히 500 이면:

```bash
sudo tail -20 /var/log/nginx/error.log
ls -la "$DIST/index.html"
```

---

## 부록: Amazon Linux 2 (AL2) 참고

```bash
# Node
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs nginx git

# Certbot (EPEL)
sudo amazon-linux-extras install epel -y
sudo yum install -y certbot python2-certbot-nginx
# 또는 python3-certbot-nginx 가 되는 AMI 면 해당 패키지 사용

# Nginx 설정은 위 5절과 동일
sudo tee /etc/nginx/conf.d/eodigaljido-share.conf << 'NGINX'
# ... 위와 동일 ...
NGINX
```

AL2 에는 `http2 on;` 대신 `listen 443 ssl http2;` 형태인 nginx 버전이 많습니다 (패키지 버전 확인).

---

## SSH 접속 예시

```bash
ssh -i "your-key.pem" ec2-user@EC2_PUBLIC_IP
```
