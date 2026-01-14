# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **MANDATORY**: Read [AGENTS.md](AGENTS.md) before starting any work. It contains critical workflow rules for issue tracking with beads (`bd`) and session completion protocols.

## Project Overview

Brute Bookmarks is a self-hosted bookmark manager with automatic icon fetching. Single-page vanilla JS frontend communicating with an Express backend. Optional Clerk authentication.

## Commands

```bash
# Development (hot-reload via nodemon)
npm run dev

# Production
npm start

# Docker
docker-compose up --build
```

Server runs on `http://localhost:3002` by default.

## Architecture

### Frontend (`public/index.html`)
- Single HTML file with embedded CSS and JavaScript (~2300 lines)
- Data stored in browser `localStorage` key: `speedDialData`
- Syncs to backend via `/api/data` endpoint
- Auth handled by `public/js/auth.js` (Clerk SDK) and `public/js/auth-fetch.js` (token injection)

### Backend (`server.js`)
- Express server handling icon fetching, caching, and data persistence
- Icons cached in `/icons/` directory (hash-based filenames)
- Bookmark data stored in `/data/bookmarks.json`
- All `/api/*` routes protected by Clerk (except `/api/config`)

### Authentication (`middleware/clerk-auth.js`)
- Optional: runs without auth if `CLERK_SECRET_KEY` is empty
- `setupClerkMiddleware(app)` - initializes Clerk
- `protectApiRoutes` - middleware for `/api/*` protection

## Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/config` | GET | Public - returns Clerk publishable key |
| `/api/search-icons?query=X` | GET | Search Wikimedia Commons |
| `/api/download-icon` | POST | Download and cache icon from URL |
| `/api/upload-icon` | POST | Upload custom icon (multipart) |
| `/api/get-favicon` | POST | Fetch site favicon via DuckDuckGo |
| `/api/search-emojis?query=X` | GET | Search Twemoji library |
| `/api/download-emoji` | POST | Convert SVG emoji to cached PNG |
| `/api/data` | GET/POST | Read/write bookmark data |

## Icon Processing Pipeline

All icons (Wikimedia, favicons, uploads, emojis) go through Sharp:
1. Download/receive image
2. Resize to 128×128px (contain mode, transparent background)
3. Convert to PNG
4. Save with MD5 hash filename to `/icons/`
5. Return path like `/icons/abc123.png`

## Environment Variables

```env
CLERK_PUBLISHABLE_KEY=pk_test_...   # Frontend auth (optional)
CLERK_SECRET_KEY=sk_test_...        # Backend auth (optional)
PORT=3002                           # Server port
NODE_ENV=development                # development or production
```

## Data Storage

- **Bookmarks**: `/data/bookmarks.json` - array of category objects
- **Icons**: `/icons/` - cached PNG files with hash-based names
- Both directories auto-created on startup and persisted via Docker volumes

## Tech Stack

- **Backend**: Express, Sharp (image processing), Multer (uploads), Axios
- **Frontend**: Vanilla JS, CSS custom properties for theming
- **Auth**: Clerk (optional)
- **Deployment**: Docker multi-stage build, nginx reverse proxy, systemd service
