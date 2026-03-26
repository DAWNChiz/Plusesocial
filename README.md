# ⚡ Pulse — Setup Guide

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In your project, go to **SQL Editor** and paste + run the contents of `supabase_schema.sql`
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key

## 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Run Locally

```bash
npm install
npm run dev
```

## 4. Deploy to Vercel

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. In Vercel project settings → **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy ✅

## Features
- Real-time messaging (Supabase Realtime)
- Friend requests & social graph
- Online presence / heartbeat
- Typing indicators
- Image & file sharing
- Profile editing
- Persistent auth (session restore)
