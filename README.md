# Resume Use

## Setup Instructions
1. Clone the repository into your local machine.
2. in the `backend` directory, create a .env file based on the `.env.example` file and fill in the required environment variables.

You need to run two services in separate terminals:

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate # On Windows use `.venv\Scripts\activate`
uv pip install -r requirements.txt
python api.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev # you need to set up your own Convex project, see https://docs.convex.dev/quickstart
```

Once they are running, open your browser to access the application.

> **Notes**
> - this app is a work in progress, we are continuously improving the functionality and user experience.
> - the app might not work perfectly since we were in a rush to get this out. please report any issues you encounter!