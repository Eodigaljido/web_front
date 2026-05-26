# Nginx ?? ??? ? Amazon Linux EC2 (???)

**???:** `eodigaljido.uk`  
**OS:** Amazon Linux 2023 (EC2 ?? AMI ??)  
**SSH ???:** `ec2-user`  
**??:** Public GitHub ? `git clone` (?? ??)

> Amazon Linux **2** ? ?? ? ?? ?AL2 ???? ???.

---

## 0. ?? (? ?? ??)

```bash
export DOMAIN="eodigaljido.uk"
export REPO_URL="https://github.com/YOUR_GITHUB_USER/web_front.git"
export WEB_ROOT="/var/www/web_front/eodigaljido-share-web/dist"
export API_BACKEND="http://3.36.85.213:8080"
export CERT_EMAIL="admin@example.com"
```

---

## 0-1. EC2 ?? ?? (AWS ??)

???? ?? ??:

| ?? | ?? | ?? |
|------|------|------|
| SSH | 22 | ? IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

---

## 1. ??? ?? (Amazon Linux 2023)

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

## 2. ?? ?? (Public, ec2-user)

```bash
sudo mkdir -p /var/www
sudo chown ec2-user:ec2-user /var/www
cd /var/www
git clone "$REPO_URL" web_front
cd web_front/eodigaljido-share-web
```

---

## 3. ???? `.env`

```bash
cd /var/www/web_front/eodigaljido-share-web

cat > .env << 'EOF'
VITE_API_BASE_URL=
VITE_SHARE_SITE_URL=https://eodigaljido.uk
VITE_APP_SCHEME=eodigaljido
VITE_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.eodigaljido.app
VITE_APP_STORE_URL=
VITE_OG_IMAGE_URL=https://eodigaljido.uk/og-default.png
VITE_KAKAO_MAP_APP_KEY=???_JavaScript_?
VITE_KAKAO_REST_API_KEY=?_EXPO_PUBLIC_KAKAO_REST_API_KEY_?_??
EOF
```

`VITE_API_BASE_URL` ?? ? `/api` ? Nginx? ???? ??? (CORS ???).

---

## 4. ??

```bash
cd /var/www/web_front/eodigaljido-share-web
npm ci
npm run build
ls -la dist dist/.well-known
```

### SELinux (Permission denied ?)

```bash
sudo chcon -R -t httpd_sys_content_t /var/www/web_front/eodigaljido-share-web/dist
```

---

## 5. Nginx ?? (AL2023: `conf.d/`)

Amazon Linux? `sites-available` ?? **`/etc/nginx/conf.d/`** ? ???.

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

    # ??? ?? ?? (REST API ?? ???? ?)
    location /kakao-api/ {
        proxy_pass https://dapi.kakao.com/;
        proxy_set_header Host dapi.kakao.com;
        proxy_set_header Authorization "KakaoAK YOUR_KAKAO_REST_API_KEY";
        proxy_ssl_server_name on;
    }

    # Authorization ? = .env ? VITE_KAKAO_REST_API_KEY (= ? EXPO_PUBLIC_KAKAO_REST_API_KEY)

    # ??? ???(?? ?? polyline)
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
# ?? welcome ??? ??? (?? ??)
sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true

sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. DNS

| ?? | ?? | ? |
|------|------|-----|
| A | `@` (??) | `EC2_???_IP` |

```bash
dig +short eodigaljido.uk
curl -I http://eodigaljido.uk
```

---

## 7. SSL ??? (Let's Encrypt)

### 7.1 Certbot ?? (AL2023)

```bash
sudo dnf install -y certbot python3-certbot-nginx
```

### 7.2 ?? + Nginx HTTPS ?? ??

```bash
sudo certbot --nginx \
  -d eodigaljido.uk \
  --email admin@example.com \
  --agree-tos \
  --no-eff-email \
  --redirect
```

> `admin@example.com` ? ?? ???? ??.

### 7.3 ?? ???

```bash
sudo certbot renew --dry-run
sudo systemctl list-timers | grep certbot
```

---

## 8. HTTPS ?? ? config ?? (??)

Certbot? `/etc/nginx/conf.d/eodigaljido-share.conf` ? ?????.

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

## 9. ?? ??

```bash
curl -I https://eodigaljido.uk
curl -I https://eodigaljido.uk/courses/public/test-id
curl https://eodigaljido.uk/.well-known/assetlinks.json
```

---

## 10. ??? (ec2-user)

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

## 11. ?????

- [ ] EC2 ?? ?? 80/443 ??
- [ ] DNS A ? EC2 ??? IP
- [ ] `npm run build` ? `dist/`
- [ ] SPA ???? OK
- [ ] `/api/` ??? OK
- [ ] HTTPS + certbot ??
- [ ] `.well-known` TEAM_ID / SHA-256 ??

---

## 12. ?????

| ?? | ?? |
|------|------|
| 403 Forbidden | SELinux `chcon`, `dist` ??·?? |
| 502 `/api` | API ??, EC2???? SG/??? |
| nginx ?? ?? | `sudo nginx -t` |
| certbot ?? | DNS ??, 80 ?? ?? |

---

## ??: Amazon Linux 2 (AL2) ??

```bash
# Node
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs nginx git

# Certbot (EPEL)
sudo amazon-linux-extras install epel -y
sudo yum install -y certbot python2-certbot-nginx
# ?? python3-certbot-nginx ????? AMI? ?? ??

# Nginx ?? ?? ??
sudo tee /etc/nginx/conf.d/eodigaljido-share.conf << 'NGINX'
# ... ?? ?? ...
NGINX
```

AL2?? `http2 on;` ?? `listen 443 ssl http2;` ??? ?? ??? ???? (nginx ??? ??).

---

## SSH ?? ??

```bash
ssh -i "your-key.pem" ec2-user@EC2_PUBLIC_IP
```
