# Deploy GridironZero to the Cloud

The app is set up to run as a **single service** (frontend + API) so you can deploy it to any cloud that runs Docker or Node.

---

## Option 1: Render.com (recommended, free tier)

1. **Push your code to GitHub** (if you haven’t already).
2. Go to [render.com](https://render.com) and sign in.
3. Click **New** → **Blueprint**.
4. Connect your GitHub account and select the **GridironZero** repo.
5. Render will detect `render.yaml`. Confirm the service and click **Apply**.
6. Wait for the build to finish. You’ll get a URL like `https://gridironzero.onrender.com`.

**Note:** On the free tier, the app may sleep after ~15 minutes of no traffic. The first request after that can take 30–60 seconds to wake. Data (players, plays, workspace) is stored on the instance; it can reset on redeploy. For permanent storage, use a database or a [Render persistent disk](https://render.com/docs/disks).

---

## Option 2: Deploy with Docker locally (test production build)

```bash
# From the repo root
docker build -t gridironzero .
docker run -p 4000:4000 gridironzero
```

Then open **http://localhost:4000**. The same image can be pushed to any Docker host (e.g. Fly.io, Railway, AWS ECS).

---

## Option 3: Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → choose GridironZero.
3. Railway will try to auto-detect. If it doesn’t use Docker:
   - In **Settings**, set **Root Directory** to the repo root.
   - Set **Build Command** to: `docker build -t gridironzero .` (or use “Dockerfile” as builder).
   - Set **Start Command** to: `docker run -p $PORT:4000 gridironzero`  
   Or add a **Dockerfile** and use **Deploy from Dockerfile**.
4. In **Settings** → **Variables**, add `PORT=4000` (Railway often supplies PORT).
5. Deploy; use the generated URL.

---

## How it works

- **Production build:** The root `Dockerfile` builds the frontend (Vite), then the backend (Node). The backend serves the built frontend from `/` and the API from `/api/v1/*`.
- **Single URL:** Everything is on one origin (e.g. `https://yourapp.onrender.com`), so no CORS or API URL config is needed.
- **Data:** Players, plays, and workspace are stored in JSON files under `backend/data/`. On free/ephemeral hosts this can be lost on restart/redeploy; for long-term data, plug in a database later.
