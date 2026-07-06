# 🏆 Hackathon Pitch Kit — नागरिक सरोकार

> Use this kit to prepare your live demo and pitch. Print the QR code page (`public/qr-print.html`) and place it next to your demo station.

---

## 1. Problem Statement (Lead With This — 30 seconds)

> "In Nepal, when citizens face problems — a pothole on the road, a broken toilet at university, a delay at the passport office — they either fill a paper form that disappears into a drawer, or they shout on social media where no one official is listening. **There is no feedback loop.** Citizens never find out what happened. Officials have no dashboard to track resolution. 60% of people give up before their issue is even acknowledged.
>
> **नागरिक सरोकार** closes that loop. One platform for citizens to report, track, and share — and for administrators to manage, analyze, and resolve."

---

## 2. Live Demo Script — 3 Minutes

### Setup
- Open the app on a projector/large screen in Nepali language
- Have your phone ready with the QR code printed on the table
- Have the admin dashboard open in a separate tab (logged in)

### [0:00-0:30] Citizen submits a complaint (from phone)

| Narrator says | Does |
|---|---|
| *"Let's say I'm a student at Tribhuvan University. The boys' hostel hasn't had water for 3 days."* | Scan QR code → app opens on phone |
| *"I open the app, select Tribhuvan University, category Electricity/Water."* | Tap through org, category |
| *"This is urgent, so I set priority to Critical."* | Selects Critical |
| *"Now here's our secret weapon — I can just speak in Nepali instead of typing."* | **THE WOW MOMENT: Click voice input, speak in Nepali** |
| *"And I can submit it anonymously — no name, no phone, complete privacy."* | Check anonymous, submit |
| *"Done. I get a reference code: TU-0007."* | Shows reference page |

### [0:30-1:00] Track the complaint

| Narrator says | Does |
|---|---|
| *"Now I can track this without logging in. Just enter the code."* | Clicks "Track", types ref code |
| *"See the progress bar — Received, In Progress, Resolved. Full timeline."* | Points to progress steps |
| *"I can even share this on WhatsApp so my friends can check too."* | Clicks WhatsApp share button |

### [1:00-2:00] Admin resolves it

| Narrator says | Does |
|---|---|
| *"Meanwhile, the admin logs in."* | Switches to admin tab |
| *"The dashboard shows 6 key stats, category breakdown, 14-day trend."* | Points to charts |
| *"Here's the SLA monitor — any issue older than 48 hours turns red. Ours was submitted just now."* | Points to SLA badge |
| *"The admin assigns it to the Hostel Warden and changes status to In Progress."* | Assigns → clicks Start Progress |
| *"Later, the warden fixes the pump and marks it Resolved."* | Clicks Resolve |

### [2:00-2:30] Citizen gives feedback

| Narrator says | Does |
|---|---|
| *"Back on the citizen's phone, they get a prompt to rate."* | Shows resolved issue page |
| *"5 stars and a thank-you note. This feedback goes straight to the admin dashboard."* | Submits 5-star rating |

### [2:30-3:00] Switch to Nepali + close

| Narrator says | Does |
|---|---|
| *"Now watch this — one click to switch to Nepali."* | Toggles language → EN/NP |
| *"Everything — navigation, labels, even the charts — in Nepali."* | Scrolls the page |
| *"**नागरिक सरोकोर** — तपाईंको उजुरी, हाम्रो प्रतिबद्धता। Thank you."* | Bows/ends |

---

### Bonus UX Detail: Searchable Dropdowns
When the user selects an organization, the location dropdown is **searchable** — type "hostel" and it filters to matching locations. Same for categories. This matters because native mobile `<select>` with 40+ locations is unusable. Our custom `SearchSelect` component handles filtering, keyboard navigation, and grouped options (parent buildings → sub-locations).

---

## 3. Key Features to Emphasize

During Q&A or if you need to fill time, hit these points:

| Feature | Why it Matters for Nepal |
|---------|--------------------------|
| **No account required** | Many citizens don't have email or don't want to register |
| **Anonymous submission** | Fear of retaliation is real — especially for harassment/government issues |
| **Nepali language + Voice input** | Literacy rates ~67% in Nepal; many are more comfortable speaking |
| **WhatsApp sharing** | WhatsApp has 97%+ smartphone penetration in Nepal |
| **Reference code tracking** | Like a courier tracking number — simple, universal, familiar |
| **SLA monitoring (48h)** | Holds organizations accountable with hard deadlines |
| **Admin dashboard with charts** | Turns complaints into actionable data for decision-makers |
| **Multi-tenant (orgs)** | One platform for universities, municipalities, hospitals, govt departments |

---

## 4. Answering Judge Questions

### "How is this different from a Google Form?"

> "A Google Form is a dead-end. You collect data but there's no tracking, no status updates, no assignment, no SLA monitoring, no feedback loop. This is a **complete case management system** — from submission to resolution to rating. Citizens get a unique tracking code they can check anytime, and admins get a dashboard with analytics. It's the difference between a suggestion box and a help desk."

### "How do you ensure organizations actually respond?"

> "Two mechanisms: **Transparency** — every complaint is timestamped. If it's unresolved after 24 hours, it's flagged as 'Escalated'. After 48 hours, it shows 'SLA Breached' in red on the admin dashboard. **Public accountability** — citizens can share their tracking link on WhatsApp. When a complaint goes viral, the organization has real social pressure to act. Future versions could auto-email the organization head."

### "What about scaling to thousands of complaints?"

> "The architecture is ready. We use MySQL with indexed foreign keys and pagination. The frontend is React with code splitting. To handle 10,000+ orgs, we'd add database indexing, Redis caching for stats, and queue-based notification dispatch. The multi-tenant design (organization_id on every table) means horizontal scaling is straightforward."

### "Who is the target user?"

> "Two sides. **Citizens** — students, patients, residents, anyone dealing with a public service issue. **Administrators** — university admin, municipality officers, hospital management, government department heads. The platform bridges these two groups with a simple, transparent workflow."

---

## 5. Technical Differentiators (for technical judges)

| Aspect | Detail |
|--------|--------|
| **Stack** | Laravel 13 + React 19 + Inertia.js v3 (no API boilerplate) |
| **Bilingual** | React Context-based i18n with 100+ keys in en/np |
| **Auth** | Session-based with custom admin middleware |
| **Voice** | Web Speech API (Chrome/Edge) — no third-party API cost |
| **Charts** | Recharts — 3 chart types (bar, line, pie) on 3 dashboards |
| **Build** | Vite 8, 808KB JS gzip ~232KB, builds in 3 seconds |
| **DB** | 5 models, 7 migrations, Nepal-specific seed data |

---

## 6. Deployment Options (before presentation)

### Option A: Local network (quickest)
```bash
# Find your local IP
hostname -I
# Start the server
php artisan serve --host=0.0.0.0 --port=8000
```
Then access from any phone on the same WiFi at `http://YOUR_IP:8000`. Update the QR code at `public/qr-demo.png` to point to this URL.

### Option B: ngrok (public URL, 5 min setup)
```bash
# 1. Sign up at https://dashboard.ngrok.com/signup
# 2. Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken
# 3. Run:
ngrok config add-authtoken YOUR_TOKEN
php artisan serve --port=8000 &
ngrok http 8000
# 4. Copy the https://xxxx.ngrok-free.app URL
# 5. Regenerate QR code pointing to that URL
```

### Option C: Railway / Render (always-on)
Push the repo to GitHub, connect to Railway.app or Render.com, set build command to `composer install --no-dev && npm run build && php artisan migrate --force`, start command to `php artisan serve --host=0.0.0.0 --port=$PORT`.

---

## 7. Deployment Status

The app is currently live at a temporary URL for demo purposes. For permanent always-on deployment (even after laptop is shut down), see `DEPLOY.md`.

**Current demo URL:** `https://copy-dawn-forests-projects.trycloudflare.com` (temporary — dies on shutdown)

**Permanent deployment options:** Railway (free, always-on) or Render (free, sleeps on inactivity). Both deploy from GitHub in under 3 minutes.

---

## 8. Print-Ready QR Code

File: **`public/qr-print.html`**

Open this file in a browser and print it. Place the printout next to your demo station so judges and attendees can scan with their phones and instantly submit a complaint. This interactive element is worth bonus points.

To update the QR code URL after deployment:
```bash
python3 -c "
import qrcode
img = qrcode.make('https://YOUR_DEPLOYED_URL')
img.save('public/qr-demo.png')
"
```

---

*Good luck! 🏆 नागरिक सरोकार — तपाईंको उजुरी, हाम्रो प्रतिबद्धता।*
