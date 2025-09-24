# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack resume management application built with:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Convex (serverless backend platform providing database and server functions)
- **Architecture**: The app follows a client-server model where React components interact with Convex functions for data operations

## Key Commands

```bash
# Development
npm run dev              # Runs both frontend (Vite) and backend (Convex) in parallel
npm run dev:frontend     # Runs only Vite frontend server with hot reload
npm run dev:backend      # Runs only Convex backend in development mode

# Build & Quality
npm run build           # TypeScript check + Vite production build
npm run lint            # TypeScript check + ESLint with max 0 warnings
npm run preview         # Preview production build locally

# Data Import
node import-resume.mjs  # Import resume data from ../resume_data.json to Convex database
```

## Architecture & Structure

### Data Flow
1. **Convex Backend** (`/convex/`): Handles all data operations through typed server functions
   - `schema.ts`: Defines database schema with tables for header, education, experience, and projects
   - `resumeFunctions.ts`: Contains all CRUD operations for resume data
   - Functions are exposed as queries (read), mutations (write), and actions (complex operations)

2. **Frontend** (`/src/`): Single-page React application
   - `App.tsx`: Main component containing all UI logic and Convex hooks
   - Uses Convex React hooks (`useQuery`, `useMutation`) for real-time data sync
   - Components are inline within App.tsx (not separated into individual files)

3. **Data Import**: The `import-resume.mjs` script allows bulk import of resume data from JSON

### Key Technical Patterns
- **Real-time Updates**: Convex automatically syncs data changes across all connected clients
- **Type Safety**: Full TypeScript coverage with Convex auto-generating types from schema
- **Path Aliasing**: `@/` maps to `/src/` directory for cleaner imports
- **Environment Variables**: Convex URL must be set in `.env.local` as `VITE_CONVEX_URL`

### Convex Function Types
- **Queries**: Read-only operations (e.g., `getFullResume`, `getHeader`)
- **Mutations**: Database write operations (e.g., `upsertHeader`, `addExperience`)
- **Actions**: Can perform external API calls and multiple operations (e.g., `importResumeData`)

## Database Schema

The application uses four main tables:
- `header`: Personal info, contact details, and skills
- `education`: Academic background
- `experience`: Work history with highlights
- `projects`: Personal projects and achievements

All tables use Convex's v (validator) system for runtime type checking.