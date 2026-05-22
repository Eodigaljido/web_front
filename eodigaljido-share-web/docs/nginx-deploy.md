# Nginx 배포 가이드 — Amazon Linux EC2 (복사용)

**도메인:** `share.eodigaljido.rjsgud.com`  
**OS:** Amazon Linux 2023 (EC2 기본 AMI 권장)  
**SSH 사용자:** `ec2-user`  
**레포:** Public GitHub → `git clone` (인증 없음)

> Amazon Linux **2** 는 섹션 맨 아래 「AL2 참고」를 보세요.

---

## 0. 변수 (한 번만 수정)

```bash
export DOMAIN="share.eodigaljido.rjsgud.com"
export REPO_URL="https://github.com/YOUR_GITHUB_USER/web_front.git"
export WEB_ROOT="/var/www/web_front/eodigaljido-share-web/dist"
export API_BACKEND="http://3.36.85.213:8080"
export CERT_EMAIL="admin@example.com"
```

---

## 0-1. EC2 보안 그룹 (AWS 콘솔)

인바운드 규칙 추가:

| 타입 | 포트 | 소스 |
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

## 2. 레포 클론 (Public, ec2-user)

```bash
sudo mkdir -p /var/www
sudo chown ec2-user:ec2-user /var/www
cd /var/www
git clone "$REPO_URL" web_front
cd web_front/eodigaljido-share-web
```

---

## 3. 프로덕션 `.env`

```bash
cd /var/www/web_front/eodigaljido-share-web

cat > .env << 'EOF'
VITE_API_BASE_URL=
VITE_SHARE_SITE_URL=https://share.eodigaljido.rjsgud.com
VITE_APP_SCHEME=eodigaljido
VITE_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.eodigaljido.app
VITE_APP_STORE_URL=
VITE_OG_IMAGE_URL=https://share.eodigaljido.rjsgud.com/og-default.png
EOF
```

`VITE_API_BASE_URL` 비움 → `/api` 를 Nginx가 백엔드로 프록시 (CORS 불필요).

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

Amazon Linux는 `sites-available` 대신 **`/etc/nginx/conf.d/`** 를 씁니다.

```bash
sudo tee /etc/nginx/conf.d/eodigaljido-share.conf << 'NGINX'
server {
    listen 80;
    server_name share.eodigaljido.rjsgud.com;

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

    # 지도 지오코딩 (브라우저 CORS 회피)
    location /geocode/ {
        proxy_pass https://nominatim.openstreetmap.org/;
        proxy_set_header Host nominatim.openstreetmap.org;
        proxy_set_header User-Agent "EodigaljidoShareWeb/1.0 (https://share.eodigaljido.rjsgud.com)";
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
# 기본 welcome 페이지 비활성 (충돌 방지)
sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true

sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. DNS

| 타입 | 이름 | 값 |
|------|------|-----|
| A | `share` | `EC2_탄력적_IP` |

```bash
dig +short share.eodigaljido.rjsgud.com
curl -I http://share.eodigaljido.rjsgud.com
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
  -d share.eodigaljido.rjsgud.com \
  --email admin@example.com \
  --agree-tos \
  --no-eff-email \
  --redirect
```

> `admin@example.com` → 실제 이메일로 변경.

### 7.3 갱신 테스트

```bash
sudo certbot renew --dry-run
sudo systemctl list-timers | grep certbot
```

---

## 8. HTTPS 적용 후 config 예시 (참고)

Certbot이 `/etc/nginx/conf.d/eodigaljido-share.conf` 를 수정합니다.

```nginx
server {
    listen 80;
    server_name share.eodigaljido.rjsgud.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name share.eodigaljido.rjsgud.com;

    ssl_certificate     /etc/letsencrypt/live/share.eodigaljido.rjsgud.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/share.eodigaljido.rjsgud.com/privkey.pem;
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

## 9. 배포 확인

```bash
curl -I https://share.eodigaljido.rjsgud.com
curl -I https://share.eodigaljido.rjsgud.com/courses/public/test-id
curl https://share.eodigaljido.rjsgud.com/.well-known/assetlinks.json
```

---

## 10. 재배포 (ec2-user)

```bash
cd /var/www/web_front
git pull origin main
cd eodigaljido-share-web
npm ci
npm run build
sudo chcon -R -t httpd_sys_content_t dist 2>/dev/null || true
sudo nginx -t && sudo systemctl reload nginx
```

---

## 11. 체크리스트

- [ ] EC2 보안 그룹 80/443 오픈
- [ ] DNS A → EC2 탄력적 IP
- [ ] `npm run build` → `dist/`
- [ ] SPA 새로고침 OK
- [ ] `/api/` 프록시 OK
- [ ] HTTPS + certbot 갱신
- [ ] `.well-known` TEAM_ID / SHA-256 교체

---

## 12. 트러블슈팅

| 증상 | 확인 |
|------|------|
| 403 Forbidden | SELinux `chcon`, `dist` 경로·권한 |
| 502 `/api` | API 서버, EC2→백엔드 SG/방화벽 |
| nginx 설정 오류 | `sudo nginx -t` |
| certbot 실패 | DNS 전파, 80 포트 개방 |

---

## 부록: Amazon Linux 2 (AL2) 참고

```bash
# Node
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs nginx git

# Certbot (EPEL)
sudo amazon-linux-extras install epel -y
sudo yum install -y certbot python2-certbot-nginx
# 또는 python3-certbot-nginx 패키지명은 AMI에 따라 다름

# Nginx 설정 경로 동일
sudo tee /etc/nginx/conf.d/eodigaljido-share.conf << 'NGINX'
# ... 위와 동일 ...
NGINX
```

AL2에서 `http2 on;` 대신 `listen 443 ssl http2;` 형태를 쓰는 경우가 있습니다 (nginx 버전에 따름).

---

## SSH 접속 예시

```bash
ssh -i "your-key.pem" ec2-user@EC2_PUBLIC_IP
```
