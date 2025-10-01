import asyncio
import os
from dotenv import load_dotenv
from browser_use import Agent, Browser, ChatOpenAI

# Load from .env.local file
load_dotenv('../../.env.local')

async def activate_linkedin_agent(action: str, information: dict, cdp_url: str):
    browser = Browser(
        cdp_url=cdp_url, 
        # use_cloud=True
    )

    await browser.start()

    task = f"""
    *** IMPORTANT: ***
    - refer to this information when filling out the fields *** -> {information}.
    - if currentlyWorkingHere is True, do not fill out the endDate field.
    - the description field is a list of strings, each string should be a bullet point in the description section.
    - For company/organization: ALWAYS select the first dropdown option.
    - If asked to post job update: click Skip.
    - After inputting text into a dropdown field, press "Tab" and "Enter" to select the first option.

    - if {action} == 'add'
        - Navigate to https://www.linkedin.com/in/shawnpana/edit/forms/position/new/?profileFormEntryPoint=PROFILE_SECTION
        - fill in the fields with the provided information previously mentioned.
        - Save the changes by clicking the 'Save' button
        - END your process
    """

    agent = Agent(task=task, llm=ChatOpenAI(model='gpt-4.1-mini'), browser=browser)

    await agent.run()

async def init_browser_with_linkedin_login(credentials: dict) -> str:
    browser = Browser(
        # use_cloud=True,
        keep_alive=True
    )

    task = f"""
    - Navigate to https://www.linkedin.com/login
    - Locate the username input field and enter the username: {credentials['username']}
    - Locate the password input field and enter the password: {credentials['password']}
    - Click the 'Sign in' button to log in to the account
    - You may be prompted to complete a CAPTCHA or verify your identity through other means; please do so if prompted.
        - If you see a reCAPTCHA, say that "I am not a robot"
        - You may see a question that asks you to choose the correct image. This will be an animal with four legs. You must select the picture where the animal is standing with its four legs on the ground. This means closest to the bottom most side of the image.
    - Ensure that the login is successful by checking if the user is redirected to their LinkedIn feed.
    """

    agent = Agent(
        task=task, 
        llm=ChatOpenAI(model='gpt-4.1-mini'), 
        browser=browser
    )

    await agent.run()

    return browser.cdp_url



async def main():
    action = "add"  # or "edit"
    information = {
      "title": "Growth Engineering Intern",
      "employmentType": "Internship",
      "companyName": "Browser Use",
      "currentlyWorkingHere": True,
      "startDate": "September 2025",
      "endDate": "December 2025",
      "description": [
        "100 demos, 100 days"
      ]
    }
    credentials = {
        "username": os.getenv("LINKEDIN_USERNAME"),
        "password": os.getenv("LINKEDIN_PASSWORD")
    }

    cdp_url = await init_browser_with_linkedin_login(credentials)

    await activate_linkedin_agent(action, information, cdp_url)

async def test():
    action = "add"  # or "edit"
    information = {
      "title": "Growth Engineering Intern",
      "employmentType": "Internship",
      "companyName": "Browser Use",
      "currentlyWorkingHere": True,
      "startDate": "September 2025",
      "endDate": "December 2025",
      "description": [
        "100 demos, 100 days"
      ]
    }
    credentials = {
        "username": os.getenv("LINKEDIN_USERNAME"),
        "password": os.getenv("LINKEDIN_PASSWORD")
    }

    cdp_url = "https://41fe2033-84cf-430e-a724-621ec9fe437c.cdp3.browser-use.com"

    await activate_linkedin_agent(action, information, cdp_url)

if __name__ == '__main__':
  asyncio.run(test())
