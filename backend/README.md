# Resume Backend API

This backend provides resume export functionality, allowing users to generate professional PDFs, LaTeX files, and JSON exports from their Convex resume data.

## Features

- **PDF Generation**: Creates professional PDF resumes using LaTeX
- **LaTeX Export**: Exports customizable LaTeX source files
- **JSON Export**: Exports raw resume data in JSON format
- **LinkedIn Integration**: Automated LinkedIn profile updates

## Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install LaTeX (for PDF generation)

#### macOS
```bash
brew install --cask mactex
# OR for a lighter installation:
brew install --cask basictex
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install texlive-full
# OR for a lighter installation:
sudo apt-get install texlive-latex-base texlive-fonts-recommended
```

#### Windows
Download and install MiKTeX from: https://miktex.org/download

### 3. Environment Variables

The backend uses the same `.env.local` file as the frontend:

```bash
# In project root
VITE_CONVEX_URL=your_convex_url_here
```

### 4. Start the API Server

```bash
cd backend
python api.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Export Resume
**POST** `/resume/export`

Request body:
```json
{
  "format": "pdf" | "latex" | "json",
  "filename": "optional_custom_filename"
}
```

Response:
```json
{
  "success": true,
  "format": "pdf",
  "filename": "resume.pdf",
  "content": "base64_encoded_file_content",
  "mime_type": "application/pdf",
  "message": "Resume exported successfully as PDF"
}
```

### Preview Resume Data
**GET** `/resume/preview`

Returns the current resume data from Convex in JSON format.

### Health Check
**GET** `/health`

Returns API status.

## Frontend Integration

The frontend components automatically handle:
1. Calling the backend API
2. Decoding base64 content
3. Creating download links
4. Error handling with user-friendly messages

## Troubleshooting

### "Backend API is not running"
Start the API server:
```bash
cd backend
python api.py
```

### "pdflatex not found"
Install LaTeX as described in the setup section. If you don't want to install LaTeX, you can still export in LaTeX or JSON format.

### PDF generation fails
The system will automatically fall back to LaTeX format if PDF generation fails. Common issues:
- Missing LaTeX packages
- Special characters in resume data
- Timeout during compilation

### Cannot connect to Convex
Ensure:
1. Your Convex dev server is running (`npx convex dev`)
2. The `.env.local` file contains the correct `VITE_CONVEX_URL`
3. The Convex functions are deployed

## Development

### Running in Development Mode

The API server supports hot-reload:
```bash
cd backend
python api.py  # Includes reload=True
```

### Testing Export Formats

Test each format independently:
```bash
# Test JSON export (no backend required from frontend)
# Test LaTeX export (backend required, no LaTeX installation needed)
# Test PDF export (backend + LaTeX installation required)
```

## Production Deployment

For production deployment:

1. **Deploy the API**: Use services like Railway, Render, or AWS Lambda
2. **Update Environment Variables**: Set `RESUME_EXPORT_API_URL` in Convex dashboard
3. **Install LaTeX on Server**: Ensure the production server has LaTeX installed for PDF generation

### Docker Deployment (Optional)

Create a `Dockerfile`:
```dockerfile
FROM python:3.11
RUN apt-get update && apt-get install -y texlive-full
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Security Notes

- The API uses CORS middleware configured for local development
- For production, update CORS settings to your specific domain
- API endpoints don't require authentication (relies on Convex security)
- Consider adding rate limiting for production use