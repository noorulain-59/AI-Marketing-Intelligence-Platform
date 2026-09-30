# AI Marketing Intelligence Platform

A full-stack web app where a business can manage marketing campaigns and get
AI-powered analytics: ROI/CTR/CPC/CPA dashboards, campaign CRUD, performance
analysis, customer/campaign segmentation, recommendations, ad copy
suggestions, and performance forecasting — plus a role-based admin panel.

**Stack:** HTML/CSS/JavaScript (frontend) → REST API → Node.js + Express →
MongoDB (via Mongoose) → a custom statistical "AI" analytics engine.

---

## 1. What you need to install

You only need **one thing installed locally**: **Node.js** (which includes npm).

1. Download Node.js LTS from https://nodejs.org (pick the LTS version).
2. Install it, then confirm in a terminal:
   ```
   node -v
   npm -v
   ```
   You should see version numbers (Node 18+ is fine).

### Database — pick ONE option, no local install required for Option A

**Option A — MongoDB Atlas (recommended, free, nothing to install):**
1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a free "M0" cluster (takes ~2 minutes).
3. Under **Database Access**, create a database user (username + password).
4. Under **Network Access**, add IP `0.0.0.0/0` (allow from anywhere) — fine for a student project.
5. Click **Connect → Drivers**, copy the connection string. It looks like:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`
6. You'll paste this into `.env` in step 3 below (add `/marketing_platform` at the end as the database name).

**Option B — Local MongoDB (if you prefer everything offline):**
1. Install MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Start the `mongod` service (the installer usually does this for you).
3. Use `mongodb://127.0.0.1:27017/marketing_platform` as your connection string.

---

## 2. Project structure

```
ai-marketing-platform/
├── backend/
│   ├── config/db.js            # MongoDB connection
│   ├── models/                 # User.js, Campaign.js (Mongoose schemas)
│   ├── controllers/            # request handlers (auth, campaigns, ai, dashboard, users)
│   ├── routes/                 # Express route definitions
│   ├── middleware/auth.js      # JWT auth + role guard
│   ├── services/aiService.js   # the AI/analytics engine (see section 5)
│   ├── data/seed.js            # optional: loads demo data
│   ├── server.js               # app entry point
│   ├── package.json
│   └── .env.example            # copy to .env and fill in
└── frontend/
    ├── index.html               # login
    ├── register.html            # sign up
    ├── dashboard.html           # KPI dashboard + charts
    ├── campaigns.html           # campaign CRUD
    ├── ai-insights.html         # AI module UI
    ├── admin.html                # admin-only user management
    ├── css/style.css
    └── js/ (api.js, shell.js)
```

The backend also **serves the frontend** as static files, so in production
you only need to run one server (no separate frontend build step, no CORS
headaches) — see `server.js`.

---

## 3. Step-by-step setup

**Step 1 — Open the project folder and install backend dependencies:**
```bash
cd ai-marketing-platform/backend
npm install
```
This downloads Express, Mongoose, JWT, bcrypt, etc. into `node_modules/`.

**Step 2 — Configure your environment:**
```bash
cp .env.example .env
```
Open `.env` in any text editor and set:
- `MONGO_URI` → your Atlas connection string (Option A) or the local one (Option B)
- `JWT_SECRET` → any long random string (e.g. mash your keyboard for 40 characters)

**Step 3 — (Optional but recommended) Seed demo data:**
```bash
npm run seed
```
This creates a demo admin account and 6 realistic sample campaigns so the
dashboard and AI Insights pages aren't empty on first run.
```
Login → email: admin@demo.com   password: admin123
```

**Step 4 — Start the server:**
```bash
npm start
```
You should see:
```
MongoDB connected: cluster0-shard-... /marketing_platform
Server running on http://localhost:5000
```

**Step 5 — Open the app:**
Go to `http://localhost:5000` in your browser. You'll land on the login
page. Log in with the seeded demo account, or click "Create one" to
register your own (the **first** account created on a fresh database
automatically becomes the admin).

**Step 6 (optional) — Auto-restart on file changes while developing:**
```bash
npm run dev
```
(uses `nodemon`, already in `devDependencies`)

---

## 4. How the pieces fit together

- **Dashboard** (`/dashboard.html`) → calls `GET /api/dashboard` → aggregates
  every campaign you own (or, if admin, everyone's) into total spend,
  revenue, ROI, CTR, CPC, CPA, conversion rate, best/worst campaign, and a
  per-channel spend-vs-revenue chart (Chart.js).
- **Campaigns** (`/campaigns.html`) → full CRUD against `/api/campaigns`.
  ROI/CTR/CPC/CPA/conversion rate are **never stored** — they're derived
  live from budget/spend/revenue/impressions/clicks/conversions in
  `Campaign.js`'s `metrics()` method, so they can never go stale.
- **AI Insights** (`/ai-insights.html`) → calls the five `/api/ai/*`
  endpoints described below.
- **Admin Panel** (`/admin.html`, admin role only) → list/promote/demote/
  delete users via `/api/users`.
- **Auth** → JWT-based. Token is stored in `localStorage` and sent as
  `Authorization: Bearer <token>` on every request (see `frontend/js/api.js`).
  Managers only see their own campaigns; admins see all campaigns.

---

## 5. The AI module — what it actually does (and how to extend it)

Everything lives in `backend/services/aiService.js`, fully commented. It's
a **transparent statistical/rule-based engine**, not a black box — good for
a marketing tool because you can explain every output, and good for you
because it needs zero external API keys or GPU to run:

| Feature | Technique |
|---|---|
| Campaign performance analysis | Z-score outlier detection over ROI across your campaigns |
| Customer/campaign segmentation | RFM-inspired tertile scoring (Frequency/Monetary/Spend) → segment labels |
| Recommendations | Rule-based thresholds on ROI, CTR, conversion rate, CPA, budget pacing |
| Ad copy suggestions | Template + rule-driven headline/body/CTA generation by objective + channel |
| Performance prediction | Linear pace-based forecasting to the campaign's end date |

**Want real generative AI (LLM-written ad copy)?** `generateAdCopy()` in
`aiService.js` is written so you can swap its body for a call to the
Anthropic API (or OpenAI) — pass the campaign's objective/audience/channel
as the prompt instead of picking from templates. You'd add your API key to
`.env` (there's already a commented placeholder for `ANTHROPIC_API_KEY`)
and call it from `aiController.js`'s `adCopy` handler. Everything else
(auth, data model, routes) stays exactly the same.

---

## 6. Deploying it for your portfolio

Since you already use Railway for deployment:
1. Push this repo to GitHub (the `.gitignore` already excludes `node_modules/` and `.env`).
2. Create a new Railway project from the GitHub repo, root directory `backend/`.
3. Add the same environment variables from your `.env` (`MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`) in Railway's dashboard.
4. Railway will run `npm install` then `npm start` automatically.
5. Use MongoDB Atlas (Option A above) as your database — it's already cloud-hosted so it works from Railway with no extra setup.

---

## 7. API reference (quick)

```
POST   /api/auth/register        { name, email, password }
POST   /api/auth/login           { email, password }
GET    /api/auth/me              (auth required)

GET    /api/campaigns            ?status=&channel=&search=
POST   /api/campaigns
GET    /api/campaigns/:id
PUT    /api/campaigns/:id
DELETE /api/campaigns/:id

GET    /api/dashboard

GET    /api/ai/performance
GET    /api/ai/segmentation
GET    /api/ai/recommendations/:campaignId
GET    /api/ai/ad-copy/:campaignId
GET    /api/ai/forecast/:campaignId

GET    /api/users                (admin only)
PUT    /api/users/:id/role       (admin only)
DELETE /api/users/:id            (admin only)
```

All routes except `/api/auth/register` and `/api/auth/login` require
`Authorization: Bearer <token>`.
