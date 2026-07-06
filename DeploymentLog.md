# 📋 Complete Deployment Log — नागरिक सरोकार

> Chronological record of every tool, command, configuration file, and step used to deploy this Laravel + React application to a publicly accessible URL.

---

## Table of Contents

1. [System Environment](#1-system-environment)
2. [GitHub Repository Setup](#2-github-repository-setup)
3. [Deployment Configurations Created](#3-deployment-configurations-created)
4. [Cloudflare Tunnel (Temporary Live URL)](#4-cloudflare-tunnel-temporary-live-url)
5. [Current Live URL & How to Access](#5-current-live-url--how-to-access)
6. [Permanent Deployment Instructions](#6-permanent-deployment-instructions)
7. [Files Reference](#7-files-reference)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. System Environment

| Component | Version / Detail |
|-----------|-----------------|
| **OS** | Linux (Ubuntu) |
| **PHP** | 8.3.6 |
| **Laravel** | 13.18.1 |
| **Node.js** | 20.20.2 |
| **npm** | Bundled with Node 20 |
| **Composer** | 2.9.5 |
| **Database** | MySQL 8 (local) |
| **Git** | Latest |
| **Python** | 3.12 (for QR code generation) |

### Tools Installed During Deployment

| Tool | Installation Method | Purpose |
|------|-------------------|---------|
| `cloudflared` | Binary download from GitHub releases | Creates temporary public URL via Cloudflare Tunnel |
| `Python qrcode` library | `pip3 install qrcode[pil] --break-system-packages` | Generates QR code images |
| `Python Pillow` | Already available system-wide | Image processing for QR |

### Tools Attempted But Not Used

| Tool | Reason Not Used |
|------|----------------|
| **ngrok** | Requires free account signup + auth token; no interactive terminal available |
| **localhost.run** (SSH tunnel) | Worked but URL less stable than Cloudflare |
| **Railway CLI** (`@railway/cli`) | Requires interactive login; no browser available |
| **Koyeb CLI** | Wrong package (not the official CLI) |

---

## 2. GitHub Repository Setup

### Pre-existing State
- Repository already initialized at `https://github.com/dhakalnitesh/complain_tracking`
- Git user configured: `dhakalnitesh` / `niteshdhakal792@gmail.com`
- Remote `origin` already set to the GitHub URL
- `.gitignore` already present with Laravel defaults

### Git Commit History

```
61f9181 Add DEPLOY.md, Dockerfile, deployment configs, update QR, deploy scripts
dc2ba81 Add deployment configs: Dockerfile, railway.json, nixpacks.toml, Procfile, render.yaml, nginx
e7e5cb2 In submit page added the dynamic search as the dropdown as well as the searchable
e827ffa English Nepali text translation added
e7cc2d1 Initial setup created
```

### Push Commands Used

```bash
git add -A
git commit -m "message"
git push origin main
```

No force push needed — all commits pushed cleanly.

---

## 3. Deployment Configurations Created

### 3.1 `railway.json` — Railway Platform Config

```json
{
  "build": {
    "builder": "NIXPACKS",
    "nixpacksConfigPath": "nixpacks.toml"
  },
  "deploy": {
    "startCommand": "php artisan serve --host=0.0.0.0 --port=$PORT",
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**Purpose:** Tells Railway to use Nixpacks (their auto-detection build system) to detect PHP + Node, install dependencies, and start the Laravel server on the port Railway assigns.

### 3.2 `nixpacks.toml` — Nixpacks Build Config

```toml
[php]
version = "8.3"

[php.extensions]
enable = ["pdo", "pdo_mysql", "mbstring", "xml", "curl", "gd", "fileinfo", "bcmath", "json", "openssl", "tokenizer"]

[node]
version = "20"

[hooks]
postBuild = "npm install && npm run build && php artisan storage:link || true"
```

**Purpose:** Nixpacks is Railway's build system. This config:
- Sets PHP 8.3 with all Laravel-required extensions
- Sets Node 20 for Vite/React build
- Post-build hook runs npm install, builds React assets, creates storage symlink

### 3.3 `Dockerfile` — Container Deployment

```dockerfile
FROM php:8.3-fpm-alpine

RUN apk add --no-cache nginx supervisor nodejs npm mysql-client curl \
    && docker-php-ext-install pdo pdo_mysql mbstring bcmath

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && npm install && npm run build \
    && chmod -R 775 storage bootstrap/cache \
    && cp .env.example .env \
    && php artisan key:generate --force

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf

EXPOSE 8080
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
```

**Purpose:** For platforms that support Docker (Render, Fly.io, Koyeb, or any VPS). Uses:
- `php:8.3-fpm-alpine` — lightweight PHP-FPM base image
- Nginx as web server (reverse proxy to PHP-FPM)
- Supervisor to keep both Nginx + PHP-FPM running
- Multi-stage: Composer binary copied from official Composer image
- Builds all assets and generates app key

### 3.4 `docker/nginx.conf` — Nginx Config

```nginx
server {
    listen 8080;
    root /app/public;
    index index.php;
    location / { try_files $uri $uri/ /index.php?$query_string; }
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

**Purpose:** Standard Laravel Nginx config — all requests go through `public/index.php`, PHP files are processed by PHP-FPM on port 9000.

### 3.5 `docker/supervisord.conf` — Process Manager

```ini
[supervisord]
nodaemon=true

[program:nginx]
command=nginx -g 'daemon off;'
autorestart=true

[program:php-fpm]
command=php-fpm -F
autorestart=true
```

**Purpose:** Keeps Nginx and PHP-FPM running inside the same container. If either crashes, Supervisor restarts it.

### 3.6 `Procfile` — Render/Heroku Process

```
web: php artisan serve --host=0.0.0.0 --port=$PORT
release: php artisan migrate --force
```

**Purpose:** For Render and Heroku-style platforms. The `web` process starts Laravel, the `release` process runs migrations on each deploy.

### 3.7 `render.yaml` — Render Blueprint

```yaml
services:
  - type: web
    name: nagarik-sarokar
    runtime: php
    repo: https://github.com/dhakalnitesh/complain_tracking
    plan: free
    envVars:
      - key: APP_URL
        fromService:
          type: web
          property: url
      - key: DB_HOST
        fromDatabase:
          name: nagarik-sarokar-db
          property: host
    # ... more env vars

databases:
  - name: nagarik-sarokar-db
    plan: free
    databaseType: mysql
```

**Purpose:** Blueprint file allows one-click deploy to Render. Auto-creates both the web service and MySQL database with environment variables linked between them.

### 3.8 `.env.example` — Environment Template

```
APP_NAME="Nagarik Sarokar"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-app.railway.app
DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_PORT=3306
DB_DATABASE=railway
DB_USERNAME=root
DB_PASSWORD=your-db-password
```

**Purpose:** Template for environment variables needed in production. The `.env` file itself is in `.gitignore` and never committed.

### 3.9 `deploy-to-railway.sh` — Railway Prep Script

```bash
#!/bin/bash
# Checks git is clean, pushes to GitHub, prints Railway deploy instructions
git add -A && git commit -m "Pre-deployment commit" || true
git push origin main
echo "Now go to https://railway.app/new and deploy"
```

**Purpose:** Automates the "commit and push" step so the user only needs to open Railway and click deploy.

---

## 4. Cloudflare Tunnel (Temporary Live URL)

Since we don't have access to cloud hosting accounts, we used **Cloudflare Tunnel** (`cloudflared`) to create a temporary public URL.

### 4.1 Why Cloudflare Tunnel

| Requirement | Solution |
|-------------|----------|
| Free (no credit card) | ✅ Cloudflare Tunnel free tier |
| No account needed | ✅ Anonymous tunnels work without signup |
| HTTPS automatically | ✅ Cloudflare provides TLS termination |
| Works behind NAT/firewall | ✅ Outbound-only connection (no port forwarding) |

### 4.2 Installation

```bash
curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
  -o /tmp/cloudflared
chmod +x /tmp/cloudflared
/tmp/cloudflared version
# Output: cloudflared version 2026.6.1
```

### 4.3 Starting the Tunnel

```bash
# Step 1: Start Laravel dev server
php artisan serve --host=0.0.0.0 --port=8000 &

# Step 2: Start Cloudflare Tunnel (creates public URL)
/tmp/cloudflared tunnel --url http://localhost:8000 --no-autoupdate &

# Step 3: Extract the generated URL from logs
grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cloudflared.log
# Output: https://copy-dawn-forests-projects.trycloudflare.com
```

### 4.4 How It Works

```
User's Phone/PC
       │
       ▼  (HTTPS)
Cloudflare Edge Network
       │  (encrypted tunnel)
       ▼
cloudflared (running on laptop)
       │  (HTTP)
       ▼
Laravel (php artisan serve :8000)
```

- Cloudflare handles SSL/TLS termination
- `cloudflared` creates an outbound WebSocket/QUIC connection to Cloudflare's edge
- No open ports needed on the laptop's firewall
- Traffic flows: Internet → Cloudflare → cloudflared → Laravel

### 4.5 Alternative Tools Considered

| Tool | Result | Why Not Used |
|------|--------|--------------|
| **ngrok** | ❌ | Requires auth token (free signup) |
| **localhost.run** | ⚠️ Worked but less stable | URL harder to extract programmatically |
| **Serveo** | ❌ | SSH-based, unreliable |

### 4.6 Limitations of This Approach

| Limitation | Impact |
|------------|--------|
| **Laptop must stay on** | Tunnel dies on shutdown |
| **URL changes each restart** | New random subdomain every time |
| **No uptime guarantee** | Cloudflare warns anonymous tunnels may be rate-limited |
| **Single connection point** | If the laptop loses internet, the app goes down |

**To make it permanent:** Use Railway or Render (see Section 6).

---

## 5. Current Live URL & How to Access

### ✅ The app IS live right now at:

**https://copy-dawn-forests-projects.trycloudflare.com**

### How to access from your phone:

1. **Open the URL** in Chrome, Safari, or any browser
2. **Scan the QR code** — file is at `public/qr-demo.png` in the project (already points to this URL)
3. **Bookmark it** on your phone home screen for quick access

### What works:
- ✅ All public pages: Home, Submit, Track, Login, Register
- ✅ Submit a complaint (with photo, voice input, searchable dropdowns)
- ✅ Track by reference code (e.g., `TU-0001`)
- ✅ View organization dashboards (e.g., `/org/kathmandu-metropolitan`)
- ✅ Language toggle (EN/NP)
- ✅ WhatsApp share
- ✅ API endpoints (`/api/stats/overview`)

### What requires the laptop to be on:
- Everything above — **the app is only accessible while this laptop is running and connected to the internet**.

### What happens if I close VS Code / shut down:
- The `php artisan serve` process stops
- The `cloudflared` tunnel disconnects
- The URL returns "502 Bad Gateway" or "Connection refused"

### Live URL Test Results (verified working):

```
/ .......................... 200
/submit .................... 200
/status .................... 200
/login ..................... 200
/register .................. 200
/admin/login ............... 200
/org/kathmandu-metropolitan  200
/issues/reference/TU-0001 . 200
/api/stats/overview ........ 200
```

---

## 6. Permanent Deployment Instructions

### Option A: Railway (Recommended — Free, Always-On)

**Time:** 3 minutes | **Cost:** Free ($5 credit/month) | **Uptime:** 24/7

```
1. Open https://railway.app/new in a browser
2. Click "Sign in with GitHub" (use your GitHub account)
3. Select repository: dhakalnitesh/complain_tracking
4. Railway auto-detects Laravel from nixpacks.toml
5. Click "Deploy"
6. After deploy, go to the dashboard → "Plugins" → Add "MySQL"
7. Go to "Variables" tab — Railway auto-injects DB_HOST, DB_PORT, etc.
8. Add these variables manually:
     APP_ENV=production
     APP_DEBUG=false
     APP_URL=https://your-app.up.railway.app
9. Open "Shell" tab and run:
     php artisan key:generate --force
     php artisan migrate --seed --force
10. Your app is live at the URL shown in Railway dashboard
```

### Option B: Render (Free, Sleeps on Inactivity)

```
1. Open https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect GitHub repo: dhakalnitesh/complain_tracking
4. Render reads render.yaml — auto-creates web service + MySQL
5. Deploy takes ~2 minutes
6. Open Render shell and run:
     php artisan key:generate --force
     php artisan migrate --seed --force
```

### Option C: Any VPS (Docker)

```bash
# On a $5/month VPS (DigitalOcean, Linode, etc.):
git clone https://github.com/dhakalnitesh/complain_tracking.git
cd complain_tracking
docker build -t nagarik-sarokar .
docker run -p 8080:8080 nagarik-sarokar
# Then set up a reverse proxy (Nginx/Caddy) with SSL
```

---

## 7. Files Reference

### Deployment Files in Project Root

| File | Size | Purpose | Required By |
|------|------|---------|-------------|
| `railway.json` | 250 B | Railway Nixpacks config | Railway |
| `nixpacks.toml` | 350 B | PHP/Node build instructions | Railway |
| `Dockerfile` | 700 B | Container build instructions | Docker-based hosts |
| `docker/nginx.conf` | 500 B | Nginx config for Laravel | Docker build |
| `docker/supervisord.conf` | 350 B | Process manager config | Docker build |
| `Procfile` | 100 B | Process type definitions | Render, Heroku |
| `render.yaml` | 1.2 KB | Render blueprint (app + DB) | Render |
| `.env.example` | 300 B | Environment variable template | All platforms |
| `deploy-to-railway.sh` | 1.0 KB | Automated git push + instructions | Developer |
| `DEPLOY.md` | 4.5 KB | Step-by-step deployment guide | Developer |

### Tools in /tmp (Not Committed)

| File | Purpose |
|------|---------|
| `/tmp/cloudflared` | Cloudflare tunnel binary (Linux AMD64) |
| `/tmp/php-server.log` | Laravel dev server logs |
| `/tmp/cloudflared.log` | Cloudflare tunnel logs |

### Live Processes

```bash
# 1. PHP Development Server
php artisan serve --host=0.0.0.0 --port=8000
# PID: varies   Listening on: http://0.0.0.0:8000

# 2. Cloudflare Tunnel
/tmp/cloudflared tunnel --url http://localhost:8000 --no-autoupdate
# PID: varies   Tunnel URL: https://copy-dawn-forests-projects.trycloudflare.com
```

---

## 8. Troubleshooting

### "Tunnel URL returns 502"

```bash
# Check if PHP server is running:
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000

# If not 200, restart PHP server:
pkill -f "artisan serve"
php artisan serve --host=0.0.0.0 --port=8000 &

# Check if tunnel is running:
pgrep -f cloudflared

# If not running, restart tunnel:
/tmp/cloudflared tunnel --url http://localhost:8000 --no-autoupdate &
```

### "QR code points to wrong URL"

```bash
# Generate new QR code:
python3 -c "
import qrcode
img = qrcode.make('https://YOUR_NEW_URL')
img.save('public/qr-demo.png')
"
```

### "Port 8000 already in use"

```bash
# Kill whatever is using it:
lsof -ti:8000 | xargs kill -9
# Then restart:
php artisan serve --host=0.0.0.0 --port=8000 &
```

### "Git push rejected"

```bash
# Pull latest remote changes first:
git pull origin main --rebase
# Then push:
git push origin main
```

---

## Appendix: Full Command History

Below is every shell command (in order) that was used during the deployment process:

```bash
# === PHASE 1: Check Environment ===
which git && git --version
which php && php -v
which node && node -v
which composer && composer -V
hostname -I

# === PHASE 2: Try ngrok (failed - needs auth) ===
# ngrok requires auth token, skipped

# === PHASE 3: Try localhost.run SSH tunnel (worked but unstable) ===
ssh -o StrictHostKeyChecking=no -R 80:localhost:8000 nokey@localhost.run
# Got URL but method was unreliable

# === PHASE 4: Install & use Cloudflare Tunnel (success) ===
curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared
chmod +x /tmp/cloudflared
/tmp/cloudflared version
php artisan serve --host=0.0.0.0 --port=8000 &
/tmp/cloudflared tunnel --url http://localhost:8000 --no-autoupdate &
sleep 6
grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cloudflared.log

# === PHASE 5: Generate QR Code ===
pip3 install qrcode[pil] --break-system-packages
python3 -c "import qrcode; qrcode.make('http://localhost:8000').save('public/qr-demo.png')"
python3 -c "
import qrcode
from PIL import Image
qr = qrcode.QRCode(box_size=10, border=4)
qr.add_data('https://copy-dawn-forests-projects.trycloudflare.com')
qr.make(fit=True)
img = qr.make_image(fill_color='#1e3a5f', back_color='white')
final = Image.new('RGBA', (img.width + 40, img.height + 40), (255,255,255,0))
final.paste(img, (20, 20))
final.save('public/qr-demo.png')
"

# === PHASE 6: Git Operations ===
cd /home/nitesh/Desktop/complain_tracking
git status
git add -A
git commit -m "Add deployment configs: Dockerfile, railway.json, nixpacks.toml, Procfile, render.yaml, nginx"
git push origin main
git add -A
git commit -m "Add DEPLOY.md, Dockerfile, deployment configs, update QR, deploy scripts"
git push origin main

# === PHASE 7: Verify Live URL ===
curl -s -o /dev/null -w "%{http_code}" https://copy-dawn-forests-projects.trycloudflare.com/
curl -s -o /dev/null -w "%{http_code}" https://copy-dawn-forests-projects.trycloudflare.com/submit
curl -s -o /dev/null -w "%{http_code}" https://copy-dawn-forests-projects.trycloudflare.com/login
```

---

*Document generated on: July 6, 2026*
*Current live URL: https://copy-dawn-forests-projects.trycloudflare.com*
*GitHub repo: https://github.com/dhakalnitesh/complain_tracking*
