# VedaAI — AI Assessment Creator

Full-stack application for teachers to create assignments, generate structured question papers with AI, and view/export exam-ready output.

## Architecture

```
┌─────────────┐     REST + WS      ┌──────────────────────────────────────┐
│  Next.js    │ ◄────────────────► │  Express API (TypeScript)            │
│  Frontend   │                    │  • POST /api/assignments             │
│  Zustand    │                    │  • WebSocket /ws?assignmentId=...    │
└─────────────┘                    └──────────────┬───────────────────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────┐
                    ▼                             ▼                         ▼
              ┌──────────┐                 ┌────────────┐            ┌────────────┐
              │ MongoDB  │                 │   Redis    │            │  BullMQ    │
              │ Assign-  │                 │ Job state  │            │  Worker    │
              │ ments    │                 │ + cache    │            │ (AI gen)   │
              └──────────┘                 └────────────┘            └────────────┘
```

### Flow

1. Teacher submits assignment form → API validates with Zod
2. Assignment saved to MongoDB → job enqueued in BullMQ
3. Worker picks job → builds structured prompt → calls LLM (or mock)
4. Response parsed & validated (never rendered raw) → stored + cached in Redis
5. WebSocket broadcasts progress → frontend redirects to output page
6. Optional PDF export via Puppeteer with proper formatting

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Zustand, WebSocket |
| Backend | Express, TypeScript, MongoDB, Redis, BullMQ, ws |
| AI | OpenAI-compatible API (JSON mode) + mock fallback |

## Prerequisites

- Node.js 20+
- Docker (for MongoDB & Redis) **or** local installs
- OpenAI API key (optional — mock mode works without it)

## Quick Start

### 1. Start infrastructure

```bash
docker compose up -d
```

### 2. Install dependencies

```bash
npm install
npm run install:all
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env`:

```env
OPENAI_API_KEY=sk-...          # Optional
USE_MOCK_AI=true               # Set true to demo without API key
```

### 4. Run all services

**Terminal 1 — API:**
```bash
cd backend && npm run dev
```

**Terminal 2 — Worker:**
```bash
cd backend && npm run worker
```

**Terminal 3 — Frontend:**
```bash
cd frontend && npm run dev
```

Or from root (requires `concurrently`):
```bash
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
VedaAI/
├── frontend/          # Next.js app
│   ├── src/app/       # Pages (create, generate, output)
│   ├── src/store/     # Zustand state
│   └── src/lib/       # API + WebSocket client
├── backend/
│   ├── src/routes/    # REST endpoints
│   ├── src/workers/   # BullMQ consumer
│   ├── src/services/  # AI, cache, PDF, prompts
│   └── src/websocket/ # Real-time updates
└── docker-compose.yml
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/assignments` | Create assignment + queue generation |
| GET | `/api/assignments/:id` | Get assignment + generated paper |
| POST | `/api/assignments/:id/regenerate` | Re-queue generation |
| GET | `/api/assignments/:id/pdf` | Download formatted PDF |
| WS | `/ws?assignmentId=:id` | Real-time job updates |

## Approach

### Prompt structuring
Input (sections, types, marks, instructions, optional PDF text) is converted into a strict JSON-schema prompt. The LLM must return structured sections/questions — never free-form text shown to users.

### Parsing & validation
LLM output is extracted, normalized (IDs, marks, difficulty), and validated with Zod before storage. Invalid responses fail the job with a clear error.

### State management (Zustand)
- Form state with validation
- Job progress via WebSocket
- Generated paper for output view

### Bonus features
- PDF export (Puppeteer, exam-style layout)
- Regenerate action bar
- Difficulty badges (Easy / Moderate / Hard)
- Mock AI for demos without API costs

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4000 | API port |
| MONGODB_URI | localhost:27017 | MongoDB connection |
| REDIS_URL | localhost:6379 | Redis for BullMQ + cache |
| OPENAI_API_KEY | — | LLM API key |
| USE_MOCK_AI | auto | true if no API key |

### Frontend (`frontend/.env.local`)

| Variable | Default |
|----------|---------|
| NEXT_PUBLIC_API_URL | http://localhost:4000 |
| NEXT_PUBLIC_WS_URL | ws://localhost:4000 |

## Submission Checklist

- [x] Assignment creation form with validation
- [x] Zustand state management
- [x] WebSocket real-time updates
- [x] AI generation with structured prompt + parsing
- [x] MongoDB, Redis, BullMQ, Express backend
- [x] Structured output page (sections, difficulty, marks)
- [x] PDF download
- [x] Regenerate
- [x] README with architecture

## License

Built for VedaAI hiring assignment submission.
