# 🚀 Deployment Guide — नागरिक सरोकार

> Deploy the complaint system to a live, publicly accessible URL that works 24/7.

---

## 🔴 Immediate Live Demo (Temporary)

The app is currently running at:

**https://copy-dawn-forests-projects.trycloudflare.com**

Scan the QR code at `public/qr-demo.png` to access from your phone.

⚠️ **This URL is temporary.** It stops when this laptop shuts down. Use the guide below for a permanent deployment.

---

## 🏆 Permanent Deployment (Always-On, Free)

### Option 1: Railway (Recommended — Fastest)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template)

1. **Sign up** at https://railway.app (GitHub login — 10 seconds)
2. Click the **"Deploy on Railway"** button above
3. Select your GitHub repo: `dhakalnitesh/complain_tracking`
4. Railway auto-detects Laravel + MySQL
5. Add a **MySQL** database plugin from the Railway dashboard
6. Set these environment variables:
   ```
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://your-app.railway.app
   DB_CONNECTION=mysql
   ```
7. Railway automatically links the database vars
8. Run `php artisan key:generate --force` and `php artisan migrate --seed` in Railway shell
9. ✅ **Done in 3 minutes.** Your permanent URL: `https://your-app.railway.app`

### Option 2: Render (Also Free, Sleeps After Inactivity)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. **Sign up** at https://render.com
2. Click **"New +" → Web Service** → connect GitHub repo
3. Render auto-detects the `render.yaml` blueprint in the repo
4. It creates both the web service and MySQL database automatically
5. Run `php artisan migrate --seed` in the Render shell
6. ✅ **Your URL:** `https://nagarik-sarokar.onrender.com`

⚠️ **Render's free tier sleeps after 15 minutes of inactivity.** It wakes up when someone visits (takes ~30 seconds).

### Option 3: Self-Hosted (Maximum Control)

```bash
# On any VPS / cloud VM with PHP 8.3 + MySQL + Node 20:
git clone https://github.com/dhakalnitesh/complain_tracking.git
cd complain_tracking
cp .env.example .env
composer install --no-dev --optimize-autoloader
npm install && npm run build
# Edit .env with your database credentials
php artisan key:generate --force
php artisan migrate --seed --force
php artisan storage:link
# Point your web server (nginx/apache) to the public/ directory
```

---

## 🔄 Updating the QR Code

After deploying, regenerate the QR code with your actual URL:

```bash
python3 -c "
import qrcode
img = qrcode.make('https://YOUR_ACTUAL_URL')
img.save('public/qr-demo.png')
"
```

Also update `public/qr-print.html` to show the correct URL.

---

## 📱 Accessing from Phone

Once deployed, just:
1. Open the URL in any browser (Chrome, Safari, etc.)
2. Bookmark it to your home screen
3. Share the link via WhatsApp

The app is fully responsive — works on mobile, tablet, and desktop.

---

## 🔑 Demo Credentials (After Deploy)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@nagariksarokar.com` | `admin123` |
| Org Admin (TU) | `tu@nagariksarokar.com` | `password` |

> After deployment, run `php artisan migrate --seed` to populate the database with demo data.

---

## 📋 Post-Deploy Checklist

- [ ] All pages load (Home, Submit, Track, Login, Admin)
- [ ] Submit a test complaint
- [ ] Track the complaint via reference code
- [ ] Admin login works, can change status
- [ ] Language toggle (EN/NP) works
- [ ] QR code links to correct URL
- [ ] WhatsApp share works
- [ ] Voice input works (Chrome/Edge only)

---

## ⚡ Quick Commands Reference

```bash
# Local dev
php artisan serve --port=8000

# Fresh database (wipes all data)
php artisan migrate:fresh --seed

# Build frontend
npm run build

# Deploy.sh (custom script)
bash deploy.sh local     # local dev server
bash deploy.sh network   # accessible on LAN
bash deploy.sh fresh     # reset database
bash deploy.sh build     # rebuild frontend
```
