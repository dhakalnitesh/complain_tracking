# 🏛️ नागरिक सरोकार (Nagarik Sarokar) — Nepal's Complaint Management System

> A bilingual (English/Nepali) platform for citizens to submit, track, and share complaints about public services. Built with Laravel 13 + React 19 + Inertia 3 + Tailwind 4.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Submit complaints** | With photo, voice input (speech-to-text), searchable dropdowns |
| **Track by reference code** | No account required — just enter the code |
| **Real-time updates** | WebSocket notifications via Laravel Reverb |
| **Bilingual** | Full English / Nepali toggle |
| **SMS & Email notifications** | Queue-driven, pluggable channels |
| **Staff management** | Assign complaints to specific staff members |
| **Admin dashboard** | Charts, stats, filters, CSV export, pagination |
| **Protected photos** | Served by reference code (not public URLs) |
| **Honeypot anti-spam** | Bot protection without CAPTCHA friction |
| **Soft deletes** | Legal record preservation |

---

## 🚀 Quick Start

```bash
git clone https://github.com/dhakalnitesh/complain_tracking.git
cd complain_tracking

# Backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve

# Frontend (separate terminal)
npm install
npm run dev
```

**Demo credentials:**
| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@nagariksarokar.com` | `admin123` |
| TU Admin | `tu@nagariksarokar.com` | `password` |

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Laravel 13 |
| **Frontend** | React 19 + Inertia 3 |
| **Styling** | Tailwind CSS 4 |
| **Database** | SQLite (dev) / MySQL (production) |
| **Charts** | Recharts |
| **WebSockets** | Laravel Reverb |
| **Queue** | Database driver (MySQL-based) |
| **Cache** | File driver (Redis-ready) |

---

## 📁 Key Documentation

| Document | What it covers |
|----------|---------------|
| [`UserManual.md`](UserManual.md) | Full user guide for citizens and admins |
| [`DEPLOY.md`](DEPLOY.md) | Deployment to Railway / Render / VPS |
| [`DeploymentLog.md`](DeploymentLog.md) | Complete deployment command history |
| [`SoftwareConceptsImplementation.md`](SoftwareConceptsImplementation.md) | Architecture decisions & rationale |
| [`PackagesDocumentation.md`](PackagesDocumentation.md) | Every dependency explained |
| [`HackathonPitchKit.md`](HackathonPitchKit.md) | Live demo script & pitch deck |
| [`ReactGuideForVueDevs.md`](ReactGuideForVueDevs.md) | React concepts mapped for Vue developers |

---

## 🧪 Running Tests

```bash
php artisan test
# 55 tests, 97 assertions — all pass
```

---

## 📄 License

MIT
