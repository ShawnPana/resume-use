import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Get file path from command line argument
const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node import-resume.mjs <path-to-json-file>");
  console.error("Example: node import-resume.mjs ./backend/data/parsed_resume.json");
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Read the resume data
const resumeData = JSON.parse(
  fs.readFileSync(filePath, "utf-8")
);

console.log(`Loading resume data from: ${filePath}`);

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
    console.log("Starting import to Convex database...");

    // Show what we're importing
    console.log("\nData to import:");
    if (resumeData.header?.name) {
      console.log(`- Name: ${resumeData.header.name}`);
    }
    console.log(`- Experience entries: ${resumeData.experience?.length || 0}`);
    console.log(`- Project entries: ${resumeData.projects?.length || 0}`);

    const result = await client.action(api.resumeFunctions.importResumeData, {
      data: resumeData
    });

    console.log("\n✅ Import successful!");

    // Verify the import by fetching the data
    const fullResume = await client.query(api.resumeFunctions.getFullResume);
    console.log("\nVerified imported data:");
    console.log("- Header:", fullResume.header ? "✓" : "✗");
    console.log("- Education:", fullResume.education ? "✓" : "✗");
    console.log("- Experience items:", fullResume.experience?.length || 0);
    console.log("- Project items:", fullResume.projects?.length || 0);

  } catch (error) {
    console.error("\n❌ Import failed:", error.message || error);
    if (error.message?.includes("VITE_CONVEX_URL")) {
      console.error("\nMake sure VITE_CONVEX_URL is set in your .env.local file");
    }
    process.exit(1);
  }
}

importData();