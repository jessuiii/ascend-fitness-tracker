# 🏋️ Ascend — AI-Powered Fitness Tracker

A modern, full-stack fitness tracking application built with Next.js, Supabase, and Google Gemini AI. Track your workouts, monitor strength progression, and get personalized AI coaching — all in one place.

---

## ✨ Features

- **Personalized Dashboard** — Welcome greeting with your username, weekly calendar strip, and today's scheduled workout session
- **Workout Scheduling** — Assign workout splits (Push/Pull/Legs, Upper/Lower, Bro Split, Full Body, or Custom) to each day of the week
- **Active Workout Tracker** — Log sets, reps, and weight in real time with a clean, distraction-free UI
- **Strength Progression** — Track estimated 1RMs, calculate strength scores, and unlock tiers as you improve
- **AI Coach (Gemini)** — Chat with an AI coach powered by Google Gemini for personalized advice
- **Custom Routines** — Build your own workout splits and exercises tailored to your needs
- **Stats & Analytics** — View your strength history and BMI calculations over time
- **Onboarding Flow** — Guided setup for height, weight, fitness path, and workout preferences
- **Auth & Profiles** — Secure authentication via Supabase with password reset support

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Database & Auth | [Supabase](https://supabase.com) (PostgreSQL + Auth) |
| AI | [Google Gemini](https://ai.google.dev) |
| Styling | Vanilla CSS with CSS custom properties |
| Language | TypeScript |
| Deployment | [Vercel](https://vercel.com) |

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/ascend-fitness-tracker.git
cd ascend-fitness-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Site URL (used for password reset redirect links)
# Set to your production URL e.g. https://your-app.vercel.app
# Leave blank in local dev (falls back to localhost automatically)
NEXT_PUBLIC_SITE_URL=

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Configure Supabase

In your [Supabase Dashboard](https://supabase.com) → **Authentication → URL Configuration**:
- Set **Site URL** to your production URL (e.g. `https://your-app.vercel.app`)
- Add your production URL to **Redirect URLs**: `https://your-app.vercel.app/**`

> For local dev, add `http://localhost:3000/**` to Redirect URLs.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── dashboard/        # Main dashboard with welcome greeting & weekly view
│   ├── active-workout/   # Real-time workout logging
│   ├── workout/          # Workout schedule configuration
│   ├── stats/            # Strength stats & analytics
│   ├── chat/             # AI coach chat interface
│   ├── settings/         # User settings
│   ├── login/            # Authentication
│   ├── signup/           # Registration
│   ├── forgot-password/  # Password reset request
│   ├── reset-password/   # Password reset confirmation
│   └── onboarding/       # New user setup flow
├── components/           # Reusable UI components (Navbar, TierCard, etc.)
├── lib/                  # Utilities (supabase, gemini, schedule, strength, etc.)
└── types/                # TypeScript type definitions
```

---

## 🌐 Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import the repo on [Vercel](https://vercel.com)
3. Add your environment variables in the Vercel project settings
4. Set `NEXT_PUBLIC_SITE_URL` to your Vercel deployment URL
5. Update the Site URL in your Supabase dashboard to match

---

## 📄 License

MIT
