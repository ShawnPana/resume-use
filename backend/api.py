import asyncio
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, Literal
import sys
import subprocess
import tempfile
import base64
from pathlib import Path

# Add resume-builder to path
resume_builder_path = os.path.join(os.path.dirname(__file__), 'resume-builder')
if resume_builder_path not in sys.path:
    sys.path.insert(0, resume_builder_path)

# Import resume builder functions
from resume_builder_utils import export_to_latex, export_resume_to_json, get_full_resume

app = FastAPI(title="Resume LinkedIn API", version="1.0.0")

# Add CORS middleware to allow frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite and potential other dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LinkedInExperienceRequest(BaseModel):
    experience_id: Optional[str] = None
    experience_index: Optional[int] = None
    action: str = "add"

class ResumeExportRequest(BaseModel):
    format: Literal["pdf", "latex", "json"] = "pdf"
    filename: Optional[str] = None

@app.post("/linkedin/add-experience")
async def add_experience_to_linkedin(request: LinkedInExperienceRequest):
    """
    Add experience to LinkedIn using the experience ID from Convex

    Args:
        experience_id: Convex ID of the experience (_id field)
        experience_index: Index of experience in the list (0-based)
        action: 'add' or 'edit' (default: 'add')

    Returns:
        Success status and message
    """
    try:
        # Placeholder for LinkedIn automation
        # The actual implementation would go here
        return {
            "success": True,
            "message": "LinkedIn endpoint placeholder - implement automation here"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error adding experience to LinkedIn: {str(e)}"
        )

@app.post("/resume/export")
async def export_resume(request: ResumeExportRequest):
    """
    Export resume in various formats (PDF, LaTeX, JSON)

    Args:
        format: Export format - 'pdf', 'latex', or 'json'
        filename: Optional custom filename (without extension)

    Returns:
        Base64 encoded file content with metadata
    """
    try:
        # Create temporary directory for output files
        with tempfile.TemporaryDirectory() as temp_dir:
            # Generate filenames
            base_filename = request.filename or "resume"

            if request.format == "json":
                # Export to JSON
                output_file = os.path.join(temp_dir, f"{base_filename}.json")
                export_resume_to_json(output_file)
                mime_type = "application/json"
                file_extension = "json"

            elif request.format == "latex":
                # Export to LaTeX
                output_file = os.path.join(temp_dir, f"{base_filename}.tex")
                export_to_latex(output_file)
                mime_type = "application/x-tex"
                file_extension = "tex"

            elif request.format == "pdf":
                # First export to LaTeX
                latex_file = os.path.join(temp_dir, f"{base_filename}.tex")
                export_to_latex(latex_file)

                # Compile LaTeX to PDF
                try:
                    # Run pdflatex twice to resolve references
                    for _ in range(2):
                        result = subprocess.run(
                            ["pdflatex", "-interaction=nonstopmode", "-output-directory", temp_dir, latex_file],
                            capture_output=True,
                            text=True,
                            timeout=30
                        )

                    output_file = os.path.join(temp_dir, f"{base_filename}.pdf")

                    # Check if PDF was created
                    if not os.path.exists(output_file):
                        # If pdflatex failed, return LaTeX with instructions
                        with open(latex_file, 'rb') as f:
                            latex_content = base64.b64encode(f.read()).decode('utf-8')

                        return JSONResponse({
                            "success": False,
                            "message": "PDF generation failed. Returning LaTeX file instead.",
                            "format": "latex",
                            "filename": f"{base_filename}.tex",
                            "content": latex_content,
                            "mime_type": "application/x-tex",
                            "error_details": result.stderr if result else "Unknown error"
                        })

                    mime_type = "application/pdf"
                    file_extension = "pdf"

                except subprocess.TimeoutExpired:
                    raise HTTPException(status_code=500, detail="PDF generation timed out")
                except FileNotFoundError:
                    # pdflatex not installed
                    with open(latex_file, 'rb') as f:
                        latex_content = base64.b64encode(f.read()).decode('utf-8')

                    return JSONResponse({
                        "success": False,
                        "message": "pdflatex not found. Please install LaTeX to generate PDFs.",
                        "format": "latex",
                        "filename": f"{base_filename}.tex",
                        "content": latex_content,
                        "mime_type": "application/x-tex"
                    })

            # Read the file and encode as base64
            with open(output_file, 'rb') as f:
                file_content = base64.b64encode(f.read()).decode('utf-8')

            return {
                "success": True,
                "format": request.format,
                "filename": f"{base_filename}.{file_extension}",
                "content": file_content,
                "mime_type": mime_type,
                "message": f"Resume exported successfully as {request.format.upper()}"
            }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error exporting resume: {str(e)}"
        )

@app.get("/resume/preview")
async def preview_resume():
    """
    Get resume data preview

    Returns:
        Resume data in JSON format for preview
    """
    try:
        resume_data = get_full_resume()
        return {
            "success": True,
            "data": resume_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching resume data: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Resume API is running"}

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Resume Management API",
        "endpoints": {
            "/linkedin/add-experience": "POST - Add experience to LinkedIn",
            "/resume/export": "POST - Export resume as PDF/LaTeX/JSON",
            "/resume/preview": "GET - Preview resume data",
            "/health": "GET - Health check"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)