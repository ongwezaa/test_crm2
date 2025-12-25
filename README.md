# Local-Only CRM + Work Management

A lightweight monday.com-inspired CRM + work management system that runs entirely on a local machine with SQLite.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, SQLite (better-sqlite3), JWT auth
- **Frontend:** Static HTML, Tailwind CSS (CDN), Vanilla JS, Chart.js

## Project Structure

```
/apps
  /api   # TypeScript Express backend
  /web   # Static HTML / CSS / JavaScript frontend
```

## Prerequisites

- Node.js 18+
- npm
- Visual Studio Code

## Backend Setup (Windows + VS Code)

1. Open VS Code and open the repository folder.
2. Open a new terminal in VS Code.
3. Run the following commands:

```bash
cd apps/api
npm install
npm run db:init
npm run db:seed
npm run dev
```

The API will start on `http://localhost:3000`.

### Demo Users

- **Admin:** `admin@localcrm.test` / `password123`
- **Member:** `member@localcrm.test` / `password123`

## Frontend Setup

Use any simple static server (VS Code Live Server, `npx serve`, etc.).

```bash
cd apps/web
npx serve .
```

Then open the provided localhost URL. The frontend expects the API at `http://localhost:3000`.

## Features

- JWT authentication with Admin/Member roles
- Dashboard with Chart.js widgets
- Deals Kanban board with drag & drop
- monday-style deals table with inline editing and auto-save
- Companies, contacts, tasks views
- SQLite seed data for realistic dashboards

## Database

SQLite file is stored at `apps/api/data/app.db`.

## Notes

- All data stays local—no external services required.
- To reset data, re-run `npm run db:seed`.
