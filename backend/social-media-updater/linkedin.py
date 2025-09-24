import asyncio
import os
from dotenv import load_dotenv
from browser_use import Agent, Browser, ChatOpenAI

load_dotenv()

async def activate_linkedin_agent(action: str, information: dict, cdp_url: str):
    browser = Browser(
        cdp_url=cdp_url, 
        use_cloud=True
    )

    await browser.start()

    task = f"""
    *** IMPORTANT: ***
    - refer to this information when filling out the fields *** -> {information}.
    - if currentlyWorkingHere is True, do not fill out the endDate field.
    - the description field is a list of strings, each string should be a bullet point in the description section.
    - For company/organization: ALWAYS select the first dropdown option.
    - If asked to post job update: click Skip.

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
        use_cloud=True,
        keep_alive=True
    )

    task = f"""
    - Navigate to https://www.linkedin.com/login
    - Locate the username input field and enter the username: {credentials['username']}
    - Locate the password input field and enter the password: {credentials['password']}
    - Click the 'Sign in' button to log in to the account
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

    browser

    cdp_url = "https://41fe2033-84cf-430e-a724-621ec9fe437c.cdp3.browser-use.com"

    await activate_linkedin_agent(action, information, cdp_url)

if __name__ == '__main__':
  asyncio.run(test())
