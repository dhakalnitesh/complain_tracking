# नागरिक सरोकार (Nagarik Sarokar) — User Manual

> **Nepal's Citizen Complaint Management System** — A bilingual (English/Nepali) platform for citizens to submit, track, and share complaints about public services.

---

## Table of Contents

1. [What is Nagarik Sarokar?](#1-what-is-nagarik-sarokar)
2. [Demo Credentials](#2-demo-credentials)
3. [For Citizens — How to Use the Platform](#3-for-citizens--how-to-use-the-platform)
   - [3.1 Submit a Complaint](#31-submit-a-complaint)
   - [3.2 Track a Complaint](#32-track-a-complaint)
   - [3.3 Share a Complaint](#33-share-a-complaint)
   - [3.4 Give Feedback / Rate](#34-give-feedback--rate)
   - [3.5 Voice Input (Speech-to-Text)](#35-voice-input-speech-to-text)
   - [3.6 Language Toggle](#36-language-toggle)
4. [For Admins — How to Manage the Platform](#4-for-admins--how-to-manage-the-platform)
   - [4.1 Admin Dashboard](#41-admin-dashboard)
   - [4.2 Issue Status Management](#42-issue-status-management)
   - [4.3 Assign Issues](#43-assign-issues)
   - [4.4 Organizations Management](#44-organizations-management)
5. [Pages Overview](#5-pages-overview)
   - [5.1 Home / Dashboard](#51-home--dashboard)
   - [5.2 Submit a Complaint](#52-submit-a-complaint)
   - [5.3 Track Status](#53-track-status)
   - [5.4 Reference / Success Page](#54-reference--success-page)
   - [5.5 Login & Register](#55-login--register)
   - [5.6 Organization Dashboard](#56-organization-dashboard)
   - [5.7 Admin Dashboard](#57-admin-dashboard)
   - [5.8 Admin Organizations](#58-admin-organizations)
6. [Troubleshooting](#6-troubleshooting)
7. [Technical Notes](#7-technical-notes)

---

## 1. What is Nagarik Sarokar?

**नागरिक सरोकार** (Citizen Concern) is a web-based platform that lets Nepali citizens report issues related to public services and track their resolution in real-time. It acts as a bridge between citizens and the organizations serving them.

Key features:
- **Submit complaints** anonymously or with contact details
- **Track by reference code** — no account required to check status
- **Voice input** for users who prefer speaking over typing
- **Full Nepali language support** — toggle between English and Nepali
- **Activity timeline** — see every status change and action taken
- **Share via WhatsApp** — share your complaint reference with friends/family
- **Rate & give feedback** after resolution
- **Admin dashboard** with statistics, charts, and full issue management
- **Per-organization dashboards** with location-wise breakdown

---

## 2. Demo Credentials

| Role | Email | Password | Note |
|------|-------|----------|------|
| **Super Admin** | `admin@nagariksarokar.com` | `admin123` | Full access to all admin features |
| **Org Admin (TU)** | `tu@nagariksarokar.com` | `password` | Can view Tribhuvan University dashboard |

---

## 3. For Citizens — How to Use the Platform

You do NOT need to create an account to submit or track a complaint.

### 3.1 Submit a Complaint

1. Go to the home page and click **"Submit a Complaint"** (or the red SOS button for urgent issues).
2. Select the **organization** the complaint is about (e.g., Tribhuvan University, Kathmandu Metropolitan City).
3. Select a **category** that best describes your issue (e.g., Canteen/Food, Toilet/Sanitation, Electricity/Water).
4. Set a **priority** (Low, Medium, High, Critical).
5. Select a **location** within the organization (filtered automatically based on the organization selected).
6. Describe your issue in detail (minimum 10 characters). You can use the **Voice Input** button to speak instead of typing.
7. Optionally upload a **photo**.
8. Fill in your **name, phone, or email** (optional). Check **"Submit Anonymously"** to keep your identity private.
9. Click **"Submit Complaint"**.

After submission, you will receive a **reference code** like `TU-0001`. Save this code or share it — you'll need it to track your complaint.

### 3.2 Track a Complaint

1. Go to the **"Track Complaint"** page.
2. Enter your **reference code** (e.g., `TU-0001`).
3. View:
   - Current status (Received → In Progress → Resolved)
   - Organization, category, location, priority
   - Description and any attached photo
   - Who it's assigned to
   - Full activity timeline
   - When it was resolved

### 3.3 Share a Complaint

On the Reference/Success page or the Track Status page, click **WhatsApp** to share your complaint reference through WhatsApp. You can also **Copy** the code to share via SMS or other apps.

### 3.4 Give Feedback / Rate

After your complaint is marked **Resolved**, you can:
1. Go to your complaint's reference page.
2. Rate it from 1 to 5 stars.
3. Leave a comment.
4. Click **Submit Feedback**.

You can only submit feedback once per complaint.

### 3.5 Voice Input (Speech-to-Text)

Click the 🎤 microphone icon next to the description field to use voice input. Speak in Nepali or English — your speech will be converted to text and added to the description. Works best in Chrome, Edge, and Samsung Internet browsers.

### 3.6 Language Toggle

Click the **EN/NP** button on the top navigation bar to switch between English and Nepali. Your preference is saved and remembered on your next visit.

---

## 4. For Admins — How to Manage the Platform

### 4.1 Admin Dashboard

Log in at `/admin/login` using the super admin credentials. The dashboard shows:

- **6 stat cards**: Total issues, Open, Resolved, Escalated, Organizations, Avg Resolution Time
- **Category bar chart**: Issues grouped by category
- **14-day trend line chart**: Daily issue volume
- **All issues table**: Searchable, filterable by status

### 4.2 Issue Status Management

In the issues table, each unresolved issue has:
- **"Start Progress"** button — moves from Received → In Progress
- **"Resolve"** button — marks as Resolved
- **"Reopen"** button — reopens a resolved issue back to Received

SLA Breach (red background) = issue unresolved after 48 hours.
Escalated (orange) = issue unresolved after 24 hours.

### 4.3 Assign Issues

Click **"Assign"** on any issue, type the name of the person/department, and click OK. The assignee will appear in the tracking page for citizens.

### 4.4 Organizations Management

Go to **Organizations** from the admin dashboard to:
- View all organizations with issue/user counts
- **Add** new organizations (name, type, address, contact details)
- **Activate/Deactivate** organizations
- When you create an organization, 4 default locations are automatically added

---

## 5. Pages Overview

### 5.1 Home / Dashboard

**URL:** `/`

The citizen-facing landing page with:
- Hero section with call-to-action buttons
- 4 stat cards: Total Issues, Open, Resolved Today, Avg Resolution Time
- Organization grid showing all active organizations with open issue counts
- Category bar chart
- 7-day trend line chart
- Recent issues list
- Red SOS button (mobile) for submitting urgent/critical issues
- Trust bar in footer: Anonymous, Encrypted, Real-time Tracking, No Retaliation

### 5.2 Submit a Complaint

**URL:** `/submit`

A progressive form with trust banner, organization selector, category, priority, location (filtered by org), description with voice input, photo upload, personal info section, and anonymous toggle.

### 5.3 Track Status

**URL:** `/status`

Enter a reference code to look up an issue. Shows full details, progress steps, timeline, share buttons, and feedback prompt if resolved.

### 5.4 Reference / Success Page

**URL:** `/issues/reference/{code}`

After submitting a complaint, you land here. Shows:
- Success confirmation with reference code
- Issue details summary
- Dashboard + Track buttons
- WhatsApp/copy share buttons
- Progress timeline
- Feedback form (if resolved)

### 5.5 Login & Register

**URL:** `/login`, `/register`

Account creation for organization admins. Optional organization selection during registration. Regular citizens don't need an account.

### 5.6 Organization Dashboard

**URL:** `/org/{slug}` (e.g., `/org/kathmandu-metropolitan`)

Per-organization public dashboard showing:
- Organization name/logo/address
- 4 stat cards: Total, Open, Resolved Today, Escalated
- Category bar chart
- Priority pie chart
- Location tiles with color-coded issue counts
- Recent issues list

### 5.7 Admin Dashboard

**URL:** `/admin/dashboard`

Full management interface with:
- 6 stat cards, category/trend charts
- Searchable, filterable issues table
- SLA breach and escalation indicators
- Status transition buttons and assignment

### 5.8 Admin Organizations

**URL:** `/admin/organizations`

CRUD table for managing organizations. Create new organizations with type, address, and contact details. Activate/deactivate organizations.

---

## 6. Troubleshooting

| Problem | Solution |
|---------|----------|
| **Reference code not found** | Check the code is correct. It typically follows the format `XXX-0001` (e.g., `TU-0001`). Codes are case-insensitive. |
| **Voice input not working** | Only works in Chrome, Edge, and Samsung Internet. Not supported in Firefox, Safari, or Brave. Ensure microphone permission is granted. |
| **Photo upload too large** | Maximum file size is 5 MB. Use a smaller image or compress before uploading. |
| **Login fails** | Ensure you are using the correct URL (`/admin/login` for admin, `/login` for regular users). Session may have expired — try again. |
| **Page shows white screen** | Clear your browser cache and reload. The app uses Vite with code splitting — a cache-busting reload usually fixes this. |
| **Language not changing** | The toggle only affects page content, not browser UI. If some text remains in English, the translation key may not exist yet. |
| **Form submission rate limit** | You can submit a maximum of 3 complaints per minute. Wait a moment before trying again. |

---

## 7. Technical Notes

- **Stack:** Laravel 13 (PHP 8.3), React 19, Inertia.js v3, Tailwind CSS v4, MySQL, Recharts
- **Authentication:** Session-based with admin middleware
- **Multi-tenancy:** Single database with `organization_id` foreign key
- **SLA:** 48-hour resolution deadline; escalation flag at 24 hours
- **Image storage:** Local `public/storage/issue-photos/` directory
- **Language:** React Context-based with English (en) and Nepali (np) translation files

---

*Built with ❤️ for the people of Nepal. नागरिक सरोकार — तपाईंको उजुरी, हाम्रो प्रतिबद्धता।*
