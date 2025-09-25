# Resume Use

<div align="center">
  <img src="public/browser-use-logo.png" alt="Browser Use Logo" width="120"/>

  **AI-Powered Resume Management System**

  Parse, manage, and export professional resumes with real-time sync and LaTeX generation.
</div>

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local

# Run development server
npm run dev
```

The app will open at `http://localhost:5173`


## Project Structure

```
resume-use/
├── src/                    # React frontend
│   ├── App.tsx            # Main UI component
│   └── ResumeExport.tsx   # Export controls
├── convex/                # Backend functions
│   ├── schema.ts          # Database schema
│   ├── resumeFunctions.ts # CRUD operations
│   └── resumeParser.ts    # AI parsing logic
└── backend/               # Python API
    ├── api.py             # FastAPI server
    └── resume-builder/    # LaTeX generation
```

## Development

### Frontend Development

```bash
npm run dev:frontend    # Start only frontend
npm run build          # Production build
npm run lint           # Run linter
```

### Backend API (Python)

```bash
cd backend

# Using just (recommended)
just setup             # Install dependencies
just run              # Start API server
just test-pdf         # Test PDF export

# Manual setup
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python api.py
```

### Database Management

Access Convex Dashboard to view/edit data:
```bash
npx convex dashboard
```

## Customization

### Modify LaTeX Template

Edit the LaTeX generation in `backend/resume-builder/resume_builder_utils.py`:

### Add New Resume Fields

1. **Update Schema** (`convex/schema.ts`):
```typescript
experience: defineTable({
  // ... existing fields
  newField: v.optional(v.string()),
})
```

2. **Update Mutations** (`convex/resumeFunctions.ts`):
```typescript
export const addExperience = mutation({
  args: {
    // ... existing args
    newField: v.optional(v.string()),
  },
  // ...
})
```

3. **Update UI** (`src/App.tsx`):
```tsx
<input
  value={newExperience.newField}
  onChange={(e) => setNewExperience({
    ...newExperience,
    newField: e.target.value
  })}
/>
```

4. **Update Parser** (`convex/resumeParser.ts`):
```typescript
experience: Array<{
  // ... existing fields
  newField: string;
}>
```

### Resume Parser Prompts

Modify AI extraction in `convex/resumeParser.ts` (line ~198):
```typescript
const systemPrompt = `You are a resume parser...
// Modify extraction guidelines here
`;
```

## API Endpoints

### FastAPI (Port 8000)

- `POST /resume/export` - Export resume (PDF/LaTeX/JSON)
- `GET /health` - Health check

### Convex Functions

- `getFullResume` - Fetch all resume data
- `upsertHeader` - Update header info
- `addExperience` - Add experience entry
- `uploadAndParseResume` - Parse uploaded file

## Environment Variables

### Required
- `VITE_CONVEX_URL` - Convex deployment URL (auto-generated on first run)
- `ANTHROPIC_API_KEY` - Claude API key for parsing resumes

## LaTeX Requirements

For PDF generation, install LaTeX:

```bash
# macOS
brew install --cask mactex

# Ubuntu/Debian
sudo apt-get install texlive-full

# Windows
# Download MiKTeX from https://miktex.org
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

### Convex Connection Issues
```bash
# Reset Convex deployment
npx convex dev --clear
```

### PDF Export Fails
```bash
# Check LaTeX installation
which pdflatex

# Install if missing
cd backend && just install-latex-mac
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push branch (`git push origin feature/amazing`)
5. Open Pull Request

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Convex (real-time), FastAPI (exports)
- **AI**: Claude 3.5 Sonnet (resume parsing)
- **Export**: LaTeX (PDF generation)

## License

MIT