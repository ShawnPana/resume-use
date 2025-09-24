import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the resume data
const resumeData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../resume_data.json"), "utf-8")
);

// Get the Convex URL from environment
const convexUrl = process.env.VITE_CONVEX_URL;
if (!convexUrl) {
  console.error("Please set VITE_CONVEX_URL in your .env.local file");
  process.exit(1);
}

// Create a Convex client
const client = new ConvexHttpClient(convexUrl);

// Import the data
async function importData() {
  try {
    console.log("Starting import...");

    const result = await client.action(api.resumeFunctions.importResumeData, {
      data: resumeData
    });

    console.log("Import successful!", result);

    // Verify the import by fetching the data
    const fullResume = await client.query(api.resumeFunctions.getFullResume);
    console.log("\nImported data summary:");
    console.log("- Header:", fullResume.header ? "✓" : "✗");
    console.log("- Education:", fullResume.education ? "✓" : "✗");
    console.log("- Experience items:", fullResume.experience?.length || 0);
    console.log("- Project items:", fullResume.projects?.length || 0);

  } catch (error) {
    console.error("Import failed:", error);
    process.exit(1);
  }
}

importData();