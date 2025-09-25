# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack resume management application with AI-powered resume parsing and export capabilities:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend Services**:
  - Convex: Serverless backend for real-time database and server functions
  - FastAPI: Python API for resume export (PDF/LaTeX/JSON) and LinkedIn automation
- **Architecture**: React frontend → Convex backend → Optional FastAPI services

## Key Commands

### Frontend Development
```bash
# Main development commands
npm run dev              # Runs both frontend (Vite) and backend (Convex) in parallel
npm run dev:frontend     # Runs only Vite frontend server with hot reload
npm run dev:backend      # Runs only Convex backend in development mode

# Build & Quality
npm run build           # TypeScript check + Vite production build
npm run lint            # TypeScript check + ESLint with max 0 warnings
npm run preview         # Preview production build locally
```

### Backend API (Python/FastAPI)
```bash
# Backend API is managed with 'just' (task runner)
cd backend
just run                # Start API server on port 8000
just run-background     # Start API in background
just stop              # Stop background API
just status            # Check API health
just setup             # Install dependencies and check LaTeX
just test-pdf          # Test PDF export functionality
just test-json         # Test JSON export functionality
```

## Architecture & Key Files

### Convex Backend (`/convex/`)
- **schema.ts**: Database schema for header, education, experience, projects tables
- **resumeFunctions.ts**: CRUD operations, data import/export actions
- **uploadResume.ts**: Resume file upload and parsing logic
- **exportResume.ts**: Resume export functionality
- **resumeParser.ts**: Resume parsing utilities

### Frontend (`/src/`)
- **App.tsx**: Main component with all UI logic, form handling, and Convex hooks
- **ResumeExport.tsx**: Resume export UI component
- **degreesData.ts** & **majorsData.ts**: Autocomplete data for education fields

### Python Backend (`/backend/`)
- **api.py**: FastAPI server for resume export (PDF/LaTeX/JSON)
- **resume-builder/**: Resume building and LaTeX generation utilities
- **justfile**: Task runner configuration for backend operations

## Key Technical Patterns

### Data Flow
1. User interactions in React → Convex mutations/queries
2. Real-time data sync via Convex subscriptions
3. File uploads → Base64 encoding → Convex action → Python API for parsing
4. Export requests → Convex data → Python API → PDF/LaTeX generation

### Resume Upload Flow
1. File uploaded in frontend (PDF/DOCX)
2. Converted to Base64
3. Sent to Convex action `uploadAndParseResume`
4. Convex forwards to Python parsing API
5. Parsed data imported to Convex database

### Export Flow
1. User selects format and items in frontend
2. Request sent to FastAPI backend
3. Data fetched from Convex
4. LaTeX/PDF generated using resume-builder utilities
5. File returned as Base64 to frontend

## Environment Setup

### Required Environment Variables
- `.env.local`:
  - `VITE_CONVEX_URL`: Convex deployment URL
- Convex Dashboard:
  - `RESUME_PARSER_API_URL`: URL for resume parsing API (if using external parser)

### Dependencies
- Node.js & npm for frontend
- Python 3.x for backend API
- LaTeX (optional): For PDF generation (`brew install --cask mactex` on macOS)

## Common Development Tasks

### Adding New Resume Fields
1. Update schema in `convex/schema.ts`
2. Update mutations in `convex/resumeFunctions.ts`
3. Add form fields in `src/App.tsx`
4. Update export logic in `backend/resume-builder/resume_builder_utils.py`

### Testing Resume Import
1. Start dev servers: `npm run dev`
2. Upload a PDF/DOCX file through the UI
3. Check Convex dashboard for imported data

### Testing Resume Export
1. Start FastAPI: `cd backend && just run`
2. Use export button in UI
3. Select format (PDF/LaTeX/JSON)
4. Download generated file

## Important Notes

- **Real-time Sync**: All data changes automatically sync across clients via Convex
- **Type Safety**: Convex auto-generates TypeScript types from schema
- **Path Aliases**: `@/` maps to `/src/` directory
- **File Size Limits**: Convex actions have a 20MB limit for file uploads
- **LaTeX Requirement**: PDF export requires LaTeX installation on the server