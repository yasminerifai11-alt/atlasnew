# Atlas Command — AI Planetary Decision Intelligence

> منصة الذكاء الاستراتيجي للقرار الكوني

Atlas Command monitors global signals across conflict, energy, infrastructure, financial markets, maritime, aviation, and cyber — synthesizes them into decision-grade intelligence, and tells leaders what is happening, why it matters, what comes next, and exactly what to do.

## Architecture

```
atlas-command/
├── apps/
│   ├── web/          ← Next.js 14 frontend (TypeScript + Tailwind + MapLibre)
│   └── api/          ← FastAPI backend (Python — AI, data ingestion, processing)
├── packages/
│   ├── db/           ← Prisma schema (PostgreSQL + PostGIS)
│   └── types/        ← Shared TypeScript types
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, MapLibre GL |
| Backend | Python FastAPI, SQLAlchemy, asyncpg |
| Database | PostgreSQL + PostGIS |
| Cache | Redis |
| AI | Anthropic Claude API |
| ORM | Prisma (frontend), SQLAlchemy (backend) |
| State | Zustand |

## Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL 15+ with PostGIS extension
- Redis 7+

## Setup

### 1. Clone and install

```bash
git clone <repo-url> atlas-command
cd atlas-command

# Install Node.js dependencies (monorepo workspaces)
npm install

# Install Python dependencies
cd apps/api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

### 2. Configure environment

```bash
# Frontend
cp apps/web/.env.example apps/web/.env.local

# Backend
cp apps/api/.env.example apps/api/.env
```

Edit both files with your database credentials and Anthropic API key.

### 3. Database setup

```bash
# Create database
createdb atlas_command

# Enable PostGIS
psql atlas_command -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Run Prisma migrations
npm run db:push

# Generate Prisma client
npm run db:generate
```

### 4. Run development servers

```bash
# Terminal 1 — Next.js frontend (port 3000)
npm run dev

# Terminal 2 — FastAPI backend (port 8000)
npm run dev:api

# Or run both together
npm run dev:all
```

### 5. Open in browser

```
http://localhost:3000
```

## Key Features

### Arabic-First Intelligence
- Full RTL interface when Arabic is selected
- AI briefs generated in native Arabic (not translated)
- Arabic transliteration of place names people actually use
- Toggle between EN/عربي in the top bar

### Decision Output
- **Intel Grid**: Situation → Significance → Forecast → Command Actions
- **Leader Briefing**: Sector-by-sector recommendations for each domain leader
- **Country Profile**: What your country's leadership should watch today
- **Daily Brief**: Top 5 risks at 07:00 Gulf time

### Monitoring Layers
- **Global View**: All events, planetary scale
- **Regional View**: Middle East, Gulf, Red Sea, Levant, North Africa
- **Country View**: Single country threat picture with infrastructure exposure
- **Asset View**: Specific refinery, port, or pipeline risk assessment

## API Endpoints

```
GET  /api/v1/events              — List events (filter by country, risk, sector)
GET  /api/v1/events/:id          — Get event detail
GET  /api/v1/events/nearby/:id   — Find events within radius (PostGIS)
POST /api/v1/briefs/event/:id    — Generate AI event brief (en/ar)
POST /api/v1/briefs/daily        — Generate daily intelligence brief
POST /api/v1/briefs/leader/:sec  — Generate sector leader brief
GET  /api/v1/countries            — List countries with threat levels
GET  /api/v1/countries/:code     — Get country profile
GET  /health                     — Health check
```

## Project Structure

### Frontend (`apps/web/src/`)
```
app/                    — Next.js App Router pages
components/
  layout/               — CommandCenter, TopBar, StatusStrip
  sidebar/              — Event list, filters, search
  map/                  — MapLibre GL map with event markers
  detail/               — Event detail with intel grid
  command-center/       — Leader briefing, daily brief
  shared/               — Reusable components (badges, dots, stats)
lib/                    — Language context, utilities
locales/                — en.ts, ar.ts translation files
stores/                 — Zustand state management
hooks/                  — Custom React hooks
styles/                 — Global CSS + Tailwind
```

### Backend (`apps/api/`)
```
main.py                 — FastAPI app entry point
core/                   — Config, database, Redis connections
routers/                — API route handlers
services/               — Business logic (AI briefs, analysis)
models/                 — Pydantic data models
ingest/                 — Data source ingestion (GDELT, ACLED, USGS, AIS)
```

## License

Proprietary — Atlas Command
