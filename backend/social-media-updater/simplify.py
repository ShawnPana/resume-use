import asyncio
import os
from dotenv import load_dotenv
from browser_use import Agent, Browser, ChatOpenAI

# Load from .env.local file
load_dotenv('../../.env.local')

async def activate_simplify_agent(action: str, information: dict, cdp_url: str):
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
    - After inputting text into a dropdown field, press "Tab" and "Enter" to select the first option.
    - If there is a red "Required" text under a field, it means that the field is required. If you are not given enough information, just infer as hard as you can, put in your best guess, and hit "Tab
 and "Enter" to select the first option.

    - if {action} == 'add'
        - Add ?sidebar=experience-new to the end of the URL and hit enter
        - fill in the fields with the provided information previously mentioned.
        - Save the changes by clicking the 'Save' button
        - END your process
    """

    agent = Agent(task=task, llm=ChatOpenAI(model='gpt-4.1-mini'), browser=browser)

    await agent.run()

async def init_browser_with_simplify_login(credentials: dict) -> str:
    browser = Browser(
        use_cloud=True,
        keep_alive=True
    )

    task = f"""
    - Navigate to https://simplify.jobs/auth/login
    - Locate the username input field and enter the username: {credentials['username']}
    - Locate the password input field and enter the password: {credentials['password']}
    - Click the 'Sign in' button to log in to the account
    - Ensure that the login is successful by checking if the user is redirected to their Simplify feed.
    - If login was successful, click on the profile picture icon on the top right, then click on "my profile" to go to the profile page.
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
        "username": os.getenv("SIMPLIFY_USERNAME"),
        "password": os.getenv("SIMPLIFY_PASSWORD")
    }

    cdp_url = await init_browser_with_simplify_login(credentials)

    await activate_simplify_agent(action, information, cdp_url)

async def test():
    browser = Browser(
        keep_alive=True
    )
    await browser.start()

    task=f"""

    """

    agent = Agent(
        task=task, 
        llm=ChatOpenAI(model='gpt-4.1-mini'),
        browser=browser
    )

    await agent.run()

if __name__ == '__main__':
  asyncio.run(main())