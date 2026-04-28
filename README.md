# Villa Lagonisi — Deployment Guide

## Project Structure
```
villa-lagonisi/
├── api/
│   └── availability.js   ← Serverless function (keeps iCal URL secret)
├── public/
│   ├── index.html         ← Exterior gallery
│   ├── interior.html      ← Interior gallery
│   ├── booknow.html       ← Booking page with calendar
│   └── VILLALAGO/         ← Your image folders (copy these in)
│       └── ...
│   └── ΕΣΩΤΕΡΙΚΟΣ ΧΩΡΟΣ/
│       └── ...
│   └── VL.mp4             ← Logo video
├── vercel.json
├── package.json
└── .env.example
```

## Deploy to Vercel (free, ~5 minutes)

### Step 1 — Push to GitHub
1. Create a free account at github.com
2. Create a new repository called `villa-lagonisi`
3. Upload all these files (drag & drop in the GitHub UI)
4. Make sure your image folders (VILLALAGO/, ΕΣΩΤΕΡΙΚΟΣ ΧΩΡΟΣ/, VL.mp4) are inside `public/`

### Step 2 — Connect to Vercel
1. Go to vercel.com → Sign up free with your GitHub account
2. Click "Add New Project" → Import your `villa-lagonisi` repo
3. Click Deploy (no changes needed — vercel.json handles everything)

### Step 3 — Add your iCal URL (SECRET — never in code)
1. In Vercel dashboard → your project → Settings → Environment Variables
2. Add:
   - Name:  `ICAL_URL`
   - Value: your Booking.com iCal URL
   - (paste the full https://admin.booking.com/... URL)
3. Click Save → then go to Deployments → Redeploy

### Getting your Booking.com iCal URL
Booking.com Extranet → Calendar → Sync Calendar → Copy iCal link
It looks like: https://admin.booking.com/hotel/hoteladmin/ical.html?t=XXXX

### Done!
Vercel gives you a free URL like `villa-lagonisi.vercel.app`
You can also connect a custom domain (villalagonisi.gr) for free in Settings → Domains.

## How the calendar sync works
- When a visitor opens booknow.html, the page calls `/api/availability`
- The serverless function fetches your Booking.com iCal on the server (URL never exposed)
- It returns booked date ranges as JSON
- The calendar renders blocked dates automatically
- Vercel caches the result for 1 hour (fast + avoids hammering Booking.com)
- The "↻ Ανανέωση" button lets you force-refresh anytime
