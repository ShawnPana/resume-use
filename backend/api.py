import asyncio
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sys

# Add social-media-updater to path
social_media_path = os.path.join(os.path.dirname(__file__), 'social-media-updater')
if social_media_path not in sys.path:
    sys.path.insert(0, social_media_path)

# Import the LinkedIn function
import importlib.util
spec = importlib.util.spec_from_file_location("social_utils", os.path.join(social_media_path, "utils.py"))
social_utils = importlib.util.module_from_spec(spec)
spec.loader.exec_module(social_utils)
update_linkedin_from_convex = social_utils.update_linkedin_from_convex

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
        # Call the LinkedIn automation function
        result = await update_linkedin_from_convex(
            experience_id=request.experience_id,
            experience_index=request.experience_index,
            action=request.action
        )

        if result:
            return {
                "success": True,
                "message": "Experience successfully added to LinkedIn"
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to add experience to LinkedIn"
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error adding experience to LinkedIn: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "LinkedIn API is running"}

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Resume LinkedIn API",
        "endpoints": {
            "/linkedin/add-experience": "POST - Add experience to LinkedIn",
            "/health": "GET - Health check"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)