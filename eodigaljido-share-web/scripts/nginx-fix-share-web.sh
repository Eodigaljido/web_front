#!/usr/bin/env bash
# EC2 SSH 접속 후에만 실행 (Windows PowerShell X)
# bash /var/www/web_front/eodigaljido-share-web/scripts/nginx-fix-share-web.sh
set -euo pipefail

CONF=/etc/nginx/conf.d/eodigaljido-share.conf
DIST=/var/www/web_front/eodigaljido-share-web/dist
DOMAIN=eodigaljido.uk
LEGACY=share.eodigaljido.rjsgud.com
API=http://127.0.0.1:8080

if [ ! -f "$DIST/index.html" ]; then
  echo "ERROR: $DIST/index.html 없음. cd $DIST/.. && npm run build"
  exit 1
fi

# 80번 server_name 중복 스니펫 제거
for extra in /etc/nginx/conf.d/eodigaljido-legacy-redirect.conf; do
  if [ -f "$extra" ]; then
    sudo mv "$extra" "${extra}.disabled.$(date +%s)"
    echo "disabled: $extra"
  fi
done

KAKAO_AUTH='proxy_set_header Authorization "KakaoAK YOUR_KAKAO_REST_API_KEY";'
if [ -f "$CONF" ]; then
  KAKAO_AUTH=$(grep -m1 'proxy_set_header Authorization' "$CONF" 2>/dev/null | sed 's/^[[:space:]]*//' || echo "$KAKAO_AUTH")
fi

CERT=""
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  CERT="$DOMAIN"
elif [ -d "/etc/letsencrypt/live/${LEGACY}" ]; then
  CERT="$LEGACY"
fi

sudo cp -a "$CONF" "${CONF}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

# 카카오: 시작 시 DNS 조회 실패 방지 (resolver + 변수)
KAKAO_LOCATIONS=$(cat <<'KAKAO'

    resolver 8.8.8.8 1.1.1.1 valid=300s ipv6=off;
    resolver_timeout 5s;

    location /kakao-api/ {
        set $kakao_api https://dapi.kakao.com;
        proxy_pass $kakao_api/;
        proxy_set_header Host dapi.kakao.com;
        KAKAO_AUTH_PLACEHOLDER
        proxy_ssl_server_name on;
    }

    location /kakao-navi/ {
        set $kakao_navi https://apis-navi.kakao.com;
        proxy_pass $kakao_navi/;
        proxy_set_header Host apis-navi.kakao.com;
        KAKAO_AUTH_PLACEHOLDER
        proxy_ssl_server_name on;
    }
KAKAO
)
KAKAO_LOCATIONS="${KAKAO_LOCATIONS//KAKAO_AUTH_PLACEHOLDER/$KAKAO_AUTH}"

if [ -n "$CERT" ]; then
  echo "SSL: $CERT"
  sudo tee "$CONF" >/dev/null <<NGINX
server {
    listen 80;
    server_name ${DOMAIN} ${LEGACY};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name ${DOMAIN} ${LEGACY};

    ssl_certificate     /etc/letsencrypt/live/${CERT}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${CERT}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root ${DIST};
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 256;

    location /api/ {
        proxy_pass ${API}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
${KAKAO_LOCATIONS}

    location = /.well-known/apple-app-site-association {
        default_type application/json;
        try_files \$uri =404;
    }

    location /.well-known/ {
        default_type application/json;
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
}
NGINX
else
  echo "SSL 없음 → HTTP(80) default_server. DNS 후: sudo certbot --nginx -d ${DOMAIN}"
  sudo tee "$CONF" >/dev/null <<NGINX
server {
    listen 80 default_server;
    server_name ${DOMAIN} ${LEGACY};

    root ${DIST};
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 256;

    location /api/ {
        proxy_pass ${API}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
${KAKAO_LOCATIONS}

    location = /.well-known/apple-app-site-association {
        default_type application/json;
        try_files \$uri =404;
    }

    location /.well-known/ {
        default_type application/json;
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
}
NGINX
fi

sudo chcon -R -t httpd_sys_content_t "$DIST" 2>/dev/null || true
sudo chmod -R a+rX /var/www/web_front
sudo nginx -t
sudo systemctl reload nginx

echo ""
curl -sI "http://127.0.0.1/" -H "Host: ${DOMAIN}" | head -5
[ -n "$CERT" ] && curl -skI "https://127.0.0.1/" -H "Host: ${DOMAIN}" | head -5
dig +short "${DOMAIN}" @8.8.8.8 || true
echo "완료"
