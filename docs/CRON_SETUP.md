# Cron setup — cron-job.org

StreakFlow uses cron-job.org (free, no CC) to fire scheduled HTTP endpoints
from a 24/7 reliable cron. Netlify scheduled functions weren't an option
because Netlify env vars don't reach standalone functions deployed via CLI.

## Endpoints

| Path | Method | Schedule | Purpose |
|---|---|---|---|
| `/api/cron/keepalive?key=<CRON_SECRET>` | GET | every 3 days @ 03:00 UTC | Pings Supabase REST so the free tier doesn't pause after 7 days inactivity |
| `/api/cron/insights?key=<CRON_SECRET>` | POST | Monday 06:00 UTC | Auto-generates weekly AI insights for active users |
| `/api/cron/reminders?key=<CRON_SECRET>` | POST | every hour at :00 | Web push reminders for habits due in next hour |

## Manual setup (5 min)

1. https://console.cron-job.org → sign up (no CC)
2. **Cronjobs → Create cronjob**
3. **Title:** `streakflow-keepalive`
   **URL:** `https://streakflow-app.netlify.app/api/cron/keepalive?key=PASTE_CRON_SECRET`
   **Schedule:** every 3 days, hour 3, minute 0
   **HTTP method:** GET
4. Save. cron-job.org will fire the URL on schedule.

Repeat for `insights` and `reminders` once those endpoints are live.

## Programmatic setup via cron-job.org API

```bash
KEY=<your cron-job.org API key, from Settings → API>

curl -X PUT https://api.cron-job.org/jobs \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "job": {
      "url": "https://streakflow-app.netlify.app/api/cron/keepalive?key=PASTE_CRON_SECRET",
      "enabled": true,
      "requestMethod": 0,
      "schedule": {
        "timezone": "UTC",
        "hours": [3],
        "mdays": [-1],
        "minutes": [0],
        "months": [-1],
        "wdays": [-1]
      }
    }
  }'
```

`mdays: [-1]` = every day; combined with `hours: [3]` = once per day at 3 AM
UTC. Adjust to every 3 days by setting `mdays: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28]`.

## CRON_SECRET

Stored in Netlify env (all contexts). Get current value:

```bash
netlify env:get CRON_SECRET
```

Rotate: generate new value, set, redeploy with `--skip-functions-cache`.
Update cron-job.org URLs.
