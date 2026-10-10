# Navratri Event Ticketing & Manual Dispatch Dashboard 🪔

A full-stack **Next.js 14/15/16** application built to manage student event registrations from a Google Sheet, dynamically generate personalized digital entry passes as images using `@vercel/og`, and manually dispatch passes to students via WhatsApp Web with 1-click.

---

## 🌟 Tech Stack

* **Framework:** Next.js 14/15/16 (App Router)
* **Styling:** Tailwind CSS (Modern Festive UI theme with Dark Mode & Glassmorphism)
* **Dynamic Pass Generation:** `@vercel/og` (`ImageResponse` with Satori SVG layout engine)
* **Database / Backend:** Google Sheets API (`googleapis`)
* **QR Code:** `qrcode` (Base64 encoding)
* **Icons:** `lucide-react`

---

## 🚀 Features

1. **Google Sheets Sync (`lib/googleSheets.ts`)**:
   - Reads form responses directly from Google Sheets using a Google Cloud Service Account.
   - Updates row status (`Pass_Generated` and `Status`).
   - Includes automatic mock fallback mode for local development without credentials.

2. **Dynamic 500x800 Pass Generator (`/api/pass`)**:
   - Generates a custom 500x800px digital pass image on the fly.
   - Features festive warm background, Dandiya celebration artwork, student name & USN, and gate scanning QR code.

3. **Admin Dashboard (`/admin`)**:
   - Live metrics (Total Registrations, Passes Generated, WA Dispatched, Pending).
   - Real-time search by Name, USN, or WhatsApp Number.
   - Action buttons per row:
     - 🎟️ **Generate Pass:** Creates QR code and marks pass as generated.
     - 💬 **Send via WhatsApp:** Opens WhatsApp Web with custom pre-filled message and direct pass image link.
     - ✅ **Mark as Sent:** Updates Google Sheet row status to "Sent".
   - Live Pass Preview modal with download capability.

---

## 📋 Google Sheet Schema

Ensure your Google Sheet contains the following 6 columns in row 1:

| Column | Name | Type | Description |
|---|---|---|---|
| **A** | `Timestamp` | String | Form submission timestamp |
| **B** | `Name` | String | Student full name |
| **C** | `USN` | String | Student USN / Roll Number |
| **D** | `WhatsApp_Number` | String | Phone number with country code (e.g. `9876543210`) |
| **E** | `Pass_Generated` | Text / Boolean | Marked as `Yes` when pass is generated |
| **F** | `Status` | Text | `Pending` or `Sent` |

---

## 🔑 Google Service Account Setup Guide

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `Navratri-Pass-Manager`).
3. Navigate to **APIs & Services > Library** and enable **Google Sheets API**.
4. Navigate to **APIs & Services > Credentials** and click **Create Credentials > Service Account**.
5. Give the service account a name and click **Create**.
6. Under the **Keys** tab of the service account, click **Add Key > Create New Key** (JSON format). Download the JSON key file.
7. Open your Google Sheet, click **Share**, and paste the Service Account Email (`client_email` from the JSON key file) with **Editor** permissions.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the environment variables in `.env.local`:

```env
# Service Account Email from Google Cloud Console JSON key
GOOGLE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com

# Service Account Private Key from Google Cloud Console JSON key
# Note: Keep the quotes and format escaped newlines (\n)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# The ID from your Google Sheet URL (https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit)
GOOGLE_SHEET_ID=your_google_sheet_id_here

# Application Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🛠️ Development & Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser. You will be redirected to `/admin` dashboard.

---

## 🧪 Testing the API Routes Directly

* **Pass Generator Endpoint:**
  ```http
  GET /api/pass?name=Aarav%20Sharma&usn=1RV21CS001
  ```
  Generates and returns the PNG image pass.

* **Students List API:**
  ```http
  GET /api/students
  ```

* **Update Student Status API:**
  ```http
  POST /api/students/update
  Content-Type: application/json

  {
    "rowIndex": 2,
    "passGenerated": "Yes",
    "status": "Sent"
  }
  ```
