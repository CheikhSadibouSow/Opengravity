# 🚀 OpenGravity Deployment Guide

Your agent is now ready to be deployed on **Render** (Free Tier).

## 1. Prerequisites
- Create an account on [Render](https://render.com).
- Connect your GitHub account and select the `opengravity` repository.

## 2. Setting up the Web Service on Render
- **Service Type**: Web Service.
- **Runtime**: Node.js.
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Port**: 8080 (already configured in `src/index.ts`).

## 3. Environment Variables (Required)
Go to the **Environment** tab in Render and add the following keys from your `.env`:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ALLOWED_USER_IDS`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY` (if used)
- `FIREBASE_SERVICE_ACCOUNT_JSON` -> **Copy-paste the entire content of your `service-account.json` here.**
- `GMAIL_USER` -> Votre adresse Gmail personnelle (ex: `nom@gmail.com`).
- `GMAIL_APP_PASSWORD` -> Le code de 16 caractères généré chez Google.

## 4. Keeping it alive (Free Tier)
Since the Render free tier sleeps after 15 mins of inactivity, use a free service like [cron-job.org](https://cron-job.org) to ping your Render URL `https://your-app-name.onrender.com` every 10 minutes.

---
✅ Your code has been pushed to GitHub.
✅ GitHub and Firebase connections are active.
✅ Deployment server (Health Check) is integrated into `src/index.ts`.
