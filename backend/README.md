# GridironZero Backend (prototype)

This is a minimal Node/TypeScript prototype for the GridironZero analysis API.

Quick start (local development):

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Install deps:

```bash
cd backend
npm install
```

3. Run dev server:

```bash
npm run dev
```

The server exposes `POST /api/v1/analyze` which accepts a JSON body with `field_state` and `play_instances` and returns scored results.

Seed the sample NFL player dataset (requires a running Postgres and Prisma migrations applied):

```bash
# ensure DATABASE_URL is set in .env
cd backend
npm run seed
```

Docker (local)
----------------
Run Postgres + API using `docker-compose` (builds image, runs DB and API):

```bash
cd backend
docker-compose up --build
```

Seed and run tests inside the `api` container (executes `npm` scripts in the built image):

```bash
# seed (will run the `seed` script inside the api service)
docker-compose run --rm api npm run seed

# run tests (build + test-runner)
docker-compose run --rm api npm run test
```

Notes:
- The Docker image installs devDependencies and runs `npm run build` during image build so tests and TypeScript compilation work inside the container.
- If you prefer to run the API in development mode with live reload, run `npm run dev` inside the container instead of the default command.

Frontend via docker-compose
---------------------------
`docker-compose up --build` will now also build and start the frontend Vite dev server and expose it on port `5173`.

Open the frontend at: `http://localhost:5173` (it proxies API requests directly to the API service defined in compose).

Root docker-compose
--------------------
You can now run the entire stack from the repository root using the added `docker-compose.yml`:

```powershell
cd <repo-root>
docker-compose up --build
```

This will build and start `db`, `api`, and `frontend` services.

Production deploy
-----------------
To build and run production images locally (backend built with Node and frontend served as static files via nginx):

```powershell
# from repo root
docker compose -f docker-compose.prod.yml up --build -d

# frontend available at http://localhost (port 80)
# api available at http://localhost:4000
```

To stop and remove volumes:

```powershell
docker compose -f docker-compose.prod.yml down -v
```

