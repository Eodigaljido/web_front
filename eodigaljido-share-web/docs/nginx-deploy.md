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
export REPO_URL="https://github.com/YOUR_GITHUB_USER/web_front.git"
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
| 403 Forbidden | SELinux `chcon`, `dist` 경로·권한 확인 |
| 502 `/api` | API 서버, EC2→백엔드 SG/포트 확인 |
| nginx 설정 오류 | `sudo nginx -t` |
| certbot 실패 | DNS 전파, 80 포트 개방 확인 |

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
