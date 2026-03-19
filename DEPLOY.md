# NeuralVisions — Deployment Guide

## 1. Create Supabase Project

1. Go to https://supabase.com and create a new project.
2. In the SQL editor, run the migration SQL from `supabase/migrations/` to create all required tables (`projects`, `clips`, `publish_queue`, etc.).

## 2. Enable Google OAuth

1. In your Supabase project go to **Authentication → Providers → Google**.
2. Enable Google, then add your Google OAuth Client ID and Secret (from https://console.cloud.google.com).
3. Add your redirect URL: `https://<your-vercel-domain>/auth/callback`

## 3. Create Storage Bucket

1. In Supabase go to **Storage → New bucket**.
2. Name it `voiceovers` and set it to **public**.

## 4. Fill in Environment Variables

Copy `.env.example` to `.env.local` and fill in every value. See the comments in `.env.example` for where to obtain each key.

## 5. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 6. Connect to Vercel

1. Go to https://vercel.com/new and import your GitHub repository.
2. In **Settings → Environment Variables**, add every key from `.env.example` with its real value.

## 7. Deploy

Click **Deploy**. Vercel will build and deploy the app automatically. Subsequent pushes to `main` trigger automatic redeployments.
