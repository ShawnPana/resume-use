import asyncio
import os
import sys
from typing import Dict, Optional
from dotenv import load_dotenv
from linkedin import init_browser_with_linkedin_login, activate_linkedin_agent

# Add parent directory to path to import from backend/resume-builder
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
resume_builder_path = os.path.join(parent_dir, 'resume-builder')
if resume_builder_path not in sys.path:
    sys.path.insert(0, resume_builder_path)

# Import with full module name to avoid circular import
import importlib.util
spec = importlib.util.spec_from_file_location("resume_utils", os.path.join(resume_builder_path, "resume_builder_utils.py"))
resume_utils = importlib.util.module_from_spec(spec)
spec.loader.exec_module(resume_utils)
get_experience = resume_utils.get_experience

load_dotenv()

def format_convex_experience_for_linkedin(experience: Dict) -> Dict:
    """
    Convert experience data from Convex/resume format to LinkedIn agent format

    Args:
        experience: Experience dictionary from Convex with format:
            - title: Company name
            - position: Job title/position
            - startDate: Start date
            - endDate: End date or "Present"
            - highlights: List of bullet points

    Returns:
        Formatted dictionary for LinkedIn agent
    """
    # Determine if currently working there
    currently_working = experience.get("endDate", "").lower() in ["present", "current", "ongoing"]

    # Detect employment type from position
    position = experience.get("position", "")
    position_lower = position.lower()

    employment_type = "Full-time"  # Default
    if "intern" in position_lower:
        employment_type = "Internship"
    elif "contract" in position_lower or "contractor" in position_lower:
        employment_type = "Contract"
    elif "part-time" in position_lower or "part time" in position_lower:
        employment_type = "Part-time"
    elif "freelance" in position_lower:
        employment_type = "Freelance"
    elif "volunteer" in position_lower:
        employment_type = "Volunteer"

    # Format for LinkedIn agent
    linkedin_data = {
        "title": experience.get("position", ""),  # Job title
        "employmentType": employment_type,
        "companyName": experience.get("title", ""),  # Company name
        "currentlyWorkingHere": currently_working,
        "startDate": experience.get("startDate", ""),
        "description": [experience.get("description", "")]
    }

    # Only add endDate if not currently working
    if not currently_working:
        linkedin_data["endDate"] = experience.get("endDate", "")

    return linkedin_data

async def update_linkedin_from_convex(
    experience_id: Optional[str] = None,
    experience_index: Optional[int] = None,
    action: str = "add"
) -> bool:
    """
    Fetch experience from Convex and update LinkedIn profile

    Args:
        experience_id: Convex ID of the experience to add (_id field)
        experience_index: Index of experience in the list (0-based)
        action: 'add' or 'edit'

    Returns:
        Boolean indicating success

    Example:
        # Add first experience from Convex
        await update_linkedin_from_convex(experience_index=0)

        # Add specific experience by ID
        await update_linkedin_from_convex(experience_id="j976qw7t4nh6jdpsfbjyqc68n17r2vpk")
    """
    try:
        # Get all experiences from Convex
        experiences = get_experience()

        if not experiences:
            print("No experiences found in Convex")
            return False

        # Find the specific experience
        experience = None
        if experience_id:
            # Find by ID
            experience = next((exp for exp in experiences if exp.get("_id") == experience_id), None)
            if not experience:
                print(f"Experience with ID {experience_id} not found")
                return False
        elif experience_index is not None:
            # Get by index
            if 0 <= experience_index < len(experiences):
                experience = experiences[experience_index]
            else:
                print(f"Experience index {experience_index} out of range (0-{len(experiences)-1})")
                return False
        else:
            # Default to first experience
            experience = experiences[0]
            print(f"No experience specified, using first: {experience.get('title')}")

        # Format experience for LinkedIn
        linkedin_data = format_convex_experience_for_linkedin(experience)

        print(f"Processing experience: {linkedin_data['title']} at {linkedin_data['companyName']}")

        # Get credentials
        credentials = {
            "username": os.getenv("LINKEDIN_USERNAME"),
            "password": os.getenv("LINKEDIN_PASSWORD")
        }

        if not credentials["username"] or not credentials["password"]:
            print("LinkedIn credentials not found in environment variables")
            return False

        # Initialize browser and login
        cdp_url = await init_browser_with_linkedin_login(credentials)

        # Add/edit the experience on LinkedIn
        await activate_linkedin_agent(action, linkedin_data, cdp_url)

        print(f"Successfully {action}ed LinkedIn experience: {linkedin_data['title']} at {linkedin_data['companyName']}")
        return True

    except Exception as e:
        print(f"Error updating LinkedIn from Convex: {e}")
        return False

async def update_linkedin(
    action: str = "add",
    experience_data: Optional[Dict] = None,
    use_existing_session: bool = False,
    cdp_url: Optional[str] = None
) -> bool:
    """
    Update LinkedIn profile with experience information

    Args:
        action: 'add' to add new experience, 'edit' to modify existing
        experience_data: Dictionary containing:
            - title: Job title
            - employmentType: Type of employment (Full-time, Part-time, Internship, etc.)
            - companyName: Name of the company
            - currentlyWorkingHere: Boolean indicating if still working there
            - startDate: Start date (format: "Month Year")
            - endDate: End date (format: "Month Year") - omit if currentlyWorkingHere is True
            - description: List of bullet points describing the role
        use_existing_session: Whether to use an existing browser session
        cdp_url: CDP URL of existing session (required if use_existing_session is True)

    Returns:
        Boolean indicating success

    Example:
        experience = {
            "title": "Software Engineer",
            "employmentType": "Full-time",
            "companyName": "Tech Company",
            "currentlyWorkingHere": False,
            "startDate": "January 2023",
            "endDate": "December 2023",
            "description": [
                "Developed scalable web applications",
                "Implemented CI/CD pipelines"
            ]
        }
        success = await update_linkedin("add", experience)
    """
    try:
        # Use default experience data if none provided
        if experience_data is None:
            experience_data = {
                "title": "Software Engineering Intern",
                "employmentType": "Internship",
                "companyName": "Tech Company",
                "currentlyWorkingHere": True,
                "startDate": "September 2024",
                "description": [
                    "Developing full-stack applications",
                    "Collaborating with cross-functional teams"
                ]
            }

        # Get LinkedIn credentials from environment
        credentials = {
            "username": os.getenv("LINKEDIN_USERNAME"),
            "password": os.getenv("LINKEDIN_PASSWORD")
        }

        if not credentials["username"] or not credentials["password"]:
            raise ValueError("LinkedIn credentials not found in environment variables")

        # Initialize browser and login if not using existing session
        if not use_existing_session:
            cdp_url = await init_browser_with_linkedin_login(credentials)
        elif not cdp_url:
            raise ValueError("CDP URL required when using existing session")

        # Activate the LinkedIn agent to perform the action
        await activate_linkedin_agent(action, experience_data, cdp_url)

        print(f"Successfully {action}ed LinkedIn experience: {experience_data.get('title', 'Unknown')}")
        return True

    except Exception as e:
        print(f"Error updating LinkedIn: {e}")
        return False

def format_experience_for_linkedin(experience: Dict) -> Dict:
    """
    Convert experience data from resume format to LinkedIn format

    Args:
        experience: Experience dictionary from resume data

    Returns:
        Formatted dictionary for LinkedIn update
    """
    # Determine if currently working there based on endDate
    currently_working = experience.get("endDate", "").lower() in ["present", "current", "ongoing"]

    # Format the experience data for LinkedIn
    linkedin_data = {
        "title": experience.get("position", experience.get("title", "")),
        "employmentType": "Full-time",  # Default, can be enhanced with logic
        "companyName": experience.get("title", ""),  # In resume, company is often in 'title'
        "currentlyWorkingHere": currently_working,
        "startDate": experience.get("startDate", ""),
        "description": experience.get("highlights", [])
    }

    # Only add endDate if not currently working there
    if not currently_working:
        linkedin_data["endDate"] = experience.get("endDate", "")

    # Detect employment type from position title
    position_lower = linkedin_data["title"].lower()
    if "intern" in position_lower:
        linkedin_data["employmentType"] = "Internship"
    elif "contract" in position_lower or "contractor" in position_lower:
        linkedin_data["employmentType"] = "Contract"
    elif "part-time" in position_lower or "part time" in position_lower:
        linkedin_data["employmentType"] = "Part-time"
    elif "freelance" in position_lower:
        linkedin_data["employmentType"] = "Freelance"

    return linkedin_data

# Main execution function for testing
async def main():
    """
    Main function for testing LinkedIn updates from Convex
    """
    # Example: Add first experience from Convex to LinkedIn
    success = await update_linkedin_from_convex(experience_index=0)

    if success:
        print("LinkedIn profile updated successfully!")
    else:
        print("Failed to update LinkedIn profile")

if __name__ == "__main__":
    asyncio.run(main())