#!/usr/bin/env bash
# 긴급: SSL·카카오 프록시 없이 HTTP만. EC2 SSH 안에서만 실행.
# bash /var/www/web_front/eodigaljido-share-web/scripts/nginx-fix-http-minimal.sh
set -euo pipefail

CONF=/etc/nginx/conf.d/eodigaljido-share.conf
DIST=/var/www/web_front/eodigaljido-share-web/dist

test -f "$DIST/index.html"

# 80번 server_name 충돌 나는 스니펫 비활성화
for extra in /etc/nginx/conf.d/eodigaljido-legacy-redirect.conf; do
  if [ -f "$extra" ]; then
    sudo mv "$extra" "${extra}.disabled.$(date +%s)"
    echo "disabled: $extra"
  fi
done

sudo cp -a "$CONF" "${CONF}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

sudo tee "$CONF" >/dev/null <<'EOF'
server {
    listen 80 default_server;
    server_name eodigaljido.uk share.eodigaljido.rjsgud.com;

    root /var/www/web_front/eodigaljido-share-web/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo chcon -R -t httpd_sys_content_t "$DIST" 2>/dev/null || true
sudo nginx -t
sudo systemctl reload nginx

echo "=== HTTP test ==="
curl -sI "http://127.0.0.1/" -H "Host: eodigaljido.uk" | head -5
echo "=== DNS (비어 있으면 Cloudflare A @ 레코드·NS 확인) ==="
dig +short eodigaljido.uk @8.8.8.8 || true
